let INSTRUMENTS = [];
let MIDI_MAPPING = null;
let players = {};
let isPlaying = false;
const STEPS = 16;

// Load MIDI mapping
async function loadMIDIMapping() {
  try {
    console.log("Loading MIDI mapping...");
    const response = await fetch("../assets/json/mapping.json");
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
    // Clear existing players
    players = {};

    // Make sure Tone.js is initialized
    await Tone.start();

    // Create audio context if it doesn't exist
    if (!Tone.context) {
      Tone.context = new AudioContext();
    }

    // Load samples for all instruments
    await Promise.all(
      INSTRUMENTS.map(async (instrument) => {
        try {
          if (
            !instrument.soundFile ||
            instrument.soundFile.includes("Unknown")
          ) {
            return;
          }

          const soundPath = `../assets/sounds/${instrument.soundFile}`;

          // Create buffer first
          const buffer = new Tone.Buffer(soundPath, () => {
            console.log(`Buffer loaded for ${instrument.midiNote}`);
          });

          // Create player with buffer
          const player = new Tone.Player(buffer);

          // Connect to master output
          player.connect(Tone.getDestination());

          // Store in players object
          players[instrument.midiNote] = player;
        } catch (error) {
          console.error(
            `Error setting up player for MIDI note ${instrument.midiNote}:`,
            error
          );
        }
      })
    );

    console.log("All samples loaded");
  } catch (error) {
    console.error("Error in loadSamples:", error);
  }
}

// Create piano roll for a specific bar
function createPianoRoll(barIndex, pattern) {
  const container = document.createElement("div");
  container.className = "bar-pattern";

  const header = document.createElement("h3");
  header.innerHTML = `Bar ${
    barIndex + 1
  } <button onclick="playBar(${barIndex})">Play Bar</button>`;
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
function playBar(barIndex) {
  if (isPlaying) {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    isPlaying = false;
    return;
  }

  const pattern = window.barPatterns[barIndex];

  // Clear any existing events
  Tone.Transport.cancel();

  // Create a sequence for each instrument
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

  // Start playback
  Tone.Transport.start();
  isPlaying = true;

  // Stop after one bar
  Tone.Transport.schedule(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    isPlaying = false;
  }, "1m");
}

// Process MIDI file
async function processMidiFile(file) {
  try {
    // First ensure MIDI mapping is loaded
    if (!MIDI_MAPPING) {
      await loadMIDIMapping();
    }

    const arrayBuffer = await file.arrayBuffer();
    const midi = new Midi(arrayBuffer);

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
