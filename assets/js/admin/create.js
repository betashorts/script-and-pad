// Constants
const STEPS = 16;
let INSTRUMENTS = [];
let pattern = [];
let players = {};
let isPlaying = false;
const DEFAULT_PPQ = 480; // Standard MIDI PPQ

// Load MIDI mapping
async function loadMIDIMapping() {
  try {
    console.log("Loading MIDI mapping...");
    const response = await fetch("../../../assets/json/mapping.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const mapping = await response.json();
    console.log("MIDI mapping loaded:", mapping);
    return mapping;
  } catch (error) {
    console.error("Error loading MIDI mapping:", error);
    throw error;
  }
}

// Format instrument name from filename
function formatInstrumentName(filename) {
  return filename
    .replace(".wav", "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Initialize the page
async function init() {
  try {
    console.log("Starting initialization...");

    // Start audio context with user interaction
    const startAudio = async () => {
      await Tone.start();
      document.removeEventListener("click", startAudio);
      document.getElementById("status").textContent = "Audio enabled!";
    };

    document.addEventListener("click", startAudio);
    document.getElementById("status").textContent =
      "Click anywhere to start audio";

    // Load MIDI mapping and create instruments
    await loadInstruments();
    console.log("Instruments loaded:", INSTRUMENTS);

    // Initialize pattern
    pattern = Array(INSTRUMENTS.length)
      .fill()
      .map(() => Array(STEPS).fill(false));
    console.log(
      "Pattern initialized with dimensions:",
      pattern.length,
      "x",
      STEPS
    );

    // Create piano roll
    console.log("Creating piano roll...");
    createPianoRoll();
    console.log("Piano roll creation completed");

    // Set up event listeners
    console.log("Setting up event listeners...");
    setupEventListeners();
    console.log("Event listeners set up");

    console.log("Initialization complete");
  } catch (error) {
    console.error("Error during initialization:", error);
    document.getElementById("status").textContent =
      "Error during initialization";
  }
}

// Load instruments from MIDI mapping
async function loadInstruments() {
  try {
    const mapping = await loadMIDIMapping();

    INSTRUMENTS = Object.entries(mapping).map(([midiNote, soundFile]) => ({
      midiNote: parseInt(midiNote),
      soundFile: soundFile,
      name: formatInstrumentName(soundFile),
    }));

    // Sort instruments by MIDI note number
    INSTRUMENTS.sort((a, b) => a.midiNote - b.midiNote);

    // Create instrument list in sidebar
    const instrumentList = document.getElementById("instrument-list");
    instrumentList.innerHTML = ""; // Clear existing list

    INSTRUMENTS.forEach((instrument) => {
      const div = document.createElement("div");
      div.className = "instrument-item";
      div.textContent = `${instrument.name} (${instrument.midiNote})`;
      div.title = `Sound file: ${instrument.soundFile}`;

      // Add click handler to preview sound
      div.addEventListener("click", () => {
        playNote(instrument.midiNote);
      });

      instrumentList.appendChild(div);
    });

    // Load samples
    await loadSamples();
  } catch (error) {
    console.error("Error loading instruments:", error);
    throw error;
  }
}

// Load audio samples for all instruments
async function loadSamples() {
  try {
    console.log("Starting loadSamples function");
    console.log("Current INSTRUMENTS array:", INSTRUMENTS);

    // Clear existing players
    Object.values(players).forEach((player) => {
      if (player) {
        player.dispose();
      }
    });
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
          const soundPath = `../../assets/sounds/${instrument.soundFile}`;
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

    console.log("All samples loaded successfully");
  } catch (error) {
    console.error("Error in loadSamples:", error);
  }
}

// Create piano roll grid
function createPianoRoll() {
  console.log("Starting createPianoRoll function");
  const pianoRoll = document.getElementById("piano-roll");
  console.log("Piano roll element:", pianoRoll);

  if (!pianoRoll) {
    console.error("Piano roll element not found!");
    return;
  }

  console.log("Current INSTRUMENTS array:", INSTRUMENTS);
  if (!INSTRUMENTS.length) {
    console.error("No instruments loaded!");
    return;
  }

  pianoRoll.innerHTML = ""; // Clear existing grid

  // Create grid
  INSTRUMENTS.forEach((instrument, i) => {
    console.log(
      `Creating row for instrument: ${instrument.name} (${instrument.midiNote})`
    );

    // Create a row for each instrument
    const row = document.createElement("div");
    row.className = "piano-roll-row";
    row.style.display = "contents";

    // Add instrument label
    const label = document.createElement("div");
    label.className = "instrument-label";
    label.textContent = instrument.name;
    if (instrument.midiNote) {
      label.textContent += ` (${instrument.midiNote})`;
    }
    row.appendChild(label);

    // Add grid cells for this instrument
    for (let step = 0; step < STEPS; step++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      if (step % 4 === 0) {
        cell.classList.add("beat-marker");
      }

      cell.dataset.instrument = i;
      cell.dataset.step = step;

      cell.addEventListener("click", () => {
        console.log(
          `Cell clicked - Instrument: ${instrument.name}, Step: ${step}`
        );
        // Toggle pattern
        pattern[i][step] = !pattern[i][step];
        cell.classList.toggle("active", pattern[i][step]);

        // Play sound if activated
        if (pattern[i][step]) {
          console.log(`Playing note: ${instrument.midiNote}`);
          playNote(instrument.midiNote);
        }
      });

      row.appendChild(cell);
    }

    pianoRoll.appendChild(row);
    console.log(`Row created for instrument: ${instrument.name}`);
  });

  console.log("Piano roll creation finished");
}

// Play a single note
async function playNote(midiNote) {
  try {
    // Check if audio context is running
    if (Tone.context.state !== "running") {
      console.log("Audio context not running. Cannot play note.");
      return;
    }

    const player = players[midiNote];
    if (!player) {
      console.warn(`No player found for MIDI note ${midiNote}`);
      return;
    }

    // Stop and restart the player to allow retriggering
    if (player.state === "started") {
      player.stop();
    }
    player.start();
  } catch (error) {
    console.error(`Error playing note ${midiNote}:`, error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Play Pattern button
  document.getElementById("playPattern").addEventListener("click", async () => {
    if (isPlaying) return;
    isPlaying = true;

    const bpm = parseInt(document.getElementById("bpm").value) || 120;
    const stepTime = 60 / bpm / 4; // Time for each 16th note

    // Play through the pattern
    for (let step = 0; step < STEPS; step++) {
      INSTRUMENTS.forEach((instrument, i) => {
        if (pattern[i][step]) {
          playNote(instrument.midiNote);
        }
      });
      await new Promise((resolve) => setTimeout(resolve, stepTime * 1000));
    }

    isPlaying = false;
  });

  // Download MIDI button
  document.getElementById("downloadPattern").addEventListener("click", () => {
    try {
      // Create a new MIDI file
      const midi = new Midi();

      // Set PPQ
      midi.header.ppq = DEFAULT_PPQ;

      // Set BPM
      const bpm = parseInt(document.getElementById("bpm").value) || 120;
      midi.header.setTempo(bpm);

      // Set time signature (4/4)
      midi.header.timeSignatures.push({
        ticks: 0,
        timeSignature: [4, 4],
      });

      // Create a track
      const track = midi.addTrack();

      // Add notes to the track
      INSTRUMENTS.forEach((instrument, i) => {
        pattern[i].forEach((isActive, step) => {
          if (isActive) {
            // Calculate precise timing using PPQ
            const startTicks = Math.round((step * midi.header.ppq) / 4); // Convert step to ticks (16th notes)
            const durationTicks = Math.round(midi.header.ppq / 4); // Duration of one 16th note

            track.addNote({
              midi: instrument.midiNote,
              ticks: startTicks,
              durationTicks: durationTicks,
              velocity: 0.8, // Standard velocity
            });
          }
        });
      });

      // Download the file
      const blob = new Blob([midi.toArray()], { type: "audio/midi" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "custom_pattern.mid";
      a.click();
      URL.revokeObjectURL(url);

      document.getElementById("status").textContent =
        "Pattern downloaded successfully!";
    } catch (error) {
      console.error("Error creating MIDI file:", error);
      document.getElementById("status").textContent =
        "Error creating MIDI file";
    }
  });
}

// Play the entire pattern
async function playPattern() {
  try {
    // Check if audio context is running
    if (Tone.context.state !== "running") {
      console.log("Audio context not running. Cannot play pattern.");
      return;
    }

    // If already playing, stop
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      isPlaying = false;
      return;
    }

    // Set up transport
    const bpm = 120; // Default tempo
    Tone.Transport.bpm.value = bpm;

    // Schedule notes
    const subdivision = "16n";
    let currentStep = 0;

    const repeat = new Tone.Loop((time) => {
      try {
        // Play all active notes for current step
        INSTRUMENTS.forEach((instrument, index) => {
          if (pattern[index][currentStep]) {
            playNote(instrument.midiNote);
          }
        });

        // Update UI to show current step
        updatePianoRollUI(currentStep);

        // Move to next step
        currentStep = (currentStep + 1) % STEPS;
      } catch (error) {
        console.error("Error in pattern loop:", error);
      }
    }, subdivision);

    // Start transport and loop
    repeat.start(0);
    Tone.Transport.start();
    isPlaying = true;
  } catch (error) {
    console.error("Error playing pattern:", error);
    isPlaying = false;
  }
}

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Starting initialization");
  init();
});
