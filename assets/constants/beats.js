// Beat categories and their associated MIDI files
export const BEAT_CATEGORIES = {
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

// Helper function to get all beats in a flat array
export function getAllBeats(formatBeatName) {
  return Object.values(BEAT_CATEGORIES)
    .flat()
    .map((beat) => ({
      ...beat,
      name: formatBeatName ? formatBeatName(beat.file) : beat.name,
    }));
}
