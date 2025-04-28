const fs = require("fs");
const path = require("path");

// Create blog/images directory if it doesn't exist
const blogImagesDir = "assets/blog/images";
if (!fs.existsSync(blogImagesDir)) {
  fs.mkdirSync(blogImagesDir, { recursive: true });
}

// Move all images from assets/images to assets/blog/images
const imagesDir = "assets/images";
const files = fs.readdirSync(imagesDir);

files.forEach((file) => {
  if (
    file.endsWith(".webp") ||
    file.endsWith(".jpg") ||
    file.endsWith(".png")
  ) {
    const sourcePath = path.join(imagesDir, file);
    const destPath = path.join(blogImagesDir, file);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Moved ${file} to blog/images`);
  }
});

// Update image paths in _posts files
const postsDir = "_posts";
const postFiles = fs.readdirSync(postsDir);

postFiles.forEach((file) => {
  if (file.endsWith(".md")) {
    const filePath = path.join(postsDir, file);
    let content = fs.readFileSync(filePath, "utf8");

    // Update image paths
    content = content.replace(/\/assets\/images\//g, "/assets/blog/images/");

    fs.writeFileSync(filePath, content);
    console.log(`Updated image paths in ${file}`);
  }
});

// Update image paths in _layouts/post.html
const postLayoutPath = "_layouts/post.html";
let postLayoutContent = fs.readFileSync(postLayoutPath, "utf8");
postLayoutContent = postLayoutContent.replace(
  /\/assets\/images\//g,
  "/assets/blog/images/"
);
fs.writeFileSync(postLayoutPath, postLayoutContent);
console.log("Updated image paths in post.html");

// Update image paths in _layouts/default.html
const defaultLayoutPath = "_layouts/default.html";
let defaultLayoutContent = fs.readFileSync(defaultLayoutPath, "utf8");
defaultLayoutContent = defaultLayoutContent.replace(
  /\/assets\/images\//g,
  "/assets/blog/images/"
);
fs.writeFileSync(defaultLayoutPath, defaultLayoutContent);
console.log("Updated image paths in default.html");

// Clean up old images directory
if (fs.existsSync(imagesDir)) {
  fs.rmSync(imagesDir, { recursive: true, force: true });
  console.log("Removed old images directory");
}

console.log("Image move and path updates complete!");
