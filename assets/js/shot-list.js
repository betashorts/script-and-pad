function updateStatus(message, isError = false) {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${isError ? "error" : "success"}`;
}

function showJsonOutput(json) {
  const outputDiv = document.getElementById("jsonOutput");
  outputDiv.textContent = JSON.stringify(json, null, 2);
  outputDiv.style.display = "block";
}

function processText(text) {
  const lines = text.split("\n");
  const result = {};
  let currentAct = "ACT 0";
  let currentScene = "scene_0_act_0";

  result[currentAct] = {
    [currentScene]: [],
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check for ACT headers
    const actMatch = trimmedLine.match(/^ACT\s+(I|II|III|IV|V)$/i);
    if (actMatch) {
      currentAct = `ACT ${actMatch[1]}`;
      currentScene = `scene_0_act_${actMatch[1]}`;
      result[currentAct] = {
        [currentScene]: [],
      };
      continue;
    }

    // Check for scene headers
    const sceneMatch = trimmedLine.match(/^\d+\.\s*(INT\.?|EXT\.?)/i);
    if (sceneMatch) {
      currentScene = trimmedLine;
      if (!result[currentAct][currentScene]) {
        result[currentAct][currentScene] = [];
      }
      continue;
    }

    // Add line to current scene
    if (!result[currentAct][currentScene]) {
      result[currentAct][currentScene] = [];
    }
    result[currentAct][currentScene].push(trimmedLine);
  }

  return result;
}

function groupItemsIntoLines(items, yTolerance = 2) {
  // Sort items by y (descending, because PDF y=0 is bottom), then x (ascending)
  items.sort((a, b) => {
    const dy = b.transform[5] - a.transform[5];
    if (Math.abs(dy) > yTolerance) return dy;
    return a.transform[4] - b.transform[4];
  });

  const lines = [];
  let currentLine = [];
  let currentY = null;

  items.forEach((item) => {
    const y = item.transform[5];
    if (currentY === null || Math.abs(y - currentY) <= yTolerance) {
      currentLine.push(item);
      currentY = y;
    } else {
      // Sort currentLine by x, join, and push to lines
      lines.push(
        currentLine
          .sort((a, b) => a.transform[4] - b.transform[4])
          .map((i) => i.str)
          .join(" ")
      );
      currentLine = [item];
      currentY = y;
    }
  });

  // Push the last line
  if (currentLine.length) {
    lines.push(
      currentLine
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map((i) => i.str)
        .join(" ")
    );
  }

  return lines;
}

async function processPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const lines = groupItemsIntoLines(textContent.items);
      fullText += lines.join("\n") + "\n";
    }

    return processText(fullText);
  } catch (error) {
    console.error("PDF processing error:", error);
    throw new Error("Error processing PDF: " + error.message);
  }
}

async function processDocx(file) {
  try {
    console.log("Starting DOCX processing...");
    const arrayBuffer = await file.arrayBuffer();
    console.log("File loaded as ArrayBuffer");

    if (!window.mammoth) {
      throw new Error(
        "Mammoth library not loaded. Please refresh the page and try again."
      );
    }

    console.log("Using Mammoth.js for processing...");
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    console.log("Text extracted successfully");

    if (!result.value) {
      throw new Error("No text content found in the document");
    }

    return processText(result.value);
  } catch (error) {
    console.error("DOCX processing error:", error);
    throw new Error(`Error processing DOCX: ${error.message}`);
  }
}

async function processFile() {
  const fileInput = document.getElementById("scriptFile");
  const file = fileInput.files[0];

  if (!file) {
    updateStatus("Please select a file", true);
    return;
  }

  const fileType = file.name.split(".").pop().toLowerCase();
  let result;

  try {
    updateStatus("Processing file...");
    console.log(`Processing file of type: ${fileType}`);

    if (fileType === "pdf") {
      result = await processPdf(file);
    } else if (fileType === "docx" || fileType === "doc") {
      result = await processDocx(file);
    } else {
      throw new Error(
        "Unsupported file type. Please upload a PDF, DOCX, or DOC file."
      );
    }

    showJsonOutput(result);
    updateStatus("File processed successfully!");
  } catch (error) {
    console.error("Processing error:", error);
    updateStatus(error.message, true);
  }
}
