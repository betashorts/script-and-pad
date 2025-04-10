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
    {
      name: "Basic Rock Beat 7",
      file: "basic_rock_beat_7.mid",
      description: "Standard 4/4 rock beat pattern",
    },
    {
      name: "Basic Rock Beat 8",
      file: "basic_rock_beat_8.mid",
      description: "Standard 4/4 rock beat pattern",
    },
    {
      name: "Basic Rock Beat 9",
      file: "basic_rock_beat_9.mid",
      description: "Standard 4/4 rock beat pattern",
    },
    {
      name: "Basic Rock Beat 10",
      file: "basic_rock_beat_10.mid",
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
let BPM = 100; // Default BPM
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
    console.log(
      "Attempting to load MIDI mapping from ../assets/json/mapping.json"
    );
    const response = await fetch("../assets/json/mapping.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    MIDI_MAPPING = await response.json();
    console.log("MIDI mapping loaded successfully:", MIDI_MAPPING);
    return MIDI_MAPPING;
  } catch (error) {
    console.error("Error loading MIDI mapping:", error);
    console.error("Full error details:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

function findSoundFileForMidiNote(midiNote) {
  console.log(`Finding sound file for MIDI note ${midiNote}`);
  if (!MIDI_MAPPING) {
    console.error("MIDI mapping not loaded when searching for note", midiNote);
    return `Unknown (${midiNote})`;
  }

  const soundFile = MIDI_MAPPING[midiNote];
  if (!soundFile) {
    console.warn(
      `No sound file mapping found for MIDI note ${midiNote} in mapping:`,
      MIDI_MAPPING
    );
    return `Unknown (${midiNote})`;
  }

  console.log(`Found sound file ${soundFile} for MIDI note ${midiNote}`);
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
    const bpm = Math.round(midi.header.tempos[0]?.bpm || 100);
    Tone.Transport.bpm.value = bpm;
    document.getElementById("current-beat-bpm").textContent = `BPM: ${bpm}`;

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
      name: formatInstrumentName(findSoundFileForMidiNote(note)),
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
          (inst) =>
            inst.midiNote === note.midi && !inst.soundFile.includes("Unknown")
        );
        if (instrumentIndex !== -1) {
          const startTick = Math.floor(note.ticks / (midi.header.ppq / 4));
          if (startTick < 16) {
            referencePattern[instrumentIndex][startTick] = true;
          }
        } else {
          console.log("Instrument Index not found for :", note.midi);
        }
      });
    });

    // Update debug info
    document.getElementById("debug-time-signature").textContent = `${
      midi.header.timeSignatures[0]?.timeSignature[0] || 4
    }/${midi.header.timeSignatures[0]?.timeSignature[1] || 4}`;

    // Calculate BPM from duration and ticks
    const calculatedBPM = Math.round(
      (midi.durationTicks / midi.header.ppq) * (60 / midi.duration)
    );
    const totalBars = Math.ceil(midi.durationTicks / (midi.header.ppq * 4));

    document.getElementById("debug-bpm").textContent = `${calculatedBPM}`;
    document.getElementById("debug-bars").textContent = `${totalBars}`;

    document.getElementById("debug-midi-notes").textContent = `${Array.from(
      uniqueNotes
    ).join(", ")}`;
    document.getElementById(
      "debug-duration"
    ).textContent = `${midi.duration.toFixed(2)}s`;

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

  // Initialize userPattern when creating piano roll
  userPattern = Array(INSTRUMENTS.length)
    .fill()
    .map(() => Array(STEPS).fill(false));
  console.log("Initialized userPattern:", userPattern);

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
        console.log(
          `Grid cell clicked - Instrument: ${instrument.name}, Step: ${step}`
        );
        console.log(
          `Current state before click: ${userPattern[instrumentIndex][step]}`
        );

        // Toggle the pattern
        userPattern[instrumentIndex][step] =
          !userPattern[instrumentIndex][step];

        console.log(
          `New state after click: ${userPattern[instrumentIndex][step]}`
        );
        console.log(`Attempting to play note: ${instrument.midiNote}`);

        // Play the sound if turning on
        if (userPattern[instrumentIndex][step]) {
          try {
            const player = players[instrument.midiNote];
            console.log("Player object:", player);
            if (player) {
              console.log("Starting player...");
              player.start();
            } else {
              console.warn(
                `No player found for MIDI note ${instrument.midiNote}`
              );
            }
          } catch (error) {
            console.error("Error playing note:", error);
          }
        }

        // Update UI
        updatePianoRollUI();
        console.log("UI updated");
      });

      pianoRoll.appendChild(cell);
    }
  });

  console.log(
    "Piano roll created with instruments:",
    INSTRUMENTS.map((i) => i.name)
  );
}

// Update the piano roll UI
function updatePianoRollUI() {
  console.log("Updating piano roll UI");
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
  console.log("Piano roll UI update complete");
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

          // Ensure the sound file path is correct and the file exists
          const soundPath = `../assets/sounds/${instrument.soundFile}`;
          console.log(`Attempting to load sound from path: ${soundPath}`);

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
    document.getElementById("status").textContent = "Ready to play!";
  } catch (error) {
    console.error("Error in loadSamples:", {
      error: error,
      stack: error.stack,
      instruments: INSTRUMENTS,
    });
    document.getElementById("status").textContent = "Error loading samples";
  }
}

// Update the playNote function
function playNote(midiNote) {
  try {
    const player = players[midiNote];
    if (player && player.loaded) {
      player.start();
    } else {
      console.warn(`Player not ready for MIDI note ${midiNote}`);
    }
  } catch (error) {
    console.error(`Error playing note ${midiNote}:`, error);
  }
}

async function init() {
  try {
    // Start audio context with user interaction
    const startAudio = async () => {
      await Tone.start();
      document.removeEventListener("click", startAudio);
      document.getElementById("status").textContent = "Audio enabled!";
    };

    document.addEventListener("click", startAudio);
    document.getElementById("status").textContent =
      "Click anywhere to start audio";

    // Load MIDI mapping
    await loadMIDIMapping();

    // Create beat list
    createBeatList();

    // Load initial MIDI file
    await loadMIDIFile(AVAILABLE_BEATS[0].file);

    // Set up Tone.js with the correct BPM
    Tone.Transport.bpm.value = BPM;

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

    // Load initial MIDI file
    await init();
    console.log("Initial MIDI file loaded successfully");
  } catch (error) {
    console.error("Error during initialization:", error);
    document.getElementById("status").textContent =
      "Error initializing the game. Please refresh the page.";
  }
});
