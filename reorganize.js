const fs = require("fs");
const path = require("path");

// Create new directories
const directories = [
  "assets/game/js",
  "assets/game/css",
  "assets/game/sounds",
  "assets/game/midi",
  "assets/game/json",
  "assets/shot-list/js",
  "assets/shot-list/css",
  "assets/blog/images",
];

directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Move game-related files
const gameFiles = {
  "assets/js/game.js": "assets/game/js/game.js",
  "assets/js/admin.js": "assets/game/js/admin.js",
  "assets/js/admin/create.js": "assets/game/js/create.js",
  "assets/css/game.css": "assets/game/css/game.css",
  "assets/css/admin.css": "assets/game/css/admin.css",
  "assets/css/admin/create.css": "assets/game/css/create.css",
  "assets/sounds": "assets/game/sounds",
  "assets/midi": "assets/game/midi",
  "assets/json": "assets/game/json",
};

// Move shot-list files
const shotListFiles = {
  "assets/js/shot-list.js": "assets/shot-list/js/shot-list.js",
};

// Function to move files
function moveFiles(fileMap) {
  Object.entries(fileMap).forEach(([src, dest]) => {
    if (fs.existsSync(src)) {
      if (fs.lstatSync(src).isDirectory()) {
        // Copy directory contents
        const files = fs.readdirSync(src);
        files.forEach((file) => {
          const srcPath = path.join(src, file);
          const destPath = path.join(dest, file);
          fs.copyFileSync(srcPath, destPath);
        });
      } else {
        // Copy single file
        fs.copyFileSync(src, dest);
      }
    }
  });
}

// Execute moves
moveFiles(gameFiles);
moveFiles(shotListFiles);

console.log("Reorganization complete!");
