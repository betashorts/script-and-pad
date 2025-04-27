// Beat categories and their associated MIDI files
window.BEAT_CATEGORIES = {
  // "Basic Beats": [
  //   {
  //     name: "Basic Rock Beat",
  //     file: "basic_rock_beat.mid",
  //     description: "Classic rock beat pattern",
  //   },
  //   {
  //     name: "Basic Rock Beat 2",
  //     file: "basic_rock_beat_2.mid",
  //     description: "Standard 4/4 rock beat pattern",
  //   },
  //   {
  //     name: "Basic Rock Beat 3",
  //     file: "basic_rock_beat_3.mid",
  //     description: "Standard 4/4 rock beat pattern",
  //   },
  //   {
  //     name: "Basic Rock Beat 4",
  //     file: "basic_rock_beat_4.mid",
  //     description: "Standard 4/4 rock beat pattern",
  //   },
  //   {
  //     name: "Basic Rock Beat 5",
  //     file: "basic_rock_beat_5.mid",
  //     description: "Standard 4/4 rock beat pattern",
  //   },
  // ],
  // "Advanced Beats": [
  //   {
  //     name: "Groove Beat",
  //     file: "groove_hihat_1.mid",
  //     description: "Standard 4/4 hihat beat pattern",
  //   },
  //   {
  //     name: "Basic Rock Beat 6",
  //     file: "basic_rock_beat_6.mid",
  //     description: "Standard 4/4 rock beat pattern",
  //   },
  //   {
  //     name: "Basic Rock Beat 7",
  //     file: "basic_rock_beat_7.mid",
  //     description: "Standard 4/4 rock beat pattern",
  //   },
  //   {
  //     name: "Basic Rock Beat 8",
  //     file: "basic_rock_beat_8.mid",
  //     description: "Standard 4/4 rock beat pattern",
  //   },
  //   {
  //     name: "Basic Rock Beat 9",
  //     file: "basic_rock_beat_9.mid",
  //     description: "Standard 4/4 rock beat pattern",
  //   },
  //   {
  //     name: "Basic Rock Beat 10",
  //     file: "basic_rock_beat_10.mid",
  //     description: "Standard 4/4 rock beat pattern",
  //   },
  // ],
  "Backbeats Mastery": [
    {
      name: "Basic Backbeat Foundation",
      file: "backbeat_basic_085.mid",
      description: "Essential backbeat pattern with steady kick (85 BPM)",
    },
    {
      name: "Ghost Note Backbeat",
      file: "backbeat_ghost_095.mid",
      description: "Backbeat with ghost note accents (95 BPM)",
    },
    {
      name: "Clap Backbeat",
      file: "backbeat_clap_100.mid",
      description: "Backbeat pattern using clap sounds (100 BPM)",
    },
    {
      name: "Offbeat Hi-Hat Backbeat",
      file: "backbeat_offhat_105.mid",
      description: "Backbeat with offbeat hi-hat accents (105 BPM)",
    },
    {
      name: "Open Hi-Hat Backbeat",
      file: "backbeat_ophat_110.mid",
      description: "Backbeat with open hi-hat variations (110 BPM)",
    },
    {
      name: "Tom Groove Backbeat",
      file: "backbeat_tomgroove_110.mid",
      description: "Backbeat with tom fills and accents (110 BPM)",
    },
    {
      name: "Clap Syncopation",
      file: "backbeat_clapsync_115.mid",
      description: "Syncopated clap patterns with backbeat (115 BPM)",
    },
    {
      name: "Fill Ending Backbeat",
      file: "backbeat_fillend_115.mid",
      description: "Backbeat with fill ending variations (115 BPM)",
    },
    {
      name: "Linear Tom Backbeat",
      file: "backbeat_lineartom_120.mid",
      description: "Linear tom patterns with backbeat (120 BPM)",
    },
    {
      name: "Dynamic Backbeat",
      file: "backbeat_dynamics_120.mid",
      description: "Backbeat with dynamic variations (120 BPM)",
    },
    {
      name: "Full Funk Backbeat",
      file: "backbeat_funkfull_125.mid",
      description: "Complete funk backbeat pattern (125 BPM)",
    },
  ],
  "Kick Variations": [
    {
      name: "Basic Kick Pattern",
      file: "kick_basic_090.mid",
      description:
        "Fundamental kick drum pattern with steady backbeat (90 BPM)",
    },
    {
      name: "Syncopated Kick",
      file: "kick_syncopate_095.mid",
      description: "Kick drum syncopation with offbeat accents (95 BPM)",
    },
    {
      name: "Triplet Kick Flow",
      file: "kick_triplet_095.mid",
      description: "Kick drum triplets with steady groove (95 BPM)",
    },
    {
      name: "Four on the Floor",
      file: "kick_4floor_100.mid",
      description: "Classic four-on-the-floor kick pattern (100 BPM)",
    },
    {
      name: "Polyrhythmic Kick",
      file: "kick_poly_100.mid",
      description: "Complex polyrhythmic kick patterns (100 BPM)",
    },
    {
      name: "Dotted Kick Rhythm",
      file: "kick_dotted_105.mid",
      description: "Kick patterns using dotted rhythms (105 BPM)",
    },
    {
      name: "Gallop Kick Pattern",
      file: "kick_gallop_105.mid",
      description: "Galloping kick rhythm with syncopation (105 BPM)",
    },
    {
      name: "Snare Call Kick",
      file: "kick_snarecall_110.mid",
      description: "Kick patterns responding to snare calls (110 BPM)",
    },
    {
      name: "Linear Kick Pattern",
      file: "kick_linear_110.mid",
      description: "Linear kick patterns with no overlap (110 BPM)",
    },
    {
      name: "Pedal Coordination",
      file: "kick_pedalcoord_115.mid",
      description: "Kick patterns with hi-hat pedal coordination (115 BPM)",
    },
    {
      name: "Fill Kick Pattern",
      file: "kick_fill_120.mid",
      description: "Kick drum fills and variations (120 BPM)",
    },
  ],
  "Funky Offbeats": [],
  "Speed and Coordination": [],
  "Ghost Notes and Dynamics": [],
};

// Helper function to get all beats in a flat array
window.getAllBeats = function (formatBeatName) {
  return Object.values(window.BEAT_CATEGORIES)
    .flat()
    .map((beat) => ({
      ...beat,
      name: formatBeatName ? formatBeatName(beat.file) : beat.name,
    }));
};
