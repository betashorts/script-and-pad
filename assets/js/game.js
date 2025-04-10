// Constants
const STEPS = 16;
let INSTRUMENTS = []; // Will be populated from MIDI file
let MIDI_MAPPING = {}; // Will store the MIDI mapping from JSON

const BEAT_CATEGORIES = {
  "Basic Beats": [
    {
      name: "Basic Rock Beat",
      file: "basic_rock_beat.mid",
      description: "Classic rock beat pattern",
    },
    {
      name: "Basic Rock Beat 2",
      file: "basic_rock_beat_2.mid",
      description: "Standard 4/4 rock beat pattern",
    },
    {
      name: "Basic Rock Beat 3",
      file: "basic_rock_beat_3.mid",
      description: "Standard 4/4 rock beat pattern",
    },
    {
      name: "Basic Rock Beat 4",
      file: "basic_rock_beat_4.mid",
      description: "Standard 4/4 rock beat pattern",
    },
    {
      name: "Basic Rock Beat 5",
      file: "basic_rock_beat_5.mid",
      description: "Standard 4/4 rock beat pattern",
    },
  ],
  "Advanced Beats": [
    {
      name: "Groove Beat",
      file: "groove_hihat_1.mid",
      description: "Standard 4/4 hihat beat pattern",
    },
    {
      name: "Basic Rock Beat 6",
      file: "basic_rock_beat_6.mid",
      description: "Standard 4/4 rock beat pattern",
    },
  ],
};

// Get all beats in a flat array when needed
const AVAILABLE_BEATS = Object.values(BEAT_CATEGORIES)
  .flat()
  .map((beat) => ({
    ...beat,
    name: formatBeatName(beat.file), // Format the beat name from the filename
  }));

// Global state
let players = {};
let userPattern = [];
let referencePattern = [];
let isPlaying = false;
let BPM = 120; // Default BPM
let currentBeat = AVAILABLE_BEATS[0]; // Start with the first beat
let uniqueBarPatterns = [];
let currentBarIndex = 0;
let fullReferencePattern = []; // Store the complete pattern

// Function to format beat name from filename (for sidebar)
function formatBeatName(filename) {
  return filename
    .replace(".mid", "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Function to format instrument name from filename
function formatInstrumentName(filename) {
  return filename
    .replace(".wav", "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Function to extract instrument name from filename
function getBaseInstrumentName(filename) {
  // Remove file extension and any numbers
  const name = filename.replace(/\.[^/.]+$/, "").replace(/\d+/g, "");
  // Split by underscore and capitalize each word
  const words = name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  // Join words with space
  return words.join(" ");
}

// Function to find sound file for MIDI note
async function findSoundFileForMidiNote(midiNote) {
  // If we haven't loaded the mapping yet, load it
  if (Object.keys(MIDI_MAPPING).length === 0) {
    try {
      const response = await fetch("../assets/json/midi_mapping.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      MIDI_MAPPING = await response.json();
    } catch (error) {
      console.error("Error loading MIDI mapping:", error);
      return `unknown_${midiNote}.wav`;
    }
  }

  // Find the mapping for this MIDI note
  const mapping = MIDI_MAPPING[midiNote];
  if (mapping && mapping.sound) {
    return mapping.sound;
  }

  // If no mapping found, return a default name
  return `unknown_${midiNote}.wav`;
}

// Load and parse MIDI file
async function loadMIDIFile(beatFile = currentBeat.file) {
  try {
    // Load MIDI mapping if not already loaded
    if (Object.keys(MIDI_MAPPING).length === 0) {
      try {
        const mappingResponse = await fetch("../assets/json/mapping.json");
        if (!mappingResponse.ok) {
          throw new Error(`HTTP error! status: ${mappingResponse.status}`);
        }
        MIDI_MAPPING = await mappingResponse.json();
      } catch (error) {
        console.error("Error loading MIDI mapping:", error);
        throw error;
      }
    }

    const response = await fetch(`../assets/midi/${beatFile}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // Create a new Midi instance
    const midi = new Midi(arrayBuffer);

    // Get BPM from MIDI file
    let fileBPM = 120; // Default BPM
    if (midi.header && midi.header.tempos && midi.header.tempos.length > 0) {
      fileBPM = midi.header.tempos[0].bpm;
    }
    BPM = fileBPM;
    Tone.Transport.bpm.value = BPM;
    document.getElementById("current-beat-bpm").textContent = `${Math.round(
      BPM
    )} BPM`;

    // Get the first track
    const track = midi.tracks[0];
    const uniqueMidiNotes = new Set();
    let maxTime = 0;

    // Initialize patterns
    referencePattern = Array(INSTRUMENTS.length)
      .fill()
      .map(() => Array(STEPS).fill(false));
    userPattern = Array(INSTRUMENTS.length)
      .fill()
      .map(() => Array(STEPS).fill(false));

    // Process notes
    if (track && track.notes) {
      track.notes.forEach((note) => {
        uniqueMidiNotes.add(note.midi);
        maxTime = Math.max(maxTime, note.time + note.duration);

        const instrumentIndex = INSTRUMENTS.findIndex(
          (instr) => instr.midiNote === note.midi
        );
        if (instrumentIndex !== -1) {
          const stepIndex = Math.floor((note.time * BPM * 16) / 60) % STEPS;
          if (stepIndex >= 0 && stepIndex < STEPS) {
            referencePattern[instrumentIndex][stepIndex] = true;
          }
        }
      });
    }

    // Create instruments array from unique MIDI notes
    INSTRUMENTS = Array.from(uniqueMidiNotes)
      .sort((a, b) => a - b)
      .map((midiNote) => {
        const soundFile = MIDI_MAPPING[midiNote];
        if (!soundFile) {
          console.warn(`No mapping found for MIDI note ${midiNote}`);
          return {
            name: `Unknown (${midiNote})`,
            file: `unknown_${midiNote}.wav`,
            midiNote: midiNote,
          };
        }
        return {
          name: formatInstrumentName(soundFile),
          file: soundFile,
          midiNote: midiNote,
        };
      });

    const totalBars = Math.ceil((maxTime * fileBPM) / 240);

    // Update debug information
    document.getElementById("debug-bpm").textContent = Math.round(fileBPM);
    document.getElementById("debug-bars").textContent = totalBars;
    document.getElementById("debug-duration").textContent = maxTime.toFixed(2);
    document.getElementById("debug-midi-notes").textContent = Array.from(
      uniqueMidiNotes
    )
      .sort((a, b) => a - b)
      .join(", ");

    // Update UI
    createPianoRoll();
    updatePianoRollUI();

    // Load samples for all instruments
    await Promise.all(
      INSTRUMENTS.map(async (instrument) => {
        try {
          players[instrument.midiNote] = new Tone.Player({
            url: `../assets/sounds/${instrument.file}`,
            autostart: false,
          }).toDestination();
          await players[instrument.midiNote].load();
        } catch (error) {
          console.error(`Error loading sample for ${instrument.name}:`, error);
        }
      })
    );
  } catch (error) {
    console.error("Error loading MIDI file:", error);
    document.getElementById(
      "status"
    ).textContent = `Error loading MIDI file: ${error.message}. Please try again.`;

    // Clear debug information on error
    document.getElementById("debug-bpm").textContent = "-";
    document.getElementById("debug-bars").textContent = "-";
    document.getElementById("debug-duration").textContent = "-";
    document.getElementById("debug-midi-notes").textContent = "-";
  }
}

// Create the piano roll grid
function createPianoRoll() {
  const pianoRoll = document.getElementById("piano-roll");
  pianoRoll.innerHTML = "";

  INSTRUMENTS.forEach((instrument, instrumentIndex) => {
    // Add instrument label
    const label = document.createElement("div");
    label.className = "instrument-label";
    label.textContent = instrument.name;
    pianoRoll.appendChild(label);

    // Add grid cells for this instrument
    for (let step = 0; step < STEPS; step++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.instrumentIndex = instrumentIndex;
      cell.dataset.step = step;

      // Add beat markers (every 4th step)
      if (step % 4 === 0) {
        cell.classList.add("beat-marker");
      }

      cell.addEventListener("click", () => {
        userPattern[instrumentIndex][step] =
          !userPattern[instrumentIndex][step];
        updatePianoRollUI();
      });

      pianoRoll.appendChild(cell);
    }
  });
}

// Update the piano roll UI
function updatePianoRollUI() {
  const cells = document.querySelectorAll(".grid-cell");
  cells.forEach((cell) => {
    const instrumentIndex = parseInt(cell.dataset.instrumentIndex);
    const step = parseInt(cell.dataset.step);

    // Clear previous state
    cell.classList.remove("active", "reference", "correct", "incorrect");

    // Add appropriate classes
    if (userPattern[instrumentIndex][step]) {
      cell.classList.add("active");
    }
    if (referencePattern[instrumentIndex][step]) {
      cell.classList.add("reference");
    }
  });
}

// Play the reference pattern
function playReferencePattern() {
  if (isPlaying) {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    isPlaying = false;
    document.getElementById("status").textContent = "Playback stopped";
    return;
  }

  // Clear any existing events
  Tone.Transport.cancel();

  // Create a sequence for each instrument
  referencePattern.forEach((row, instrumentIndex) => {
    const instrument = INSTRUMENTS[instrumentIndex];
    new Tone.Sequence(
      (time, step) => {
        if (row[step] && players[instrument.midiNote].loaded) {
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
  document.getElementById("status").textContent =
    "Playing reference pattern...";

  // Stop after one bar
  Tone.Transport.schedule(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    isPlaying = false;
    document.getElementById("status").textContent =
      "Reference playback complete";
  }, "1m");
}

// Play the user's pattern
function playUserPattern() {
  if (isPlaying) {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    isPlaying = false;
    document.getElementById("status").textContent = "Playback stopped";
    return;
  }

  // Clear any existing events
  Tone.Transport.cancel();

  // Create a sequence for each instrument
  userPattern.forEach((row, instrumentIndex) => {
    const instrument = INSTRUMENTS[instrumentIndex];
    new Tone.Sequence(
      (time, step) => {
        if (row[step] && players[instrument.midiNote].loaded) {
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
  document.getElementById("status").textContent = "Playing your pattern...";

  // Stop after one bar
  Tone.Transport.schedule(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    isPlaying = false;
    document.getElementById("status").textContent =
      "Your pattern playback complete";
  }, "1m");
}

// Check user's accuracy
function checkUserAccuracy() {
  let correct = 0;
  let total = 0;

  referencePattern.forEach((row, instrumentIndex) => {
    row.forEach((cell, step) => {
      if (cell) {
        total++;
        if (userPattern[instrumentIndex][step]) {
          correct++;
        }
      }
    });
  });

  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  document.getElementById("status").textContent = `Accuracy: ${accuracy.toFixed(
    1
  )}% (${correct}/${total} correct notes)`;
}

// Toggle solution visibility
function toggleSolution() {
  const cells = document.querySelectorAll(".grid-cell");
  cells.forEach((cell) => {
    cell.classList.toggle("show-solution");
  });
}

// Create beat list in sidebar
function createBeatList() {
  const beatList = document.getElementById("beat-list");
  beatList.innerHTML = "";

  AVAILABLE_BEATS.forEach((beat) => {
    const beatItem = document.createElement("div");
    beatItem.className = "beat-item";
    beatItem.textContent = beat.name;
    beatItem.addEventListener("click", () => {
      currentBeat = beat;
      document.getElementById("current-beat-name").textContent = beat.name;
      loadMIDIFile(beat.file);
    });
    beatList.appendChild(beatItem);
  });
}

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  // Create beat list first
  createBeatList();

  // Add event listeners only after DOM is loaded
  document
    .getElementById("playReference")
    ?.addEventListener("click", async () => {
      // Ensure audio context is started
      if (Tone.context.state !== "running") {
        await Tone.start();
      }
      playReferencePattern();
    });

  document.getElementById("playUser")?.addEventListener("click", async () => {
    // Ensure audio context is started
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    playUserPattern();
  });

  document
    .getElementById("checkAccuracy")
    ?.addEventListener("click", checkUserAccuracy);
  document
    .getElementById("toggleSolution")
    ?.addEventListener("click", toggleSolution);

  // Set up initial audio context state
  document.getElementById("status").textContent =
    "Click any button to enable audio";

  // Add a click handler to the entire document to initialize audio
  document.body.addEventListener(
    "click",
    async () => {
      try {
        if (Tone.context.state !== "running") {
          await Tone.start();
          document.getElementById("status").textContent =
            "Audio enabled - Click grid cells to create your beat!";
        }
      } catch (error) {
        console.error("Error starting audio context:", error);
        document.getElementById("status").textContent =
          "Error enabling audio. Please try again.";
      }
    },
    { once: true }
  ); // Only handle the first click

  // Load initial MIDI file
  try {
    await loadMIDIFile();
  } catch (error) {
    console.error("Error loading initial MIDI file:", error);
    document.getElementById("status").textContent =
      "Error loading beat. Please try refreshing the page.";
  }
});
