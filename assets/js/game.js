// Constants
const STEPS = 16;
const INSTRUMENTS = [
  { name: "Kick", file: "kick.wav", midiNote: 36 },
  { name: "Snare", file: "snare.wav", midiNote: 38 },
  { name: "Hi-hat Closed", file: "hihat_closed.wav", midiNote: 42 },
  { name: "Hi-hat Open", file: "hihat_open.wav", midiNote: 46 },
];

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
const AVAILABLE_BEATS = Object.values(BEAT_CATEGORIES).flat();

// Global state
let players = {};
let userPattern = Array(INSTRUMENTS.length)
  .fill()
  .map(() => Array(STEPS).fill(false));
let referencePattern = Array(INSTRUMENTS.length)
  .fill()
  .map(() => Array(STEPS).fill(false));
let isPlaying = false;
let BPM = 120; // Default BPM
let currentBeat = AVAILABLE_BEATS[0]; // Start with the first beat

// Load and parse MIDI file
async function loadMIDIFile(beatFile = currentBeat.file) {
  try {
    // Reset patterns
    referencePattern = Array(INSTRUMENTS.length)
      .fill()
      .map(() => Array(STEPS).fill(false));
    userPattern = Array(INSTRUMENTS.length)
      .fill()
      .map(() => Array(STEPS).fill(false));

    const response = await fetch(`../assets/midi/${beatFile}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // Ensure we're using the correct Midi class from @tonejs/midi
    if (typeof Midi === "undefined") {
      throw new Error("Midi parser not loaded");
    }

    const midi = new Midi(arrayBuffer);
    console.log("MIDI file loaded successfully:", midi);

    // Get BPM from MIDI file
    if (midi.header && midi.header.tempos && midi.header.tempos.length > 0) {
      BPM = midi.header.tempos[0].bpm;
      Tone.Transport.bpm.value = BPM;
      document.getElementById("current-beat-bpm").textContent = `${Math.round(
        BPM
      )} BPM`;
    }

    // Get the first track (assuming it's a drum track)
    const track = midi.tracks[0];

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

    // Update UI
    updatePianoRollUI();
    console.log("Reference pattern loaded:", referencePattern);
  } catch (error) {
    console.error("Error loading MIDI file:", error);
    document.getElementById("status").textContent =
      "Error loading MIDI file. Please try again.";
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

    // Create piano roll UI
    createPianoRoll();

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
