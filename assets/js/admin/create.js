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
    await Promise.all(
      INSTRUMENTS.map(async (instrument) => {
        try {
          if (
            !instrument.soundFile ||
            instrument.soundFile.includes("Unknown")
          ) {
            return;
          }

          const soundPath = `../../assets/sounds/${instrument.soundFile}`;

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
          console.error(`Error loading sample for ${instrument.name}:`, error);
        }
      })
    );
  } catch (error) {
    console.error("Error in loadSamples:", error);
  }
}

// Create piano roll grid
function createPianoRoll() {
  const pianoRoll = document.getElementById("piano-roll");
  if (!pianoRoll || !INSTRUMENTS.length) return;

  pianoRoll.innerHTML = "";

  INSTRUMENTS.forEach((instrument, i) => {
    const row = document.createElement("div");
    row.className = "piano-roll-row";
    row.style.display = "contents";

    const label = document.createElement("div");
    label.className = "instrument-label";
    label.textContent = instrument.name;
    if (instrument.midiNote) {
      label.textContent += ` (${instrument.midiNote})`;
    }
    row.appendChild(label);

    for (let step = 0; step < STEPS; step++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      if (step % 4 === 0) {
        cell.classList.add("beat-marker");
      }

      cell.dataset.instrument = i;
      cell.dataset.step = step;

      cell.addEventListener("click", () => {
        pattern[i][step] = !pattern[i][step];
        cell.classList.toggle("active", pattern[i][step]);
        if (pattern[i][step]) {
          playNote(instrument.midiNote);
        }
      });

      row.appendChild(cell);
    }

    pianoRoll.appendChild(row);
  });
}

// Play a single note
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
    console.log("Starting MIDI download process...");
    try {
      // Create a new MIDI file
      console.log("Creating new MIDI object");
      const midi = new Midi();

      // Create track
      const track = midi.addTrack();

      // Get BPM
      const bpm = parseInt(document.getElementById("bpm").value) || 120;
      console.log(`Using BPM: ${bpm}`);

      // Add tempo information
      console.log("Setting tempo information");
      midi.header.setTempo(bpm);

      // Add time signature (4/4)
      console.log("Setting time signature");
      midi.header.timeSignatures = [
        {
          ticks: 0,
          timeSignature: [4, 4],
        },
      ];

      // Set PPQ
      const ppq = 480; // Standard MIDI PPQ
      console.log("Setting PPQ:", ppq);
      // midi.header.ppq = ppq;

      // Filter out instruments that have no active notes
      console.log("Filtering active instruments...");
      const activeInstruments = INSTRUMENTS.filter((_, index) =>
        pattern[index].some((step) => step === true)
      );
      console.log(
        `Found ${activeInstruments.length} active instruments out of ${INSTRUMENTS.length}`
      );

      // Add notes to the track only for active instruments
      console.log("Starting to add notes to track");
      let noteCount = 0;
      activeInstruments.forEach((instrument, i) => {
        // Find original index in pattern array
        const originalIndex = INSTRUMENTS.findIndex(
          (inst) => inst.midiNote === instrument.midiNote
        );

        pattern[originalIndex].forEach((isActive, step) => {
          if (isActive) {
            // Calculate precise timing using PPQ
            const startTicks = Math.round((step * ppq) / 4); // Convert step to ticks (16th notes)
            const durationTicks = Math.round(ppq / 4); // Duration of one 16th note

            track.addNote({
              midi: instrument.midiNote,
              ticks: startTicks,
              durationTicks: durationTicks,
              velocity: 0.8,
            });
            noteCount++;
          }
        });
      });
      console.log(`Added ${noteCount} notes to the track`);

      // Convert to array buffer
      console.log("Converting MIDI to array buffer");
      const arrayBuffer = midi.toArray();

      // Create and download the file
      console.log("Creating MIDI blob");
      const blob = new Blob([arrayBuffer], { type: "audio/midi" });
      console.log("Creating download URL");
      const url = URL.createObjectURL(blob);
      console.log("Initiating download");
      const a = document.createElement("a");
      a.href = url;
      a.download = "custom_pattern.mid";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log("Cleaning up URL");
      URL.revokeObjectURL(url);

      document.getElementById("status").textContent =
        "Pattern downloaded successfully!";
      console.log("MIDI download process completed");
    } catch (error) {
      console.error("Error in MIDI download process:", error);
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
