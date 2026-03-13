// Import beat categories
import { BEAT_CATEGORIES, getAllBeats } from "../../game/constants/beats.js";

// Constants
const STEPS = 16;
let INSTRUMENTS = [];
let MIDI_MAPPING = null;

// Fix: no formatter argument — beats keep their authored names
const AVAILABLE_BEATS = getAllBeats();

// Global state
let players = {};
let userPattern = [];
let referencePattern = [];
let isPlaying = false;
let isLoopOn = false;
let BPM = 100;
let currentBeat = AVAILABLE_BEATS[0];
let currentStep = -1;
let playheadInterval = null;

// Session state (no localStorage — resets on page refresh)
let sessionScore = 0;
let sessionStreak = 0;
let sessionBest = null;

// ── Utility ────────────────────────────────────────────────────

// Clean instrument display names
function formatInstrumentName(filename) {
  const niceName = {
    "kick.wav":          "Kick",
    "snare.wav":         "Snare",
    "hihat_closed.wav":  "Hi-Hat (C)",
    "hihat_open.wav":    "Hi-Hat (O)",
    "clap.wav":          "Clap",
    "tom_high.wav":      "Tom Hi",
    "tom_low.wav":       "Tom Lo",
    "crash.wav":         "Crash",
    "ride.wav":          "Ride",
  };
  if (niceName[filename]) return niceName[filename];
  return filename
    .replace(".wav", "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getDifficulty(bpm) {
  if (bpm < 95)  return { label: "Easy",   cls: "gm-badge-easy" };
  if (bpm <= 110) return { label: "Medium", cls: "gm-badge-medium" };
  return { label: "Hard", cls: "gm-badge-hard" };
}

function updateDifficultyBadge(bpm) {
  const el = document.getElementById("gm-difficulty");
  if (!el) return;
  const d = getDifficulty(bpm);
  el.textContent = d.label;
  el.className = "gm-badge " + d.cls;
}

function updateSessionUI() {
  const scoreEl  = document.getElementById("gm-session-score");
  const streakEl = document.getElementById("gm-session-streak");
  const bestEl   = document.getElementById("gm-session-best");
  if (scoreEl)  scoreEl.textContent  = sessionScore;
  if (streakEl) streakEl.textContent = sessionStreak;
  if (bestEl)   bestEl.textContent   = sessionBest !== null ? sessionBest.toFixed(0) + "%" : "—";
}

// ── Result Panel ───────────────────────────────────────────────

function showResult(accuracy, correct, total) {
  const panel = document.getElementById("gm-result");
  const pct   = document.getElementById("gm-result-pct");
  const notes = document.getElementById("gm-result-notes");
  const stars = document.getElementById("gm-stars");
  const msg   = document.getElementById("gm-result-msg");
  if (!panel) return;

  panel.classList.add("visible");
  pct.textContent   = accuracy.toFixed(1) + "%";
  notes.textContent = `${correct} / ${total} notes correct`;

  const starCount = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;
  stars.querySelectorAll(".gm-star").forEach((s, i) => {
    s.classList.toggle("lit", i < starCount);
  });

  const messages = {
    3: "🎬 Perfect take! Scene, print!",
    2: "👏 Great rhythm — nearly there!",
    1: "🎵 Good start — keep rehearsing.",
    0: "🎙 Listen again and feel the groove.",
  };
  msg.textContent = messages[starCount];

  // Update session stats
  if (total > 0) {
    sessionScore += Math.round(accuracy) * (starCount + 1);
    sessionStreak = accuracy >= 70 ? sessionStreak + 1 : 0;
    if (sessionBest === null || accuracy > sessionBest) sessionBest = accuracy;
    updateSessionUI();
  }
}

function hideResult() {
  const panel = document.getElementById("gm-result");
  if (panel) panel.classList.remove("visible");
}

// ── MIDI Mapping ───────────────────────────────────────────────

async function loadMIDIMapping() {
  try {
    const response = await fetch("/assets/game/json/mapping.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    MIDI_MAPPING = await response.json();
  } catch (error) {
    console.error("Error loading MIDI mapping:", error);
    throw error;
  }
}

function findSoundFileForMidiNote(midiNote) {
  if (!MIDI_MAPPING) return `Unknown (${midiNote})`;
  return MIDI_MAPPING[midiNote] || `Unknown (${midiNote})`;
}

// ── MIDI File ──────────────────────────────────────────────────

async function loadMIDIFile(beatFile = AVAILABLE_BEATS[0].file) {
  try {
    if (!MIDI_MAPPING) await loadMIDIMapping();

    const response = await fetch(`/assets/game/midi/${beatFile}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();

    if (typeof Midi === "undefined") throw new Error("MIDI library not loaded!");
    const midi = new Midi(arrayBuffer);

    // BPM
    const bpm = Math.round(midi.header.tempos[0]?.bpm || 100);
    BPM = bpm;
    Tone.Transport.bpm.value = bpm;
    document.getElementById("current-beat-bpm").textContent = `${bpm} BPM`;
    updateDifficultyBadge(bpm);

    // Beat name — use authored name from beats.js
    const beatName = AVAILABLE_BEATS.find((b) => b.file === beatFile)?.name || "Unknown Beat";
    document.getElementById("current-beat-name").textContent = beatName;

    // Collect unique MIDI notes
    const uniqueNotes = new Set();
    midi.tracks.forEach((track) => track.notes.forEach((n) => uniqueNotes.add(n.midi)));

    INSTRUMENTS = Array.from(uniqueNotes).map((note) => ({
      midiNote:  note,
      soundFile: findSoundFileForMidiNote(note),
      name:      formatInstrumentName(findSoundFileForMidiNote(note)),
      sample:    null,
    }));

    // Build reference pattern
    referencePattern = Array(INSTRUMENTS.length).fill().map(() => Array(16).fill(false));
    midi.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        const idx = INSTRUMENTS.findIndex(
          (i) => i.midiNote === note.midi && !i.soundFile.includes("Unknown")
        );
        if (idx !== -1) {
          const startTick = Math.floor(note.ticks / (midi.header.ppq / 4));
          if (startTick < 16) referencePattern[idx][startTick] = true;
        }
      });
    });

    // Debug info
    document.getElementById("debug-time-signature").textContent =
      `${midi.header.timeSignatures[0]?.timeSignature[0] || 4}/${midi.header.timeSignatures[0]?.timeSignature[1] || 4}`;
    const calcBPM = Math.round((midi.durationTicks / midi.header.ppq) * (60 / midi.duration));
    document.getElementById("debug-bpm").textContent = calcBPM;
    document.getElementById("debug-bars").textContent = Math.ceil(midi.durationTicks / (midi.header.ppq * 4));
    document.getElementById("debug-midi-notes").textContent = Array.from(uniqueNotes).join(", ");
    document.getElementById("debug-duration").textContent = midi.duration.toFixed(2);

    await loadSamples();
    createPianoRoll();
    hideResult();
    document.getElementById("status").textContent = "Ready! Press ▶ Listen to Beat to start.";
  } catch (error) {
    console.error("Error in loadMIDIFile:", error);
    document.getElementById("status").textContent = "Error loading beat. Please try again.";
    throw error;
  }
}

// ── Piano Roll ─────────────────────────────────────────────────

function createPianoRoll() {
  const pianoRoll = document.getElementById("piano-roll");
  pianoRoll.innerHTML = "";

  userPattern = Array(INSTRUMENTS.length).fill().map(() => Array(STEPS).fill(false));

  const usedInstruments = INSTRUMENTS.filter((_, i) =>
    referencePattern[i].some((s) => s === true)
  );

  // Step number header row
  const labelSpacer = document.createElement("div");
  labelSpacer.className = "gm-step-num-label";
  pianoRoll.appendChild(labelSpacer);

  for (let s = 0; s < STEPS; s++) {
    const num = document.createElement("div");
    num.className = "gm-step-num" + (s % 4 === 0 ? " gm-beat-start" : "");
    num.textContent = s % 4 === 0 ? s / 4 + 1 : "";
    pianoRoll.appendChild(num);
  }

  usedInstruments.forEach((instrument) => {
    const originalIndex = INSTRUMENTS.findIndex((i) => i.midiNote === instrument.midiNote);

    const label = document.createElement("div");
    label.className = "instrument-label";
    label.textContent = instrument.name;
    pianoRoll.appendChild(label);

    for (let step = 0; step < STEPS; step++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.instrumentIndex = originalIndex;
      cell.dataset.step = step;

      if (step % 4 === 0) cell.classList.add("beat-marker");

      cell.addEventListener("click", () => {
        userPattern[originalIndex][step] = !userPattern[originalIndex][step];

        if (userPattern[originalIndex][step]) {
          const player = players[instrument.midiNote];
          if (player) try { player.start(); } catch (e) { /* ignore */ }
        }

        updatePianoRollUI();
      });

      pianoRoll.appendChild(cell);
    }
  });
}

function updatePianoRollUI() {
  document.querySelectorAll(".grid-cell").forEach((cell) => {
    const idx  = parseInt(cell.dataset.instrumentIndex);
    const step = parseInt(cell.dataset.step);

    cell.classList.remove("active", "reference", "correct", "incorrect");
    if (userPattern[idx][step])    cell.classList.add("active");
    if (referencePattern[idx][step]) cell.classList.add("reference");
  });
  updatePlayheadUI();
}

function updatePlayheadUI() {
  document.querySelectorAll(".grid-cell").forEach((cell) => {
    const step = parseInt(cell.dataset.step);
    cell.classList.toggle("gm-playhead", step === currentStep && isPlaying);
  });
}

// ── Playhead ───────────────────────────────────────────────────

function getStepDuration() {
  // 16th note in ms
  return (60000 / BPM) / 4;
}

function startPlayhead() {
  stopPlayhead();
  currentStep = 0;
  updatePlayheadUI();
  playheadInterval = setInterval(() => {
    currentStep = (currentStep + 1) % STEPS;
    updatePlayheadUI();
  }, getStepDuration());
}

function stopPlayhead() {
  if (playheadInterval) {
    clearInterval(playheadInterval);
    playheadInterval = null;
  }
  currentStep = -1;
  updatePlayheadUI();
}

// ── Playback ───────────────────────────────────────────────────

function schedulePlayback(pattern, statusMsg, afterMsg) {
  if (isPlaying) {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    stopPlayhead();
    isPlaying = false;
    document.getElementById("status").textContent = "Playback stopped";
    return;
  }

  Tone.Transport.cancel();

  pattern.forEach((row, instrumentIndex) => {
    const instrument = INSTRUMENTS[instrumentIndex];
    new Tone.Sequence(
      (time, step) => {
        if (row[step] && players[instrument.midiNote]?.loaded) {
          players[instrument.midiNote].start(time);
        }
      },
      [...Array(STEPS).keys()],
      "16n"
    ).start(0);
  });

  Tone.Transport.start();
  isPlaying = true;
  document.getElementById("status").textContent = statusMsg;
  startPlayhead();

  function scheduleStop() {
    Tone.Transport.schedule(() => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      stopPlayhead();
      isPlaying = false;
      document.getElementById("status").textContent = afterMsg;

      if (isLoopOn) {
        setTimeout(() => schedulePlayback(pattern, statusMsg, afterMsg), 150);
      }
    }, "1m");
  }
  scheduleStop();
}

function playReferencePattern() {
  schedulePlayback(
    referencePattern,
    "Playing reference beat…",
    "Reference done. Now recreate it!"
  );
}

function playUserPattern() {
  schedulePlayback(
    userPattern,
    "Playing your version…",
    "How did that sound?"
  );
}

// ── Accuracy ───────────────────────────────────────────────────

function checkUserAccuracy() {
  let correct = 0;
  let total = 0;

  referencePattern.forEach((row, instrumentIndex) => {
    row.forEach((cell, step) => {
      if (cell) {
        total++;
        if (userPattern[instrumentIndex][step]) correct++;
      }
    });
  });

  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  document.getElementById("status").textContent =
    `Accuracy: ${accuracy.toFixed(1)}% (${correct}/${total} notes)`;
  showResult(accuracy, correct, total);
}

// ── Solution ───────────────────────────────────────────────────

function toggleSolution() {
  document.querySelectorAll(".grid-cell").forEach((cell) =>
    cell.classList.toggle("show-solution")
  );
}

// ── Clear ──────────────────────────────────────────────────────

function clearPattern() {
  if (!INSTRUMENTS.length) return;
  userPattern = Array(INSTRUMENTS.length).fill().map(() => Array(STEPS).fill(false));
  hideResult();
  updatePianoRollUI();
  document.getElementById("status").textContent = "Pattern cleared. Start fresh!";
}

// ── Beat List ──────────────────────────────────────────────────

function createBeatList() {
  const beatList = document.getElementById("beat-list");
  beatList.innerHTML = "";

  Object.entries(BEAT_CATEGORIES).forEach(([category, beats]) => {
    if (!beats.length) return; // skip empty categories

    const catLabel = document.createElement("div");
    catLabel.className = "gm-cat-label";
    catLabel.textContent = category;
    beatList.appendChild(catLabel);

    beats.forEach((beat) => {
      const bpmMatch = beat.file.match(/(\d{3})\.mid$/);
      const bpm = bpmMatch ? parseInt(bpmMatch[1]) : null;
      const diff = bpm ? getDifficulty(bpm) : null;

      const item = document.createElement("div");
      item.className = "beat-item";
      item.innerHTML =
        beat.name +
        (bpm
          ? `<span class="gm-bpm-tag">${bpm} BPM · ${diff.label}</span>`
          : "");

      item.addEventListener("click", () => {
        currentBeat = beat;
        loadMIDIFile(beat.file);
        document
          .querySelectorAll(".beat-item")
          .forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
      });

      beatList.appendChild(item);
    });
  });

  // Activate first item
  const first = beatList.querySelector(".beat-item");
  if (first) first.classList.add("active");
}

// ── Samples ────────────────────────────────────────────────────

async function loadSamples() {
  players = {};
  await Tone.start();
  if (!Tone.context) Tone.context = new AudioContext();

  await Promise.all(
    INSTRUMENTS.map(async (instrument) => {
      if (!instrument.soundFile || instrument.soundFile.includes("Unknown")) return;
      try {
        const soundPath = `/assets/game/sounds/${instrument.soundFile}`;
        const buffer = new Tone.Buffer(soundPath, () => {});
        const player = new Tone.Player(buffer);
        player.connect(Tone.getDestination());
        players[instrument.midiNote] = player;
      } catch (error) {
        console.error(`Error loading sample for ${instrument.midiNote}:`, error);
      }
    })
  );
}

// ── Init ────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  try {
    createBeatList();
    updateSessionUI();

    // Unlock audio on first interaction
    const unlockAudio = async () => {
      if (Tone.context.state !== "running") {
        await Tone.start();
        document.getElementById("status").textContent = "Audio ready! Pick a beat to start.";
      }
    };
    document.addEventListener("click", unlockAudio, { once: true });

    // Button wiring
    document.getElementById("playReference")?.addEventListener("click", async () => {
      await unlockAudio();
      playReferencePattern();
    });

    document.getElementById("playUser")?.addEventListener("click", async () => {
      await unlockAudio();
      playUserPattern();
    });

    document.getElementById("checkAccuracy")?.addEventListener("click", checkUserAccuracy);
    document.getElementById("toggleSolution")?.addEventListener("click", toggleSolution);
    document.getElementById("clearPattern")?.addEventListener("click", clearPattern);

    document.getElementById("loopToggle")?.addEventListener("click", function () {
      isLoopOn = !isLoopOn;
      this.textContent = `↺ Loop: ${isLoopOn ? "On" : "Off"}`;
      this.classList.toggle("gm-loop-on", isLoopOn);
    });

    // Bootstrap
    await loadMIDIMapping();
    createBeatList(); // re-run after mapping ready (no-op if already built)
    await loadMIDIFile(AVAILABLE_BEATS[0].file);
    Tone.Transport.bpm.value = BPM;
  } catch (error) {
    console.error("Error during initialization:", error);
    document.getElementById("status").textContent =
      "Error initializing. Please refresh the page.";
  }
});
