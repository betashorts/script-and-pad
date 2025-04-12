// Beat categories and their associated MIDI files
export const BEAT_CATEGORIES = {
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
      name: "Basic Backbeat Rock",
      file: "backbeat_rock_090.mid",
      description:
        "Snare on 2 & 4, kick on 1,3 - Classic backbeat foundation (90 BPM)",
    },
    {
      name: "Offbeat Kick Practice",
      file: "backbeat_kickoff_095.mid",
      description: "Kick on offbeats with steady hi-hat pattern (95 BPM)",
    },
    {
      name: "Hat Variation Groove",
      file: "backbeat_hatplay_100.mid",
      description:
        "Alternating open/closed hats with basic kick-snare pattern (100 BPM)",
    },
    {
      name: "Ghost Note Snare Pattern",
      file: "backbeat_ghost_105.mid",
      description: "Ghost snare notes between main backbeats (105 BPM)",
    },
    {
      name: "Syncopated Backbeat",
      file: "backbeat_syncopated_110.mid",
      description: "Complex kick-snare interaction with syncopation (110 BPM)",
    },
    {
      name: "Fill Ending Pattern",
      file: "backbeat_fill_115.mid",
      description: "Basic backbeat with fill in final bar (115 BPM)",
    },
    {
      name: "Linear Groove Pattern",
      file: "backbeat_linear_120.mid",
      description: "No overlapping hits - one sound at a time (120 BPM)",
    },
  ],
  "Kick Variations": [
    {
      name: "Basic Double Kick",
      file: "kick_double_090.mid",
      description:
        "Close kick hits with steady backbeat - Boom-bap style (90 BPM)",
    },
    {
      name: "Syncopated Kicks",
      file: "kick_sync_095.mid",
      description:
        "Kick on 16th note offbeats - Neo-soul/Dilla-style swing (95 BPM)",
    },
    {
      name: "Ghost Kick Layer",
      file: "kick_ghostlayer_100.mid",
      description:
        "Ghost kicks with snare interaction - Chillhop/RnB pocket (100 BPM)",
    },
    {
      name: "Mid-Bar Kick Cluster",
      file: "kick_cluster_105.mid",
      description:
        "Kick fills mid-bar for tension - Hip-hop boom-bap style (105 BPM)",
    },
    {
      name: "Kick Flam Effect",
      file: "kick_flam_110.mid",
      description:
        "Double-tap kick hits for flam feel - Funk/Breakbeat style (110 BPM)",
    },
    {
      name: "Push Pull Kick Pattern",
      file: "kick_pushpull_115.mid",
      description: "Early + delayed kicks for groove manipulation (115 BPM)",
    },
    {
      name: "Hi-Hat Gaps Kick Fill",
      file: "kick_fillgap_120.mid",
      description:
        "Kicks filling hi-hat gaps - Breakbeat/Dance style (120 BPM)",
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
