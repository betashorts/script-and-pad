// --- Grouped MIDI Patterns Feature ---
import { getAllBeats } from "../../game/constants/beats.js";

let INSTRUMENTS = [];
let MIDI_MAPPING = null; // Loaded from Midi mapping json file
let players = {};
let isPlaying = false;
const STEPS = 16;

// Load MIDI mapping
async function loadMIDIMapping() {
  try {
    console.log("Loading MIDI mapping...");
    const response = await fetch("/assets/game/json/mapping.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    MIDI_MAPPING = await response.json();
    console.log("MIDI mapping loaded:", MIDI_MAPPING);
    return MIDI_MAPPING;
  } catch (error) {
    console.error("Error loading MIDI mapping:", error);
    throw error;
  }
}

// Find sound file for MIDI note
function findSoundFileForMidiNote(midiNote) {
  if (!MIDI_MAPPING) {
    console.error("MIDI mapping not loaded!");
    return `Unknown (${midiNote})`;
  }

  const soundFile = MIDI_MAPPING[midiNote];
  if (!soundFile) {
    console.warn(`No sound file found for MIDI note ${midiNote}`);
    return `Unknown (${midiNote})`;
  }

  return soundFile;
}

// Load audio samples
async function loadSamples() {
  try {
    console.log("Starting loadSamples function");
    console.log("Current INSTRUMENTS array:", INSTRUMENTS);

    // Clear existing players
    players = {};

    // Make sure Tone.js is initialized
    await Tone.start();

    // Create audio context if it doesn't exist
    if (!Tone.context) {
      Tone.context = new AudioContext();
    }

    // Load samples for all instruments
    console.log("Beginning to load samples for instruments");
    await Promise.all(
      INSTRUMENTS.map(async (instrument) => {
        try {
          console.log(`Processing instrument: ${JSON.stringify(instrument)}`);

          if (
            !instrument.soundFile ||
            instrument.soundFile.includes("Unknown")
          ) {
            console.warn(
              `Skipping invalid sound file for MIDI note ${instrument.midiNote}:`,
              instrument.soundFile
            );
            return;
          }

          // Ensure the sound file path is correct and the file exists : Testing
          const soundPath = `../assets/game/sounds/${instrument.soundFile}`;
          console.log(`Attempting to load sound from path: ${soundPath}`);

          // Create buffer first
          const buffer = new Tone.Buffer(soundPath, () => {
            console.log(`Buffer loaded for ${instrument.midiNote}`);
          });

          // Create player with buffer
          const player = new Tone.Player(buffer).toDestination();

          // Store in players object
          players[instrument.midiNote] = player;

          console.log(`Player ${instrument.midiNote} setup complete`);
        } catch (error) {
          console.error(
            `Error setting up player for MIDI note ${instrument.midiNote}:`,
            {
              error: error,
              instrument: instrument,
              stack: error.stack,
            }
          );
        }
      })
    );

    console.log("All samples loading process complete");
    console.log("Final players object:", Object.keys(players));
  } catch (error) {
    console.error("Error in loadSamples:", {
      error: error,
      stack: error.stack,
      instruments: INSTRUMENTS,
    });
  }
}

// Function to create and download MIDI file for a single bar
function downloadBar(barIndex) {
  try {
    const pattern = window.barPatterns[barIndex];
    if (!pattern) {
      console.error("No pattern found for bar", barIndex);
      return;
    }

    // Create a new MIDI file
    const midi = new Midi();

    // Get BPM from display
    const bpm =
      parseInt(document.getElementById("bpm-display").textContent) || 120;
    midi.header.setTempo(bpm);

    // Set time signature (4/4)
    const timeSignature = document
      .getElementById("time-signature-display")
      .textContent.split("/");
    midi.header.timeSignatures.push({
      ticks: 0,
      timeSignature: [parseInt(timeSignature[0]), parseInt(timeSignature[1])],
    });

    // Use the source MIDI file's PPQ value from the original file
    // This value is stored when processing the original MIDI file
    midi.header.ppq = window.sourceMidiPPQ || 480; // Fallback to 480 if not set

    // Create a track
    const track = midi.addTrack();

    // Add notes for each instrument
    pattern.forEach((row, instrumentIndex) => {
      const instrument = INSTRUMENTS[instrumentIndex];
      if (!instrument) return;

      row.forEach((isActive, step) => {
        if (isActive) {
          // Calculate precise timing using the source PPQ
          const startTicks = Math.round((step * midi.header.ppq) / 4);
          const durationTicks = Math.round(midi.header.ppq / 4); // Duration of one 16th note

          track.addNote({
            midi: instrument.midiNote,
            ticks: startTicks,
            durationTicks: durationTicks,
            velocity: 0.8, // Default velocity
          });
        }
      });
    });

    // Convert to blob and download
    const blob = new Blob([midi.toArray()], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bar_${barIndex + 1}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading bar:", error);
  }
}

// Create piano roll for a specific bar
function createPianoRoll(barIndex, pattern) {
  const container = document.createElement("div");
  container.className = "bar-pattern";

  const header = document.createElement("h3");
  header.innerHTML = `Bar ${
    barIndex + 1
  } <button onclick="playBar(${barIndex})">Play Bar</button>
    <button onclick="downloadBar(${barIndex})" class="download-btn">Download Bar</button>`;
  container.appendChild(header);

  const pianoRoll = document.createElement("div");
  pianoRoll.className = "piano-roll";

  // Filter out unused instruments in this pattern
  const usedInstruments = INSTRUMENTS.filter((_, index) =>
    pattern[index].some((step) => step === true)
  );

  // Map original indices
  const instrumentIndices = usedInstruments.map((inst) =>
    INSTRUMENTS.findIndex((i) => i.midiNote === inst.midiNote)
  );

  // Create a row for each instrument
  usedInstruments.forEach((instrument, displayIndex) => {
    const originalIndex = instrumentIndices[displayIndex];
    const row = document.createElement("div");
    row.className = "piano-roll-row";

    // Add instrument label
    const label = document.createElement("div");
    label.className = "instrument-label";
    const instrumentName =
      MIDI_MAPPING && MIDI_MAPPING[instrument.midiNote]
        ? MIDI_MAPPING[instrument.midiNote].split(".")[0].replace(/_/g, " ")
        : `Note ${instrument.midiNote}`;
    label.textContent = instrumentName;
    row.appendChild(label);

    // Add grid cells for this instrument
    for (let step = 0; step < STEPS; step++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";

      // Add beat markers
      if (step % 4 === 0) {
        cell.classList.add("beat-marker");
      }

      // Show active notes
      if (pattern[originalIndex][step]) {
        cell.classList.add("active");
      }

      row.appendChild(cell);
    }

    pianoRoll.appendChild(row);
  });

  container.appendChild(pianoRoll);
  return container;
}

// Play a specific bar
async function playBar(barIndex) {
  try {
    // If already playing, stop current playback
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      isPlaying = false;
      return;
    }

    // Initialize Tone.js if needed
    await Tone.start();

    // Get the pattern for this bar
    const pattern = window.barPatterns[barIndex];
    if (!pattern) {
      console.error("No pattern found for bar", barIndex);
      return;
    }

    // Set the BPM from the display
    const bpm =
      parseInt(document.getElementById("bpm-display").textContent) || 120;
    Tone.Transport.bpm.value = bpm;

    // Clear any existing events
    Tone.Transport.cancel();

    // Create a sequence for each instrument that has notes in this pattern
    pattern.forEach((row, instrumentIndex) => {
      // Skip if instrument has no active notes in this pattern
      if (!row.some((step) => step === true)) return;

      const instrument = INSTRUMENTS[instrumentIndex];
      if (!instrument || !players[instrument.midiNote]) return;

      const seq = new Tone.Sequence(
        (time, step) => {
          if (row[step] && players[instrument.midiNote]?.loaded) {
            players[instrument.midiNote].start(time);
          }
        },
        [...Array(STEPS).keys()],
        "16n"
      ).start(0);

      // Stop sequence after one bar
      Tone.Transport.schedule(() => {
        seq.stop();
        seq.dispose();
      }, "1m");
    });

    // Start playback
    Tone.Transport.start();
    isPlaying = true;

    // Stop after one bar
    Tone.Transport.schedule(() => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      isPlaying = false;
    }, "1m");
  } catch (error) {
    console.error("Error in playBar:", error);
    isPlaying = false;
  }
}
window.playBar = playBar;

// Process MIDI file
async function processMidiFile(file) {
  try {
    // First ensure MIDI mapping is loaded
    if (!MIDI_MAPPING) {
      await loadMIDIMapping();
    }

    const arrayBuffer = await file.arrayBuffer();
    const midi = new Midi(arrayBuffer);

    // Store the source MIDI file's PPQ value for later use
    window.sourceMidiPPQ = midi.header.ppq;
    console.log("Source MIDI PPQ:", window.sourceMidiPPQ);

    // Update MIDI info display
    document.getElementById("bpm-display").textContent = Math.round(
      midi.header.tempos[0]?.bpm || 120
    );
    document.getElementById("time-signature-display").textContent = `${
      midi.header.timeSignatures[0]?.timeSignature[0] || 4
    }/${midi.header.timeSignatures[0]?.timeSignature[1] || 4}`;
    document.getElementById(
      "duration-display"
    ).textContent = `${midi.duration.toFixed(2)}s`;

    // Get unique MIDI notes
    const uniqueNotes = new Set();
    midi.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        uniqueNotes.add(note.midi);
      });
    });

    document.getElementById("midi-notes-display").textContent =
      Array.from(uniqueNotes).join(", ");

    // Create INSTRUMENTS array with proper naming
    INSTRUMENTS = Array.from(uniqueNotes).map((note) => {
      const soundFile = findSoundFileForMidiNote(note);
      const name = soundFile.includes("Unknown")
        ? `Note ${note}`
        : soundFile.split(".")[0].replace(/_/g, " ");
      return {
        midiNote: note,
        soundFile,
        name,
      };
    });

    // Calculate total bars
    const totalBars = Math.ceil(midi.durationTicks / (midi.header.ppq * 4));
    document.getElementById("total-bars-display").textContent = totalBars;

    // Create patterns for each bar
    window.barPatterns = [];
    for (let bar = 0; bar < totalBars; bar++) {
      const pattern = Array(INSTRUMENTS.length)
        .fill()
        .map(() => Array(STEPS).fill(false));
      const barStartTick = bar * midi.header.ppq * 4;
      const barEndTick = (bar + 1) * midi.header.ppq * 4;

      midi.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          if (note.ticks >= barStartTick && note.ticks < barEndTick) {
            const instrumentIndex = INSTRUMENTS.findIndex(
              (inst) => inst.midiNote === note.midi
            );
            if (instrumentIndex !== -1) {
              const stepInBar = Math.floor(
                (note.ticks - barStartTick) / (midi.header.ppq / 4)
              );
              if (stepInBar < STEPS) {
                pattern[instrumentIndex][stepInBar] = true;
              }
            }
          }
        });
      });
      window.barPatterns.push(pattern);
    }

    // Display patterns
    const patternsContainer = document.getElementById("bar-patterns");
    patternsContainer.innerHTML = "";
    window.barPatterns.forEach((pattern, index) => {
      patternsContainer.appendChild(createPianoRoll(index, pattern));
    });

    // Load samples
    await loadSamples();

    console.log("MIDI file processed successfully");
  } catch (error) {
    console.error("Error processing MIDI file:", error);
  }
}

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const uploadButton = document.getElementById("uploadButton");
  const fileInput = document.getElementById("midiFileInput");

  uploadButton.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (file) {
      await processMidiFile(file);
    } else {
      alert("Please select a MIDI file first");
    }
  });
});

async function getPatternSignatureForMidiFile(midiFile) {
  // Fetch and parse the MIDI file, then return a stringified pattern signature : Test
  const midiPath = `/assets/game/midi/${midiFile}`;
  const response = await fetch(midiPath);
  const arrayBuffer = await response.arrayBuffer();
  const midi = new Midi(arrayBuffer);
  // Use the first bar's pattern as the signature (or all bars if you want to be strict)
  const uniqueNotes = Array.from(
    new Set(
      midi.tracks.flatMap((track) => track.notes.map((note) => note.midi))
    )
  );
  const INSTRUMENTS = uniqueNotes.map((note) => ({ midiNote: note }));
  const STEPS = 16;
  const totalBars = Math.ceil(midi.durationTicks / (midi.header.ppq * 4));
  let barPatterns = [];
  for (let bar = 0; bar < totalBars; bar++) {
    const pattern = Array(INSTRUMENTS.length)
      .fill()
      .map(() => Array(STEPS).fill(false));
    const barStartTick = bar * midi.header.ppq * 4;
    const barEndTick = (bar + 1) * midi.header.ppq * 4;
    midi.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        if (note.ticks >= barStartTick && note.ticks < barEndTick) {
          const instrumentIndex = INSTRUMENTS.findIndex(
            (inst) => inst.midiNote === note.midi
          );
          if (instrumentIndex !== -1) {
            const stepInBar = Math.floor(
              (note.ticks - barStartTick) / (midi.header.ppq / 4)
            );
            if (stepInBar < STEPS) {
              pattern[instrumentIndex][stepInBar] = true;
            }
          }
        }
      });
    });
    barPatterns.push(pattern);
  }
  // Use all bars for signature (for strict grouping)
  return JSON.stringify(barPatterns);
}

async function groupMidiFilesByPattern() {
  const beats = getAllBeats();
  const groups = {};
  for (const beat of beats) {
    try {
      const signature = await getPatternSignatureForMidiFile(beat.file);
      if (!groups[signature]) groups[signature] = [];
      groups[signature].push(beat);
    } catch (e) {
      console.error("Error processing MIDI file for grouping:", beat.file, e);
    }
  }
  return groups;
}

async function renderGroupedMidiPatterns() {
  const container = document.getElementById("grouped-midi-patterns");
  container.innerHTML = "<div>Loading grouped MIDI patterns...</div>";
  const groups = await groupMidiFilesByPattern();
  container.innerHTML = "";
  let groupIndex = 0;
  for (const [signature, beats] of Object.entries(groups)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "midi-pattern-group";
    const header = document.createElement("h3");
    header.textContent = `Pattern Group #${++groupIndex} (${
      beats.length
    } file(s))`;
    groupDiv.appendChild(header);
    const fileList = document.createElement("ul");
    beats.forEach((beat) => {
      const li = document.createElement("li");
      li.textContent = beat.name + " (" + beat.file + ") ";
      const loadBtn = document.createElement("button");
      loadBtn.textContent = "Load in Piano Roll";
      loadBtn.onclick = () => processMidiFileFromAssets(beat.file);
      li.appendChild(loadBtn);
      fileList.appendChild(li);
    });
    groupDiv.appendChild(fileList);
    container.appendChild(groupDiv);
  }
}

// Helper to process MIDI file from assets (not upload)
async function processMidiFileFromAssets(filename) {
  const midiPath = `/assets/game/midi/${filename}`;
  const response = await fetch(midiPath);
  const file = new File([await response.arrayBuffer()], filename);
  await processMidiFile(file);
}

// On DOMContentLoaded, render grouped patterns
window.addEventListener("DOMContentLoaded", () => {
  renderGroupedMidiPatterns();
});
