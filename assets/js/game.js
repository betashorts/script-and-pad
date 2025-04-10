// Constants
const STEPS = 16;
let INSTRUMENTS = []; // Will be populated from MIDI file
let MIDI_MAPPING = null;

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

async function loadMIDIMapping() {
  try {
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

// Load and parse MIDI file
async function loadMIDIFile(beatFile = AVAILABLE_BEATS[0].file) {
  try {
    // First ensure MIDI mapping is loaded
    if (!MIDI_MAPPING) {
      await loadMIDIMapping();
    }

    // Then load the MIDI file
    const response = await fetch(`../assets/midi/${beatFile}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // Check if MIDI library is loaded
    if (typeof Midi === "undefined") {
      throw new Error("MIDI library not loaded!");
    }

    const midi = new Midi(arrayBuffer);
    console.log("MIDI file loaded:", midi);

    // Set BPM
    const bpm = Math.round(midi.header.tempos[0]?.bpm || 120);
    Tone.Transport.bpm.value = bpm;
    document.getElementById("bpm-display").textContent = `BPM: ${bpm}`;

    // Get unique MIDI notes
    const uniqueNotes = new Set();
    midi.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        uniqueNotes.add(note.midi);
      });
    });

    // Create INSTRUMENTS array from unique notes
    INSTRUMENTS = Array.from(uniqueNotes).map((note) => ({
      midiNote: note,
      soundFile: findSoundFileForMidiNote(note),
      sample: null, // Will be loaded later
    }));

    console.log("Created instruments:", INSTRUMENTS);

    // Fill in referencePattern based on MIDI notes
    referencePattern = Array(INSTRUMENTS.length)
      .fill()
      .map(() => Array(16).fill(false));
    midi.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        const instrumentIndex = INSTRUMENTS.findIndex(
          (inst) => inst.midiNote === note.midi
        );
        if (instrumentIndex !== -1) {
          const startTick = Math.floor((note.time * 16) / (60 / bpm));
          if (startTick < 16) {
            referencePattern[instrumentIndex][startTick] = true;
          }
        }
      });
    });

    // Update debug info
    document.getElementById("bars-display").textContent = `Bars: ${
      midi.header.timeSignatures[0]?.timeSignature[0] || 4
    }/${midi.header.timeSignatures[0]?.timeSignature[1] || 4}`;
    document.getElementById(
      "notes-display"
    ).textContent = `MIDI Notes: ${Array.from(uniqueNotes).join(", ")}`;
    document.getElementById(
      "duration-display"
    ).textContent = `Duration: ${midi.duration.toFixed(2)}s`;

    // Load samples
    await loadSamples();
    console.log("Samples loaded successfully");

    // Create piano roll after everything is loaded
    createPianoRoll();
    document.getElementById("status").textContent = "Ready to play!";
  } catch (error) {
    console.error("Error in loadMIDIFile:", error);
    document.getElementById("status").textContent =
      "Error loading MIDI file. Please try again.";
    throw error;
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

async function loadSamples() {
  try {
    // Clear existing players
    Object.values(players).forEach((player) => {
      if (player && typeof player.dispose === "function") {
        player.dispose();
      }
    });
    players = {};

    // Load samples for all instruments
    await Promise.all(
      INSTRUMENTS.map(async (instrument) => {
        try {
          if (!instrument.soundFile) {
            console.warn(
              `No sound file for instrument with MIDI note ${instrument.midiNote}`
            );
            return;
          }

          const player = new Tone.Player({
            url: `../assets/sounds/${instrument.soundFile}`,
            autostart: false,
          }).toDestination();

          await player.load();
          players[instrument.midiNote] = player;
          instrument.sample = player;
          console.log(
            `Loaded sample for MIDI note ${instrument.midiNote}: ${instrument.soundFile}`
          );
        } catch (error) {
          console.error(
            `Error loading sample for MIDI note ${instrument.midiNote}:`,
            error
          );
          document.getElementById(
            "status"
          ).textContent = `Error loading sample for MIDI note ${instrument.midiNote}`;
        }
      })
    );

    console.log("All samples loaded successfully");
  } catch (error) {
    console.error("Error in loadSamples:", error);
    document.getElementById("status").textContent =
      "Error loading samples. Please try again.";
    throw error;
  }
}

// Function to play a single note
function playNote(midiNote) {
  const player = players[midiNote];
  if (player) {
    player.start();
  } else {
    console.warn(`No player found for MIDI note ${midiNote}`);
  }
}

async function init() {
  try {
    document.getElementById("status").textContent = "Loading MIDI mapping...";
    await loadMIDIMapping();

    document.getElementById("status").textContent = "Creating beat list...";
    createBeatList();

    // Request audio context
    document.getElementById("status").textContent =
      "Requesting audio context...";
    await Tone.start();
    console.log("Audio context started");

    // Load initial MIDI file
    document.getElementById("status").textContent = "Loading initial beat...";
    await loadMIDIFile(AVAILABLE_BEATS[0].file);

    // Load samples for all instruments
    document.getElementById("status").textContent =
      "Loading instrument samples...";
    await loadSamples();

    // Set up Tone.js with the correct BPM
    Tone.Transport.bpm.value = BPM;

    document.getElementById("status").textContent = "Ready to play!";
    console.log("Initialization complete");
  } catch (error) {
    console.error("Error during initialization:", error);
    document.getElementById("status").textContent =
      "Error during initialization. Please refresh the page.";
  }
}

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Create beat list first
    createBeatList();

    // Add event listeners only after DOM is loaded
    const playReferenceButton = document.getElementById("playReference");
    if (playReferenceButton) {
      playReferenceButton.addEventListener("click", async () => {
        try {
          // Ensure audio context is started
          if (Tone.context.state !== "running") {
            await Tone.start();
          }
          playReferencePattern();
        } catch (error) {
          console.error("Error playing reference pattern:", error);
          document.getElementById("status").textContent =
            "Error playing reference pattern. Please try again.";
        }
      });
    }

    const playUserButton = document.getElementById("playUser");
    if (playUserButton) {
      playUserButton.addEventListener("click", async () => {
        try {
          // Ensure audio context is started
          if (Tone.context.state !== "running") {
            await Tone.start();
          }
          playUserPattern();
        } catch (error) {
          console.error("Error playing user pattern:", error);
          document.getElementById("status").textContent =
            "Error playing your pattern. Please try again.";
        }
      });
    }

    const checkAccuracyButton = document.getElementById("checkAccuracy");
    if (checkAccuracyButton) {
      checkAccuracyButton.addEventListener("click", checkUserAccuracy);
    }

    const toggleSolutionButton = document.getElementById("toggleSolution");
    if (toggleSolutionButton) {
      toggleSolutionButton.addEventListener("click", toggleSolution);
    }

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
    await init();
    console.log("Initial MIDI file loaded successfully");
  } catch (error) {
    console.error("Error during initialization:", error);
    document.getElementById("status").textContent =
      "Error initializing the game. Please refresh the page.";
  }
});
