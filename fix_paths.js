const fs = require("fs");
const path = require("path");

// Update paths in game.js
const gameJsPath = "assets/game/js/game.js";
let gameJsContent = fs.readFileSync(gameJsPath, "utf8");
gameJsContent = gameJsContent.replace(
  'import { BEAT_CATEGORIES, getAllBeats } from "../constants/beats.js";',
  'import { BEAT_CATEGORIES, getAllBeats } from "../../game/constants/beats.js";'
);
fs.writeFileSync(gameJsPath, gameJsContent);

// Update paths in admin.js
const adminJsPath = "assets/game/js/admin.js";
let adminJsContent = fs.readFileSync(adminJsPath, "utf8");
adminJsContent = adminJsContent.replace(
  'import { getAllBeats } from "../constants/beats.js";',
  'import { getAllBeats } from "../../game/constants/beats.js";'
);
adminJsContent = adminJsContent.replace(
  'const response = await fetch("../assets/json/mapping.json");',
  'const response = await fetch("/assets/game/json/mapping.json");'
);
fs.writeFileSync(adminJsPath, adminJsContent);

// Update paths in create.js
const createJsPath = "assets/game/js/create.js";
let createJsContent = fs.readFileSync(createJsPath, "utf8");
createJsContent = createJsContent.replace(
  'const response = await fetch("../../../assets/json/mapping.json");',
  'const response = await fetch("/assets/game/json/mapping.json");'
);
fs.writeFileSync(createJsPath, createJsContent);

// Clean up old directories
const oldDirs = [
  "assets/js",
  "assets/css/admin",
  "assets/css",
  "assets/json",
  "assets/midi",
  "assets/sounds",
  "assets/constants",
];

oldDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Removed old directory: ${dir}`);
  }
});

console.log("Path updates and cleanup complete!");
