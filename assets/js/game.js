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

// Function to format beat name from filename (for sidebar)
function formatBeatName(filename) {
  // Remove .mid extension
  const name = filename.replace(".mid", "");
  // Split by underscore and capitalize each word
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Function to format instrument name from filename
function formatInstrumentName(filename) {
  // Remove file extension
  let name = filename.replace(".wav", "");

  // Remove the last number (MIDI note) if it exists
  name = name.replace(/_\d+$/, "");

  // If there's still a number (like _1_ in crash_cymbal_1_49), keep it
  // but remove any remaining underscores and capitalize each word
  return name
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
        console.log("Loaded MIDI mapping:", MIDI_MAPPING);
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

    // Check if midi library is loaded
    if (typeof Midi !== "function") {
      console.error("Midi library not loaded properly");
      throw new Error("Midi library not loaded");
    }

    // Create a new Midi instance
    const midi = new Midi(arrayBuffer);
    console.log("MIDI file loaded successfully:", midi);

    // Get BPM from MIDI file
    let fileBPM = 120; // Default BPM
    if (midi.header && midi.header.tempos && midi.header.tempos.length > 0) {
      fileBPM = midi.header.tempos[0].bpm;
      BPM = fileBPM;
      Tone.Transport.bpm.value = BPM;
    }
    document.getElementById("current-beat-bpm").textContent = `${Math.round(
      BPM
    )} BPM`;

    // Get the first track (assuming it's a drum track)
    const track = midi.tracks[0];

    // Extract unique MIDI notes and create instrument mapping
    const uniqueMidiNotes = new Set();
    let maxTime = 0;

    if (track && track.notes) {
      track.notes.forEach((note) => {
        uniqueMidiNotes.add(note.midi);
        maxTime = Math.max(maxTime, note.time + note.duration);
      });
    }

    // Create instruments array from unique MIDI notes
    INSTRUMENTS = Array.from(uniqueMidiNotes)
      .sort((a, b) => a - b)
      .map((midiNote) => {
        // Get the sound filename from mapping
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

    console.log("Created instruments:", INSTRUMENTS);

    // Reset patterns with new instrument count
    referencePattern = Array(INSTRUMENTS.length)
      .fill()
      .map(() => Array(STEPS).fill(false));
    userPattern = Array(INSTRUMENTS.length)
      .fill()
      .map(() => Array(STEPS).fill(false));

    // Convert MIDI notes to our grid pattern
    if (track && track.notes) {
      track.notes.forEach((note) => {
        const instrumentIndex = INSTRUMENTS.findIndex(
          (instr) => instr.midiNote === note.midi
        );
        if (instrumentIndex !== -1) {
          // Convert time to step index (16th notes)
          const stepIndex = Math.floor((note.time * BPM * 16) / 60) % STEPS;
          if (stepIndex >= 0 && stepIndex < STEPS) {
            referencePattern[instrumentIndex][stepIndex] = true;
          }
        }
      });
    }

    // Update debug information
    document.getElementById("debug-bpm").textContent = Math.round(fileBPM);
    document.getElementById("debug-bars").textContent = Math.ceil(
      (maxTime * fileBPM) / 240
    );
    document.getElementById("debug-midi-notes").textContent = Array.from(
      uniqueMidiNotes
    )
      .sort((a, b) => a - b)
      .join(", ");
    document.getElementById("debug-duration").textContent = maxTime.toFixed(2);

    // Update UI
    createPianoRoll();
    updatePianoRollUI();
    console.log("Reference pattern loaded:", referencePattern);

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
    document.getElementById("debug-midi-notes").textContent = "-";
    document.getElementById("debug-duration").textContent = "-";
  }
}

// Create the sidebar beat list
function createBeatList() {
  const beatList = document.getElementById("beat-list");
  beatList.innerHTML = "";

  // Create category sections
  Object.entries(BEAT_CATEGORIES).forEach(([category, beats]) => {
    // Create category header
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "category-header";
    categoryHeader.textContent = category;
    beatList.appendChild(categoryHeader);

    // Create beats under this category
    beats.forEach((beat) => {
      const beatItem = document.createElement("div");
      beatItem.className = `beat-item ${beat === currentBeat ? "active" : ""}`;
      beatItem.innerHTML = `
        <div class="beat-name">${beat.name}</div>
        <div class="beat-description">${beat.description}</div>
      `;

      beatItem.addEventListener("click", async () => {
        // Update current beat
        currentBeat = beat;
        document.getElementById("current-beat-name").textContent = beat.name;

        // Update active state
        document
          .querySelectorAll(".beat-item")
          .forEach((item) => item.classList.remove("active"));
        beatItem.classList.add("active");

        // Hide solution if it was showing
        const solutionButton = document.querySelector(".btn.solution");
        if (solutionButton.classList.contains("active")) {
          // Remove solution highlighting from all cells
          INSTRUMENTS.forEach((_, row) => {
            for (let step = 0; step < STEPS; step++) {
              const cell = document.querySelector(
                `[data-row="${row}"][data-step="${step}"]`
              );
              cell.classList.remove("solution");
            }
          });
          // Reset button state
          solutionButton.classList.remove("active");
          solutionButton.textContent = "Show Solution";
        }

        // Load the new MIDI file
        await loadMIDIFile(beat.file);

        // Reset user pattern
        userPattern = Array(INSTRUMENTS.length)
          .fill()
          .map(() => Array(STEPS).fill(false));
        updatePianoRollUI();
      });

      beatList.appendChild(beatItem);
    });
  });
}

// Update piano roll UI to reflect current patterns
function updatePianoRollUI() {
  // Update reference pattern visualization
  INSTRUMENTS.forEach((_, row) => {
    for (let step = 0; step < STEPS; step++) {
      const cell = document.querySelector(
        `[data-row="${row}"][data-step="${step}"]`
      );
      if (cell) {
        cell.classList.toggle("active", userPattern[row][step]);
      }
    }
  });
}

// Initialize Tone.js and load samples
async function init() {
  try {
    // Create beat list
    createBeatList();

    // Set up initial audio context state
    if (Tone.context.state !== "running") {
      document.getElementById("status").textContent =
        "Click anywhere to enable audio";

      // Request audio context on user gesture
      document.body.addEventListener(
        "click",
        async () => {
          try {
            await Tone.start();
            document.getElementById("status").textContent =
              "Audio enabled - Click grid cells to create your beat!";
          } catch (error) {
            console.error("Error starting audio context:", error);
            document.getElementById("status").textContent =
              "Error enabling audio. Please try again.";
          }
        },
        { once: true }
      );
    }

    // Load initial MIDI file
    await loadMIDIFile();

    // Set up Tone.js with the correct BPM
    Tone.Transport.bpm.value = BPM;

    // Load samples
    await Promise.all(
      INSTRUMENTS.map(async (instrument) => {
        try {
          players[instrument.midiNote] = new Tone.Player({
            url: `../assets/sounds/${instrument.file}`,
            autostart: false,
          }).toDestination();

          // Wait for the player to load
          await players[instrument.midiNote].load();
        } catch (error) {
          console.error(`Error loading sample for ${instrument.name}:`, error);
        }
      })
    );

    // Update display
    document.getElementById("current-beat-name").textContent = currentBeat.name;
    document.getElementById("current-beat-bpm").textContent = `${Math.round(
      BPM
    )} BPM`;
  } catch (error) {
    console.error("Error initializing game:", error);
    document.getElementById("status").textContent =
      "Error loading game resources. Please refresh the page.";
  }
}

// Create the piano roll grid UI
function createPianoRoll() {
  const pianoRoll = document.getElementById("piano-roll");
  pianoRoll.innerHTML = ""; // Clear existing content

  // Create instrument labels and grid cells
  INSTRUMENTS.forEach((instrument, row) => {
    // Add instrument label
    const label = document.createElement("div");
    label.className = "instrument-label";
    label.textContent = instrument.name;
    pianoRoll.appendChild(label);

    // Add grid cells for this instrument
    for (let step = 0; step < STEPS; step++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.row = row;
      cell.dataset.step = step;

      // Add click handler
      cell.addEventListener("click", () => toggleNote(row, step));

      // Add visual markers for beats
      if (step % 4 === 0) {
        cell.style.borderLeft = "2px solid #666";
      }

      pianoRoll.appendChild(cell);
    }
  });
}

// Toggle note on/off and play sound
function toggleNote(row, step) {
  userPattern[row][step] = !userPattern[row][step];

  // Update visual state
  const cell = document.querySelector(
    `[data-row="${row}"][data-step="${step}"]`
  );
  cell.classList.toggle("active", userPattern[row][step]);

  // Play sound immediately for feedback
  if (userPattern[row][step]) {
    const instrument = INSTRUMENTS[row];
    if (players[instrument.midiNote].loaded) {
      players[instrument.midiNote].start();
    }
  }
}

// Make functions globally available
window.playReferencePattern = function () {
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
      [...Array(STEPS).keys()], // Pass step numbers 0-15
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
};

// Make functions globally available
window.playUserPattern = function () {
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
};

// Make functions globally available
window.checkUserAccuracy = function () {
  let totalSteps = STEPS * INSTRUMENTS.length;
  let correctSteps = 0;

  for (let i = 0; i < INSTRUMENTS.length; i++) {
    for (let step = 0; step < STEPS; step++) {
      if (userPattern[i][step] === referencePattern[i][step]) {
        correctSteps++;
      }
    }
  }

  const accuracy = (correctSteps / totalSteps) * 100;
  document.getElementById("status").textContent = `Accuracy: ${accuracy.toFixed(
    1
  )}%`;
};

// Add show solution functionality
window.showSolution = function () {
  const solutionButton = document.querySelector(".btn.solution");
  const isShowingSolution = solutionButton.classList.contains("active");

  if (isShowingSolution) {
    // Hide solution
    INSTRUMENTS.forEach((_, row) => {
      for (let step = 0; step < STEPS; step++) {
        const cell = document.querySelector(
          `[data-row="${row}"][data-step="${step}"]`
        );
        cell.classList.remove("solution");
      }
    });
    solutionButton.classList.remove("active");
    solutionButton.textContent = "Show Solution";
    document.getElementById("status").textContent = "Solution hidden";
  } else {
    // Show solution
    INSTRUMENTS.forEach((_, row) => {
      for (let step = 0; step < STEPS; step++) {
        const cell = document.querySelector(
          `[data-row="${row}"][data-step="${step}"]`
        );
        if (referencePattern[row][step]) {
          cell.classList.add("solution");
        }
      }
    });
    solutionButton.classList.add("active");
    solutionButton.textContent = "Hide Solution";
    document.getElementById("status").textContent = "Showing solution pattern";
  }
};

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", init);
