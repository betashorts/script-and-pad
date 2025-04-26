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
  let currentLines = [];

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
      currentScene = "scene_0_act_" + actMatch[1];
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

async function processPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join("\n");
      fullText += pageText + "\n";
    }

    return processText(fullText);
  } catch (error) {
    throw new Error("Error processing PDF: " + error.message);
  }
}

async function processDocx(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    if (result.value) {
      return processText(result.value);
    } else {
      throw new Error("No text content found in the document");
    }
  } catch (error) {
    throw new Error("Error processing DOCX: " + error.message);
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
    updateStatus(error.message, true);
  }
}
