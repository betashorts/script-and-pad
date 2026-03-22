// Import beat categories
import { BEAT_CATEGORIES, getAllBeats } from "../../game/constants/beats.js";

// Constants
const STEPS = 16;
let INSTRUMENTS = [];
let MIDI_MAPPING = null;

// Fix: no formatter argument — beats keep their authored names
const AVAILABLE_BEATS = getAllBeats();

// ── NEW: Tempo Multiplier ──────────────────────────────────────
let tempoMultiplier = 1.0; // range: 0.5–1.0

// ── NEW: Beat Descriptions ─────────────────────────────────────
const BEAT_DESCRIPTIONS = {
  "Basic Backbeat Foundation":  "Kick on 1 & 3, snare on 2 & 4 — the most fundamental groove in rock and pop drumming.",
  "Ghost Note Backbeat":        "Subtle ghost notes sit between snare accents, adding depth without disrupting the pulse.",
  "Clap Backbeat":              "A clap replaces the snare on beats 2 and 4 — the classic pop and hip-hop feel.",
  "Offbeat Hi-Hat Backbeat":    "Hi-hat lands on the 'ands' between beats, creating a lifted, danceable groove.",
  "Open Hi-Hat Backbeat":       "Open hi-hat rings out on select beats — listen for the 'tssh' versus the 'tick'.",
  "Tom Groove Backbeat":        "Toms fill the spaces around kick and snare, giving the groove a big, full-kit feel.",
  "Clap Syncopation":           "Syncopated claps land off the expected pulse — rhythmic tension in action.",
  "Fill Ending Backbeat":       "A short fill at the bar's end marks the phrase boundary — a drummer's punctuation mark.",
  "Linear Tom Backbeat":        "No two drums hit simultaneously — every note occupies its own unique time slot.",
  "Dynamic Backbeat":           "Loud accent hits contrast with soft ghost strokes — volume variation drives the feel.",
  "Full Funk Backbeat":         "Dense 16th-note syncopation throughout — the complete funk vocabulary in one pattern.",
  "Basic Kick Pattern":         "Straight kick on beats 1 and 3 — your foundation for all kick drum study.",
  "Syncopated Kick":            "Kick lands between expected beats — surprise placement creates forward momentum.",
  "Triplet Kick Flow":          "Triplets divide each beat into 3 equal parts — a rolling, galloping sensation.",
  "Four on the Floor":          "Kick hits every beat (1, 2, 3, 4) — the driving heartbeat of house and disco.",
  "Polyrhythmic Kick":          "Two cycles of different lengths play simultaneously, drifting in and out of alignment.",
  "Dotted Kick Rhythm":         "Dotted rhythms make the kick lean forward — an uneven lurch with sophisticated feel.",
  "Gallop Kick Pattern":        "Short-short-long groupings gallop relentlessly — essential metal and hard rock technique.",
  "Snare Call Kick":            "Kick responds to the snare in a call-and-response conversation between two drums.",
  "Linear Kick Pattern":        "Kick never overlaps any other hit — each beat breathes in its own space.",
  "Pedal Coordination":         "Left-foot hi-hat pedal adds a fourth layer — two-limb independence on full display.",
  "Fill Kick Pattern":          "Rapid kick sequences fill where hands usually go — demanding technical footwork.",
};

// ── NEW: What To Listen For hints (per beat) ──────────────────
const BEAT_HINTS = {
  "Basic Backbeat Foundation":  ["Count 1-2-3-4 — the kick hits on 1 and 3", "The sharp snare crack lands on 2 and 4", "Hi-hat keeps a steady tick throughout every beat"],
  "Ghost Note Backbeat":        ["Find the loud snare on 2 and 4 first", "Then listen for the very quiet ghost notes between them", "The groove feels heavier than a plain backbeat"],
  "Clap Backbeat":              ["The clap sounds sharper and higher-pitched than a snare", "It still sits on beats 2 and 4 — same position, different timbre", "Notice how the clap cuts through over the kick below"],
  "Offbeat Hi-Hat Backbeat":    ["Hi-hat lands on the 'ands': 1-AND-2-AND-3-AND-4-AND", "Tap your foot on 1-2-3-4 and hear the hi-hat fill the gaps", "This offset feel pushes the groove forward"],
  "Open Hi-Hat Backbeat":       ["Closed hi-hat = 'tick'; open hi-hat = 'tsssh'", "Listen for which beats ring out (open) vs cut off (closed)", "The open note typically closes on the very next hit"],
  "Tom Groove Backbeat":        ["Toms have a lower, rounder sound than the snare", "Notice where toms appear — they fill space between kick and snare", "The full-kit feel makes the groove sound bigger"],
  "Clap Syncopation":           ["Some claps don't land on the expected 2 and 4", "Tap your foot steadily and notice when the clap surprises you", "Syncopation creates rhythmic tension that wants to resolve"],
  "Fill Ending Backbeat":       ["The beat runs normally for most of the bar", "Near the end, a fill rushes through several drums quickly", "The fill signals the phrase boundary — like a musical comma"],
  "Linear Tom Backbeat":        ["At no point do two drums hit simultaneously", "Kick, snare, toms, and hi-hat each take their own turn", "Listen for the relay-race feel — always moving to a new drum"],
  "Dynamic Backbeat":           ["Some hits are much louder than others — track the volume", "Loud hits = accents; quiet hits = ghost notes", "The loudest hits usually anchor beats 2 and 4"],
  "Full Funk Backbeat":         ["There are far more notes than a basic beat — 16th notes fill every gap", "Start by finding just the kick, then the snare, then the hi-hat", "The kick rarely lands on the numbered beats in funk"],
  "Basic Kick Pattern":         ["The kick makes a deep 'boom' — locate it first", "Where does the kick land? Count 1-2-3-4 to find out", "Everything else (snare, hi-hat) fits around the kick's foundation"],
  "Syncopated Kick":            ["The kick doesn't always land on the numbered beats", "Listen for kick on 'ands' or 'e' counts between beats", "Tap steadily and notice every time the kick surprises you"],
  "Triplet Kick Flow":          ["Triplets divide a beat into 3 equal parts, not 2 or 4", "The pattern feels like a shuffling, rolling motion", "Count '1-trip-let, 2-trip-let' to lock in to the triplet pulse"],
  "Four on the Floor":          ["The kick hits on every single beat: 1, 2, 3, 4", "Four steady kicks per bar — rock-solid and driving", "Even with four kicks, the snare still holds down 2 and 4"],
  "Polyrhythmic Kick":          ["Two separate rhythmic patterns cycle at different lengths", "They line up at one point, then drift apart again", "Try to hear both layers independently, then together"],
  "Dotted Kick Rhythm":         ["A dotted note lasts 1.5× its normal length — it leans forward", "The kick rhythm has an uneven lurch, not a straight grid", "Listen for the 'long-short' feel in the kick placement"],
  "Gallop Kick Pattern":        ["The pattern groups as: short-short-long, short-short-long", "It sounds like a horse galloping — that's literally the name", "Common in metal — fast, relentless, propulsive"],
  "Snare Call Kick":            ["Listen to the snare — it sets up what the kick does next", "The kick responds or 'answers' the snare's call", "This call-and-response dialogue is a key musical device"],
  "Linear Kick Pattern":        ["The kick never overlaps with any other drum hit", "Each kick occupies its own unique moment in time", "Linear patterns breathe and open up compared to layered ones"],
  "Pedal Coordination":         ["The left foot controls the hi-hat pedal, closing it with a 'chick'", "Listen for an extra closed-hat sound — that's the left foot", "The pedal adds a fourth independent layer to the pattern"],
  "Fill Kick Pattern":          ["The kick plays rapid sequences normally done with hands", "Listen for fast, rolling kick hits — demanding pedal technique", "Notice how the fill-section feel contrasts with the main groove"],
};

// ── NEW: Genre Groups for sidebar ─────────────────────────────
const GENRE_GROUPS = {
  "🥁 Rock & Pop": [
    "Basic Backbeat Foundation", "Open Hi-Hat Backbeat", "Tom Groove Backbeat",
    "Fill Ending Backbeat", "Linear Tom Backbeat", "Dynamic Backbeat", "Four on the Floor",
  ],
  "🎸 Funk & R&B": [
    "Clap Backbeat", "Offbeat Hi-Hat Backbeat", "Clap Syncopation",
    "Full Funk Backbeat", "Syncopated Kick",
  ],
  "🎷 Jazz & Swing": [
    "Triplet Kick Flow", "Pedal Coordination",
  ],
  "🔨 Metal & Hard Rock": [
    "Gallop Kick Pattern",
  ],
  "📚 Practice Patterns": [
    "Ghost Note Backbeat", "Basic Kick Pattern", "Polyrhythmic Kick",
    "Dotted Kick Rhythm", "Snare Call Kick", "Linear Kick Pattern", "Fill Kick Pattern",
  ],
};

// ── NEW: Instrument Hints (tooltip descriptions) ───────────────
const INSTRUMENT_HINTS = {
  "Kick":        "The deep 'boom' — the heartbeat of the beat, anchoring the low end",
  "Snare":       "The sharp crack on beats 2 & 4 — the backbone of rock and pop",
  "Hi-Hat (C)":  "Steady closed ticking pulse — controls the groove and tempo feel",
  "Hi-Hat (O)":  "Left open, it rings longer — a 'tssh' instead of a 'tick'",
  "Clap":        "Reinforces or replaces the snare — bright and cutting in the mix",
  "Tom Hi":      "Higher rack tom — adds color and drama in fills",
  "Tom Lo":      "Floor tom, deeper tone — brings weight and power to fills",
  "Crash":       "Accent cymbal — signals phrase starts or dramatic moments",
  "Ride":        "Sustaining cymbal — replaces hi-hat in jazz and funk for a different texture",
};

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

    // Reset tempo slider to full speed on new beat
    resetTempoSlider();

    // Beat name — use authored name from beats.js
    const beatName = AVAILABLE_BEATS.find((b) => b.file === beatFile)?.name || "Unknown Beat";
    document.getElementById("current-beat-name").textContent = beatName;

    // NEW: Update description + hints
    updateBeatMeta(beatName);

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

  // Step number header row — NEW: subdivision labels (1, ·, +, ·, 2, ·, +, ·…)
  const labelSpacer = document.createElement("div");
  labelSpacer.className = "gm-step-num-label";
  pianoRoll.appendChild(labelSpacer);

  for (let s = 0; s < STEPS; s++) {
    const num = document.createElement("div");
    const isQuarter = s % 4 === 0;
    const isEighth  = s % 2 === 0 && !isQuarter;
    if (isQuarter) {
      num.className = "gm-step-num gm-beat-start";
      num.textContent = s / 4 + 1;
    } else if (isEighth) {
      num.className = "gm-step-num gm-beat-eighth";
      num.textContent = "+";
    } else {
      num.className = "gm-step-num gm-beat-sub";
      num.textContent = "·";
    }
    pianoRoll.appendChild(num);
  }

  usedInstruments.forEach((instrument) => {
    const originalIndex = INSTRUMENTS.findIndex((i) => i.midiNote === instrument.midiNote);

    const label = document.createElement("div");
    label.className = "instrument-label";
    label.textContent = instrument.name;

    // NEW: Add tooltip hint icon if we have a description for this instrument
    const hint = INSTRUMENT_HINTS[instrument.name];
    if (hint) {
      const icon = document.createElement("span");
      icon.className = "gm-inst-hint-icon";
      icon.textContent = "?";
      icon.setAttribute("aria-label", hint);

      const tooltip = document.createElement("div");
      tooltip.className = "gm-inst-tooltip";
      tooltip.textContent = hint;

      icon.addEventListener("mouseenter", () => tooltip.classList.add("visible"));
      icon.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
      icon.addEventListener("focus",      () => tooltip.classList.add("visible"));
      icon.addEventListener("blur",       () => tooltip.classList.remove("visible"));
      icon.addEventListener("click",      (e) => { e.stopPropagation(); tooltip.classList.toggle("visible"); });

      label.appendChild(icon);
      label.appendChild(tooltip);
    }

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
  // 16th note in ms, adjusted by tempo multiplier
  return (60000 / (BPM * tempoMultiplier)) / 4;
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

  // NEW: Apply tempo multiplier to transport BPM before starting
  Tone.Transport.bpm.value = BPM * tempoMultiplier;
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

// ── NEW: Beat Meta (description + hints) ─────────────────────

function updateBeatMeta(beatName) {
  const descEl = document.getElementById("gm-beat-description");
  if (descEl) descEl.textContent = BEAT_DESCRIPTIONS[beatName] || "";

  const hintList = document.getElementById("gm-hint-list");
  if (hintList) {
    hintList.innerHTML = "";
    const hints = BEAT_HINTS[beatName] || [];
    hints.forEach((h) => {
      const li = document.createElement("li");
      li.textContent = h;
      hintList.appendChild(li);
    });
  }

  // Close the hints details on beat change so user notices it's fresh
  const hintsDetails = document.getElementById("gm-hints-details");
  if (hintsDetails) hintsDetails.removeAttribute("open");
}

// ── NEW: Tempo Slider Reset ───────────────────────────────────

function resetTempoSlider() {
  const slider   = document.getElementById("gm-tempo-slider");
  const labelEl  = document.getElementById("gm-tempo-label");
  const bpmEl    = document.getElementById("gm-tempo-bpm");
  if (!slider) return;
  slider.value = 100;
  tempoMultiplier = 1.0;
  if (bpmEl)   bpmEl.textContent  = `${BPM} BPM`;
  if (labelEl) labelEl.textContent = "🎯 Full speed";
}

// ── NEW: Count-In Before Playback ────────────────────────────

function performCountIn() {
  return new Promise((resolve) => {
    // If already playing (stop action), skip count-in
    const beatMs = 60000 / (BPM * tempoMultiplier);
    const overlay = document.getElementById("gm-countin");
    const numEl   = document.getElementById("gm-countin-num");
    if (!overlay || !numEl) { resolve(); return; }

    overlay.classList.add("active");
    let count = 0;

    function showNext() {
      count++;
      numEl.textContent = count;
      numEl.classList.remove("pulse");
      // Trigger reflow so animation restarts
      void numEl.offsetWidth;
      numEl.classList.add("pulse");

      if (count < 4) {
        setTimeout(showNext, beatMs);
      } else {
        setTimeout(() => {
          overlay.classList.remove("active");
          resolve();
        }, beatMs);
      }
    }
    showNext();
  });
}

// ── NEW: Beat List with Genre Groups ─────────────────────────

function createBeatListGrouped() {
  const beatList = document.getElementById("beat-list");
  beatList.innerHTML = "";

  // Build a lookup from beat name → beat object
  const beatByName = {};
  AVAILABLE_BEATS.forEach((b) => { beatByName[b.name] = b; });

  Object.entries(GENRE_GROUPS).forEach(([genre, beatNames]) => {
    const beatsInGroup = beatNames
      .filter((n) => beatByName[n])
      .map((n) => beatByName[n]);

    if (!beatsInGroup.length) return;

    // Collapsible section
    const section = document.createElement("div");
    section.className = "gm-genre-section";

    const header = document.createElement("div");
    header.className = "gm-genre-header";
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.innerHTML = `<span class="gm-genre-arrow">▶</span> ${genre}`;
    section.appendChild(header);

    const beatContainer = document.createElement("div");
    beatContainer.className = "gm-genre-beats";
    section.appendChild(beatContainer);

    const toggle = () => {
      section.classList.toggle("collapsed");
    };
    header.addEventListener("click", toggle);
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });

    beatsInGroup.forEach((beat) => {
      const bpmMatch = beat.file.match(/(\d{3})\.mid$/);
      const bpm = bpmMatch ? parseInt(bpmMatch[1]) : null;
      const diff = bpm ? getDifficulty(bpm) : null;

      const item = document.createElement("div");
      item.className = "beat-item";
      item.dataset.beatName = beat.name;
      item.innerHTML =
        beat.name +
        (bpm ? `<span class="gm-bpm-tag">${bpm} BPM · ${diff.label}</span>` : "");

      item.addEventListener("click", () => {
        currentBeat = beat;
        loadMIDIFile(beat.file);
        document.querySelectorAll(".beat-item").forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
      });

      beatContainer.appendChild(item);
    });

    beatList.appendChild(section);
  });

  // Activate first item
  const first = beatList.querySelector(".beat-item");
  if (first) first.classList.add("active");
}

// ── Init ────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  try {
    createBeatListGrouped();
    updateSessionUI();

    // Unlock audio on first interaction
    const unlockAudio = async () => {
      if (Tone.context.state !== "running") {
        await Tone.start();
        document.getElementById("status").textContent = "Audio ready! Pick a beat to start.";
      }
    };
    document.addEventListener("click", unlockAudio, { once: true });

    // Button wiring — NEW: count-in wraps both Listen and Play Mine
    document.getElementById("playReference")?.addEventListener("click", async () => {
      await unlockAudio();
      if (!isPlaying) await performCountIn();
      playReferencePattern();
    });

    document.getElementById("playUser")?.addEventListener("click", async () => {
      await unlockAudio();
      if (!isPlaying) await performCountIn();
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

    // NEW: Tempo slider wiring
    const tempoSlider = document.getElementById("gm-tempo-slider");
    const tempoLabelEl = document.getElementById("gm-tempo-label");
    const tempoBpmEl   = document.getElementById("gm-tempo-bpm");

    if (tempoSlider) {
      tempoSlider.addEventListener("input", () => {
        const pct = parseInt(tempoSlider.value);
        tempoMultiplier = pct / 100;
        const actualBpm = Math.round(BPM * tempoMultiplier);
        if (tempoBpmEl)   tempoBpmEl.textContent   = `${actualBpm} BPM`;
        if (tempoLabelEl) tempoLabelEl.textContent  = pct < 100
          ? "🐢 Slow mode — build up to full speed"
          : "🎯 Full speed";
      });
    }

    // Bootstrap
    await loadMIDIMapping();
    createBeatListGrouped(); // re-run after mapping ready (no-op if already built)
    await loadMIDIFile(AVAILABLE_BEATS[0].file);
    Tone.Transport.bpm.value = BPM;
  } catch (error) {
    console.error("Error during initialization:", error);
    document.getElementById("status").textContent =
      "Error initializing. Please refresh the page.";
  }
});
