import { MIDI_MAPPING } from "../../constants/midi_mapping.js";

// Constants
const STEPS = 16;
let INSTRUMENTS = [];
let pattern = [];
let players = {};
let isPlaying = false;

// Initialize the page
async function init() {
  try {
    // Load MIDI mapping and create instruments
    await loadInstruments();

    // Initialize pattern
    pattern = Array(INSTRUMENTS.length)
      .fill()
      .map(() => Array(STEPS).fill(false));

    // Create piano roll
    createPianoRoll();

    // Set up event listeners
    setupEventListeners();

    document.getElementById("status").textContent = "Ready to create!";
  } catch (error) {
    console.error("Error during initialization:", error);
    document.getElementById("status").textContent =
      "Error during initialization";
  }
}

// Load instruments from MIDI mapping
async function loadInstruments() {
  try {
    INSTRUMENTS = Object.entries(MIDI_MAPPING).map(([midiNote, soundFile]) => ({
      midiNote: parseInt(midiNote),
      soundFile: soundFile,
      name: formatInstrumentName(soundFile),
    }));

    // Create instrument list in sidebar
    const instrumentList = document.getElementById("instrument-list");
    INSTRUMENTS.forEach((instrument) => {
      const div = document.createElement("div");
      div.className = "instrument-item";
      div.textContent = `${instrument.name} (MIDI: ${instrument.midiNote})`;
      instrumentList.appendChild(div);
    });

    // Load samples
    await loadSamples();
  } catch (error) {
    console.error("Error loading instruments:", error);
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

// Load audio samples
async function loadSamples() {
  try {
    // Clear existing players
    players = {};

    // Initialize Tone.js
    await Tone.start();

    // Load samples for all instruments
    await Promise.all(
      INSTRUMENTS.map(async (instrument) => {
        const player = new Tone.Player();
        await player.load(`../../../assets/sounds/${instrument.soundFile}`);
        player.connect(Tone.getDestination());
        players[instrument.midiNote] = player;
      })
    );
  } catch (error) {
    console.error("Error loading samples:", error);
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

    // Add grid cells
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
        pattern[instrumentIndex][step] = !pattern[instrumentIndex][step];
        updatePianoRollUI();

        // Play the sound if turning on
        if (pattern[instrumentIndex][step]) {
          playNote(instrument.midiNote);
        }
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

    cell.classList.toggle("active", pattern[instrumentIndex][step]);
  });
}

// Play a single note
function playNote(midiNote) {
  const player = players[midiNote];
  if (player) {
    player.start();
  }
}

// Play the entire pattern
function playPattern() {
  if (isPlaying) {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    isPlaying = false;
    document.getElementById("status").textContent = "Playback stopped";
    return;
  }

  // Set BPM
  const bpm = parseInt(document.getElementById("bpm").value);
  Tone.Transport.bpm.value = bpm;

  // Clear any existing events
  Tone.Transport.cancel();

  // Create a sequence for each instrument
  pattern.forEach((row, instrumentIndex) => {
    const instrument = INSTRUMENTS[instrumentIndex];
    new Tone.Sequence(
      (time, step) => {
        if (row[step]) {
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
  document.getElementById("status").textContent = "Playing pattern...";

  // Stop after one bar
  Tone.Transport.schedule(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    isPlaying = false;
    document.getElementById("status").textContent = "Playback complete";
  }, "1m");
}

// Download the pattern as MIDI
function downloadPattern() {
  try {
    const midi = new Midi();
    const track = midi.addTrack();

    // Set BPM
    const bpm = parseInt(document.getElementById("bpm").value);
    midi.header.setTempo(bpm);

    // Add notes to the track
    pattern.forEach((row, instrumentIndex) => {
      const instrument = INSTRUMENTS[instrumentIndex];
      row.forEach((isActive, step) => {
        if (isActive) {
          track.addNote({
            midi: instrument.midiNote,
            time: step * 0.25, // 16th notes
            duration: 0.25,
          });
        }
      });
    });

    // Create download link
    const blob = new Blob([midi.toArray()], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "custom_pattern.mid";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.getElementById("status").textContent = "MIDI file downloaded!";
  } catch (error) {
    console.error("Error creating MIDI file:", error);
    document.getElementById("status").textContent = "Error creating MIDI file";
  }
}

// Set up event listeners
function setupEventListeners() {
  document.getElementById("playPattern").addEventListener("click", playPattern);
  document
    .getElementById("downloadPattern")
    .addEventListener("click", downloadPattern);
}

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", init);
