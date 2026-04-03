function updateStatus(message, isError = false) {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${isError ? "error" : "success"}`;
}

function showJsonOutput(json) {
  // Debug output disabled in production
  console.log('Parsed script data:', json);
}

function processText(text) {
  const lines = text.split("\n");
  let currentAct = "ACT I";
  let currentSceneKey = null;
  const result = { "ACT I": {} };
  let currentRawLines = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      if (currentSceneKey !== null) {
        currentRawLines.push(''); // preserve empty lines so classifier can reset context
      }
      continue;
    }

    // Check for ACT headers (ACT I, ACT II, ACT III, ACT IV, ACT V, etc.)
    const actMatch = trimmedLine.match(/^ACT\s+(I{1,3}|IV|V|VI{0,3})$/i);
    if (actMatch) {
      if (currentSceneKey) {
        result[currentAct][currentSceneKey].rawLines = [...currentRawLines];
      }
      currentAct = `ACT ${actMatch[1].toUpperCase()}`;
      result[currentAct] = {};
      currentSceneKey = null;
      currentRawLines = [];
      continue;
    }

    // Check for scene headers: numbered ("1. INT...") or unnumbered ("INT. ..." / "EXT. ...")
    if (
      /^\d+\.\s*(INT\.?|EXT\.?)/i.test(trimmedLine) ||
      /^(INT\.?|EXT\.?)\s+/i.test(trimmedLine)
    ) {
      if (currentSceneKey) {
        result[currentAct][currentSceneKey].rawLines = [...currentRawLines];
      }
      currentSceneKey = trimmedLine;
      result[currentAct][currentSceneKey] = { rawLines: [] };
      currentRawLines = [];
      continue;
    }

    // Body line — accumulate into current scene
    if (currentSceneKey !== null) {
      currentRawLines.push(trimmedLine);
    }
  }

  // Flush the last scene
  if (currentSceneKey) {
    result[currentAct][currentSceneKey].rawLines = [...currentRawLines];
  }

  return result;
  // Shape: { "ACT I": { "1. EXT. ROADSIDE - EVENING": { rawLines: [...] } } }
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

function convertToCompoundTableFormat(result) {
  // Map new result shape { "ACT I": { "scene heading": { rawLines: [] } } }
  // to compound table node array
  return Object.entries(result).map(([actLabel, scenes], actIndex) => ({
    type: "super",
    number: actIndex + 1,
    title: actLabel,
    children: Object.entries(scenes).map(([sceneKey, sceneData], sceneIndex) => ({
      type: "high",
      number: sceneIndex + 1,
      title: sceneKey,
      rawLines: sceneData.rawLines || [],  // preserved for script preview panel
      children: [
        {
          type: "compound",
          number: 1,
          title: "Sequence 1",
          children: [
            {
              type: "basic",
              number: 1,
              content: { content: "", imageData: null, canvasData: null },
            },
          ],
        },
      ],
    })),
  }));
}

async function processFile() {
  const fileInput = document.getElementById("scriptFile");
  const file = fileInput.files[0];

  if (!file) {
    updateStatus("Please select a file", true);
    return;
  }

  const fileType = file.name.split(".").pop().toLowerCase();

  try {
    updateStatus("Processing file...");
    console.log(`Processing file of type: ${fileType}`);

    // ── JSON re-upload: restore a previously exported shot list ──────────
    if (fileType === "json") {
      const text = await file.text();
      const parsed = JSON.parse(text);
      window.compoundTableDataList = parsed;
      window.renderAllL1Tables();
      const tabCompoundTable = document.getElementById("tab-compound-table");
      if (tabCompoundTable) tabCompoundTable.click();
      const emptyStateJson = document.getElementById('sl-empty-state');
      if (emptyStateJson) emptyStateJson.style.display = 'none';
      updateStatus("Shot list restored successfully!");
      return;
    }

    // ── PDF / DOCX ────────────────────────────────────────────────────────
    let result;
    if (fileType === "pdf") {
      result = await processPdf(file);
    } else if (fileType === "docx" || fileType === "doc") {
      result = await processDocx(file);
    } else {
      throw new Error(
        "Unsupported file type. Please upload a PDF, DOCX, DOC, or JSON file."
      );
    }

    // Convert the processed data to compound table format
    const compoundTableData = convertToCompoundTableFormat(result);

    // Initialize the compound table with the data
    window.compoundTableDataList = compoundTableData;
    window.renderAllL1Tables();

    // Switch to compound table view
    const tabCompoundTable = document.getElementById("tab-compound-table");
    if (tabCompoundTable) {
      tabCompoundTable.click();
    }

    showJsonOutput(result);
    const emptyState = document.getElementById('sl-empty-state');
    if (emptyState) emptyState.style.display = 'none';
    updateStatus("File processed successfully!");
  } catch (error) {
    console.error("Processing error:", error);
    updateStatus(error.message, true);
  }
}
