// Debug version 17
console.log("Compound Table deployed - version 36");

// Performance monitoring utility
const perf = {
  startTime: null,
  async start(operation) {
    this.startTime = performance.now();
    this.operation = operation;
    await loader.show(operation);
  },
  async end() {
    if (!this.startTime) return;
    const duration = (performance.now() - this.startTime).toFixed(2);
    console.log(`⚡ ${this.operation}: ${duration}ms`);
    this.startTime = null;
    await loader.hide();
  },
};

// Loader utility
const loader = {
  overlay: null,
  init() {
    if (!this.overlay) {
      this.overlay = document.createElement("div");
      this.overlay.className = "loader-overlay";

      const container = document.createElement("div");
      container.className = "loader-container";

      const spinner = document.createElement("div");
      spinner.className = "loader";

      const text = document.createElement("div");
      text.className = "loader-text";

      container.appendChild(spinner);
      container.appendChild(text);
      this.overlay.appendChild(container);
      document.body.appendChild(this.overlay);
    }
  },
  async show(operation) {
    this.init();
    const text = this.overlay.querySelector(".loader-text");
    text.textContent = operation;
    this.overlay.classList.add("active");
    // Force a reflow to ensure the loader is shown
    this.overlay.offsetHeight;
    return new Promise((resolve) => setTimeout(resolve, 50));
  },
  async hide() {
    if (this.overlay) {
      this.overlay.classList.remove("active");
      return new Promise((resolve) => setTimeout(resolve, 300)); // Allow time for fade out
    }
  },
};

// Compound Table Data Structure Example
let compoundTableData = {
  type: "super",
  number: 1,
  title: "ACT 1",
  children: [
    {
      type: "high",
      number: 1,
      title: "Scene 1",
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
    },
  ],
};

// Add shot options data
const SHOT_SIZES = {
  CLOSEUPS: [
    "Extreme Close-up (ECU)",
    "Medium Close-up",
    "Full Close-up",
    "Wide Close-up",
  ],
  MEDIUM_SHOTS: ["Close Shot", "Medium Close Shot", "Medium Shot"],
  FULL_SHOTS: ["Medium Full Shot", "Full Shot"],
  LONG_SHOTS: ["Wide Shot", "Long Shot", "Extreme Long Shot"],
};

const SHOT_TYPES = {
  FRAMING: [
    "Over The Shoulder",
    "Over The Hip",
    "Two Shot",
    "Three Shot",
    "Point of View",
  ],
  FOCUS_DOF: [
    "Rack Focus",
    "Shallow Focus",
    "Deep Focus",
    "Tilt-Shift",
    "Zoom",
    "Dutch",
  ],
  CAMERA_HEIGHT: [
    "Eye Level",
    "Low Angle",
    "High Angle",
    "Bird's Eye View",
    "Overhead",
    "Shoulder Level",
    "Hip Level",
    "Knee Level",
    "Ground Level",
  ],
};

const ANGLES = [
  "Eye Level","Low Angle","High Angle","Dutch Angle",
  "Overhead","Worm's Eye","POV",
];
const MOVEMENTS = [
  "Static","Pan","Tilt","Dolly In","Dolly Out",
  "Track Left","Track Right","Handheld","Steadicam",
  "Crane Up","Crane Down","Zoom In","Zoom Out","Arc",
];
const LENSES = [
  "Ultra Wide (14-20mm)","Wide (24mm)","Standard (35mm)",
  "Normal (50mm)","Portrait (85mm)","Telephoto (135mm+)",
];
const FRAME_RATES = ["24fps","25fps","48fps","60fps","120fps"];
const EQUIPMENT_OPTIONS = [
  "Tripod","Handheld","Steadicam","Gimbal","Dolly","Crane/Jib","Drone","Monopod",
];
const SOUND_OPTIONS = [
  "Dialogue","Ambient Only","Voice Over","SFX","Music","Silent",
];
const PRIORITY_OPTIONS = ["must-have","nice-to-have"];

// Utility to generate incremental numbers
function getNextNumber(arr) {
  return arr.length ? Math.max(...arr.map((x) => x.number)) + 1 : 1;
}

// Simplified drag-and-drop functionality
function initDragAndDrop(element, unit, parentArr, index) {
  element.setAttribute("draggable", true);
  element.dataset.index = index;
  element.dataset.level = unit.type;

  element.addEventListener("dragstart", (e) => {
    e.stopPropagation();
    element.classList.add("dragging");
    // Store the source index and unit type
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        index: index,
        type: unit.type,
      })
    );
  });

  element.addEventListener("dragend", () => {
    element.classList.remove("dragging");
    document
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
  });

  element.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow dropping if it's the same type of unit
    const draggedData = JSON.parse(
      e.dataTransfer.getData("text/plain") || "{}"
    );
    if (draggedData.type === unit.type) {
      element.classList.add("drag-over");
    }
  });

  element.addEventListener("dragleave", () => {
    element.classList.remove("drag-over");
  });

  element.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove("drag-over");

    try {
      const draggedData = JSON.parse(
        e.dataTransfer.getData("text/plain") || "{}"
      );
      const sourceIndex = draggedData.index;
      const targetIndex = parseInt(element.dataset.index);

      // Only proceed if:
      // 1. We have valid indices
      // 2. Source and target are different
      // 3. Same type of units
      // 4. We have a valid parent array
      if (
        !isNaN(sourceIndex) &&
        !isNaN(targetIndex) &&
        sourceIndex !== targetIndex &&
        draggedData.type === unit.type &&
        parentArr
      ) {
        // Remove the item from its original position
        const [movedItem] = parentArr.splice(sourceIndex, 1);

        // Insert at the new position
        // If dropping after current position, we need to adjust the target index
        const adjustedTargetIndex =
          sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        parentArr.splice(adjustedTargetIndex + 1, 0, movedItem);

        // Update all numbers sequentially
        parentArr.forEach((item, idx) => {
          item.number = idx + 1;
        });

        // Rerender
        window.renderAllL1Tables();
      }
    } catch (error) {
      console.error("Error during drag and drop:", error);
    }
  });
}

// Render the compound table recursively
function renderCompoundTable(container, data, rootData, l1Idx) {
  container.innerHTML = "";
  renderUnit(container, data, 0, rootData, l1Idx, null, null);
}

function renderCompoundRow(parent, basicUnits, level) {
  // Step 1: Flatten all columns from all L4 units, preserving order
  let flatColumns = [];
  for (let i = 0; i < basicUnits.length; i++) {
    let unit = basicUnits[i];
    for (let j = 0; j < unit.columns.length; j++) {
      flatColumns.push({ unit, col: unit.columns[j], colIdx: j });
    }
  }
  console.log(
    `[L${level + 1}] Flattened columns:`,
    flatColumns.length,
    flatColumns
  );
  // Step 2: Compute number of rows
  const numRows = Math.ceil(flatColumns.length / 6);
  console.log(`[L${level + 1}] Number of rows needed:`, numRows);
  // Step 3: Fill rows
  let colPointer = 0;
  for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
    let row = document.createElement("div");
    row.className = "compound-table-row";
    // Step 4: Render up to 6 columns in this row
    let renderedL4s = new Set();
    for (
      let colInRow = 0;
      colInRow < 6 && colPointer < flatColumns.length;
      colInRow++, colPointer++
    ) {
      const { unit, col, colIdx } = flatColumns[colPointer];
      let showL4Header = !renderedL4s.has(unit) || colIdx === 0;
      console.log(
        `[L${level + 1}] Row ${rowIdx + 1}, Col ${
          colInRow + 1
        }: Rendering L4 unit`,
        unit.number,
        "column",
        colIdx,
        "showL4Header:",
        showL4Header
      );
      renderBasicUnitCell(row, unit, level, colIdx, col, showL4Header);
      renderedL4s.add(unit);
    }
    parent.appendChild(row);
  }
  // Add column button for the last L4 unit
  if (basicUnits.length > 0) {
    const lastUnit = basicUnits[basicUnits.length - 1];
    const addColBtn = document.createElement("button");
    addColBtn.textContent = "+";
    addColBtn.onclick = () => {
      console.log(`[ADD] Adding column to unit`, lastUnit);
      lastUnit.columns.push({ content: "" });
      renderCompoundTable(
        document.getElementById("compound-table-root"),
        compoundTableData
      );
    };
    parent.appendChild(addColBtn);
  }
}

function renderUnit(parent, unit, level, rootData, l1Idx, parentArr, unitIdx) {
  const wrapper = document.createElement("div");
  wrapper.className = `compound-level compound-level-${level}`;
  wrapper.dataset.level = unit.type;

  // Top row with number and level prefix
  const topRow = document.createElement("div");
  topRow.className = "compound-top-row";

  // Add drag handle
  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.textContent = "⋮⋮";
  topRow.appendChild(dragHandle);

  // ── Scene (level 1): collapse chevron + script preview button ──────────
  let sceneChevron = null;
  if (level === 1) {
    sceneChevron = document.createElement("button");
    sceneChevron.textContent = "▶";
    sceneChevron.title = "Expand / Collapse scene";
    sceneChevron.style.cssText =
      "background:transparent;border:none;color:rgba(201,168,76,0.7);font-size:0.7rem;" +
      "cursor:pointer;padding:2px 6px 2px 0;transition:transform 0.2s;flex-shrink:0;";
    topRow.appendChild(sceneChevron);

    const previewBtn = document.createElement("button");
    const hasLines = unit.rawLines && unit.rawLines.length > 0;
    previewBtn.textContent = "📄 Script";
    previewBtn.title = hasLines ? "View scene script" : "No script text available";
    previewBtn.disabled = !hasLines;
    previewBtn.style.cssText =
      "font-size:0.68rem;padding:2px 8px;border:1px solid rgba(201,168,76,0.35);" +
      "border-radius:4px;background:transparent;color:#c9a84c;cursor:" +
      (hasLines ? "pointer" : "default") + ";opacity:" + (hasLines ? "1" : "0.35") + ";";
    if (hasLines) {
      previewBtn.onclick = (e) => {
        e.stopPropagation();
        openScenePreview(unit.rawLines, unit.title);
      };
    }
    topRow.appendChild(previewBtn);
  }

  // Update the label based on level
  const label = document.createElement("span");
  let levelText;
  let isEditable = false;

  switch (level) {
    case 0:
      levelText = unit.title || `ACT ${unit.number}`;
      break;
    case 1:
      levelText = unit.title || `Scene ${unit.number}`;
      isEditable = true;
      break;
    case 2:
      levelText = unit.title || `Sequence ${unit.number}`;
      isEditable = true;
      break;
    case 3:
      levelText = `Shot ${unit.number}`;
      break;
    default:
      levelText = `Level ${level + 1} ${unit.number}`;
  }

  if (isEditable) {
    const titleSpan = document.createElement("span");
    titleSpan.contentEditable = true;
    titleSpan.className = "editable-title";
    titleSpan.textContent = levelText;

    titleSpan.addEventListener("blur", () => {
      unit.title = titleSpan.textContent.trim();
    });

    titleSpan.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        titleSpan.blur();
      }
    });

    label.appendChild(titleSpan);
  } else {
    label.textContent = levelText;
  }

  topRow.appendChild(label);

  // Initialize drag and drop if we have a parent array
  if (parentArr) {
    initDragAndDrop(wrapper, unit, parentArr, unitIdx);
  }

  // Insert and Remove buttons for this unit (except for the root L1 if only one left)
  const btnGroup = document.createElement("span");
  btnGroup.style.marginLeft = "8px";

  if (level === 0) {
    // Dedicated L1 plus button (for level 0)
    const l1InsertBtn = document.createElement("button");
    l1InsertBtn.textContent = "+";
    l1InsertBtn.title = "Insert L1 below";
    l1InsertBtn.onclick = () => {
      // Insert new L1 (super) below the current one
      const newItem = {
        type: "super",
        number: getNextNumber(window.compoundTableDataList),
        title: `ACT ${getNextNumber(window.compoundTableDataList)}`,
        children: [],
      };
      window.compoundTableDataList.splice(l1Idx + 1, 0, newItem);
      window.renderAllL1Tables();
    };
    btnGroup.appendChild(l1InsertBtn);

    // Add up/down arrow buttons for L1
    const upBtn = document.createElement("button");
    upBtn.textContent = "↑";
    upBtn.title = "Move up";
    upBtn.disabled = l1Idx === 0;
    upBtn.onclick = () => {
      if (l1Idx > 0) {
        [
          window.compoundTableDataList[l1Idx - 1],
          window.compoundTableDataList[l1Idx],
        ] = [
          window.compoundTableDataList[l1Idx],
          window.compoundTableDataList[l1Idx - 1],
        ];
        window.compoundTableDataList.forEach((item, idx) => {
          item.number = idx + 1;
        });
        window.renderAllL1Tables();
      }
    };
    btnGroup.appendChild(upBtn);

    const downBtn = document.createElement("button");
    downBtn.textContent = "↓";
    downBtn.title = "Move down";
    downBtn.disabled = l1Idx === window.compoundTableDataList.length - 1;
    downBtn.onclick = () => {
      if (l1Idx < window.compoundTableDataList.length - 1) {
        [
          window.compoundTableDataList[l1Idx + 1],
          window.compoundTableDataList[l1Idx],
        ] = [
          window.compoundTableDataList[l1Idx],
          window.compoundTableDataList[l1Idx + 1],
        ];
        window.compoundTableDataList.forEach((item, idx) => {
          item.number = idx + 1;
        });
        window.renderAllL1Tables();
      }
    };
    btnGroup.appendChild(downBtn);
  }
  // L4 left/right arrow buttons (for basic units)
  if (parentArr && unit.type === "basic") {
    const leftBtn = document.createElement("button");
    leftBtn.textContent = "←";
    leftBtn.title = "Move left";
    leftBtn.disabled = unitIdx === 0;
    leftBtn.onclick = () => {
      if (unitIdx > 0) {
        [parentArr[unitIdx - 1], parentArr[unitIdx]] = [
          parentArr[unitIdx],
          parentArr[unitIdx - 1],
        ];
        parentArr.forEach((item, idx) => {
          item.number = idx + 1;
        });
        window.renderAllL1Tables();
      }
    };
    btnGroup.appendChild(leftBtn);
    const rightBtn = document.createElement("button");
    rightBtn.textContent = "→";
    rightBtn.title = "Move right";
    rightBtn.disabled = unitIdx === parentArr.length - 1;
    rightBtn.onclick = () => {
      if (unitIdx < parentArr.length - 1) {
        [parentArr[unitIdx + 1], parentArr[unitIdx]] = [
          parentArr[unitIdx],
          parentArr[unitIdx + 1],
        ];
        parentArr.forEach((item, idx) => {
          item.number = idx + 1;
        });
        window.renderAllL1Tables();
      }
    };
    btnGroup.appendChild(rightBtn);
  }
  if (parentArr && level !== 0) {
    const insertBtn = document.createElement("button");
    insertBtn.textContent = "+";
    insertBtn.title = "Insert after";
    insertBtn.onclick = () => {
      let newItem;
      if (unit.type === "super") {
        // Insert new L1 (super) below
        newItem = {
          type: "super",
          number: getNextNumber(window.compoundTableDataList),
          title: `ACT ${getNextNumber(window.compoundTableDataList)}`,
          children: [],
        };
        window.compoundTableDataList.splice(l1Idx + 1, 0, newItem);
      } else if (unit.type === "high") {
        // Insert new L2 (high) below
        newItem = {
          type: "high",
          number: getNextNumber(parentArr),
          title: `Scene ${getNextNumber(parentArr)}`,
          children: [],
        };
        parentArr.splice(unitIdx + 1, 0, newItem);
      } else if (unit.type === "compound") {
        // Insert new L3 (compound) below
        newItem = {
          type: "compound",
          number: getNextNumber(parentArr),
          title: `Sequence ${getNextNumber(parentArr)}`,
          children: [],
        };
        parentArr.splice(unitIdx + 1, 0, newItem);
      } else if (unit.type === "basic") {
        // Insert new L4 (basic) below
        newItem = {
          type: "basic",
          number: getNextNumber(parentArr),
          content: { content: "", imageData: null, canvasData: null },
        };
        parentArr.splice(unitIdx + 1, 0, newItem);
      }
      window.renderAllL1Tables();
    };
    btnGroup.appendChild(insertBtn);
    // Up/Down arrow buttons for L1, L2, L3
    if (unit.type !== "basic") {
      const upBtn = document.createElement("button");
      upBtn.textContent = "↑";
      upBtn.title = "Move up";
      upBtn.disabled = unitIdx === 0;
      upBtn.onclick = () => {
        if (unitIdx > 0) {
          [parentArr[unitIdx - 1], parentArr[unitIdx]] = [
            parentArr[unitIdx],
            parentArr[unitIdx - 1],
          ];
          parentArr.forEach((item, idx) => {
            item.number = idx + 1;
          });
          window.renderAllL1Tables();
        }
      };
      btnGroup.appendChild(upBtn);
      const downBtn = document.createElement("button");
      downBtn.textContent = "↓";
      downBtn.title = "Move down";
      downBtn.disabled = unitIdx === parentArr.length - 1;
      downBtn.onclick = () => {
        if (unitIdx < parentArr.length - 1) {
          [parentArr[unitIdx + 1], parentArr[unitIdx]] = [
            parentArr[unitIdx],
            parentArr[unitIdx + 1],
          ];
          parentArr.forEach((item, idx) => {
            item.number = idx + 1;
          });
          window.renderAllL1Tables();
        }
      };
      btnGroup.appendChild(downBtn);
    }
    // Remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "-";
    removeBtn.title = "Remove";
    removeBtn.onclick = () => {
      parentArr.splice(unitIdx, 1);
      window.renderAllL1Tables();
    };
    btnGroup.appendChild(removeBtn);
  } else if (level === 0 && window.compoundTableDataList.length > 1) {
    // Remove button for L1
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "-";
    removeBtn.title = "Remove L1";
    removeBtn.onclick = () => {
      window.compoundTableDataList.splice(l1Idx, 1);
      window.renderAllL1Tables();
    };
    btnGroup.appendChild(removeBtn);
  }
  topRow.appendChild(btnGroup);
  wrapper.appendChild(topRow);

  // Bottom row
  const bottomRow = document.createElement("div");
  bottomRow.className = "compound-bottom-row";
  bottomRow.style.flexDirection = "column";

  // Scene collapse: default collapsed except very first scene in first act
  if (level === 1) {
    const isFirstScene = (l1Idx === 0 && unitIdx === 0);
    bottomRow.style.display = isFirstScene ? "block" : "none";
    if (sceneChevron) {
      sceneChevron.style.transform = isFirstScene ? "rotate(90deg)" : "";
      sceneChevron.onclick = (e) => {
        e.stopPropagation();
        const isOpen = bottomRow.style.display !== "none";
        bottomRow.style.display = isOpen ? "none" : "block";
        sceneChevron.style.transform = isOpen ? "" : "rotate(90deg)";
      };
    }
  } else {
    bottomRow.style.display = "flex";
  }

  if (unit.type === "basic") {
    // console.log(`Rendering basic unit row at level ${level}`);
    renderBasicUnitRow(
      bottomRow,
      unit,
      level,
      rootData,
      l1Idx,
      parentArr,
      unitIdx
    );
  } else {
    // console.log(`Rendering children for ${unit.type} unit at level ${level}`);
    unit.children.forEach((child, idx) => {
      renderUnit(
        bottomRow,
        child,
        level + 1,
        rootData,
        l1Idx,
        unit.children,
        idx
      );
    });
    // Add button to add new child at the end
    const addBtn = document.createElement("button");
    if (unit.type === "compound") {
      addBtn.textContent = "Add Shot";
    } else if (unit.type === "high") {
      addBtn.textContent = "Add Sequence";
    } else if (unit.type === "super") {
      addBtn.textContent = "Add Scene";
    }
    addBtn.onclick = () => {
      if (unit.type === "compound") {
        unit.children.push({
          type: "basic",
          number: getNextNumber(unit.children),
          content: { content: "", imageData: null, canvasData: null },
        });
      } else if (unit.type === "high") {
        unit.children.push({
          type: "compound",
          number: getNextNumber(unit.children),
          children: [],
        });
      } else if (unit.type === "super") {
        unit.children.push({
          type: "high",
          number: getNextNumber(unit.children),
          children: [],
        });
      }
      window.renderAllL1Tables();
    };
    bottomRow.appendChild(addBtn);
  }
  wrapper.appendChild(bottomRow);
  parent.appendChild(wrapper);
}

function renderBasicUnitRow(
  parent,
  unit,
  level,
  rootData,
  l1Idx,
  parentArr,
  unitIdx
) {
  // Only one content area per L4
  let row = document.createElement("div");
  row.className = "compound-table-row";
  renderBasicUnitCell(
    row,
    unit,
    level,
    0, // colIdx is always 0
    unit.content || { content: "", imageData: null, canvasData: null },
    false, // showL4Header
    rootData,
    l1Idx,
    parentArr,
    unitIdx
  );
  parent.appendChild(row);
}

function createAutocompleteDropdown(options, placeholder, customPlaceholder) {
  const container = document.createElement("div");
  container.className = "autocomplete-container";

  const select = document.createElement("select");
  select.className = "shot-dropdown";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = placeholder;
  defaultOption.selected = true;
  defaultOption.disabled = true;
  select.appendChild(defaultOption);

  // Add option groups and their options
  Object.entries(options).forEach(([group, items]) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.replace("_", " ");

    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });

  // Add custom option at the end
  const customOptgroup = document.createElement("optgroup");
  customOptgroup.label = "CUSTOM";
  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = "Custom...";
  customOptgroup.appendChild(customOption);
  select.appendChild(customOptgroup);

  // Custom input (hidden by default)
  const customInput = document.createElement("input");
  customInput.type = "text";
  customInput.className = "custom-shot-input";
  customInput.placeholder = customPlaceholder;
  customInput.style.display = "none";

  // Handle dropdown change
  select.addEventListener("change", (e) => {
    if (e.target.value === "custom") {
      select.style.display = "none";
      customInput.style.display = "block";
      customInput.focus();
    }
  });

  // Handle custom input blur
  customInput.addEventListener("blur", () => {
    if (!customInput.value.trim()) {
      customInput.style.display = "none";
      select.style.display = "block";
      select.value = "";
    }
  });

  container.appendChild(select);
  container.appendChild(customInput);
  return container;
}

function renderBasicUnitCell(
  parent,
  unit,
  level,
  colIdx,
  col,
  showL4Header,
  rootData,
  l1Idx,
  parentArr,
  unitArrIdx
) {
  const cell = document.createElement("div");
  cell.className = "basic-unit";
  if (showL4Header) {
    const top = document.createElement("div");
    top.className = "basic-unit-top";
    top.textContent = `L${
      unit.level !== undefined ? unit.level + 1 : level + 1
    } ${unit.number}`;
    cell.appendChild(top);
  } else {
    const top = document.createElement("div");
    top.className = "basic-unit-top";
    top.style.visibility = "hidden";
    top.textContent = "";
    cell.appendChild(top);
  }

  const bottom = document.createElement("div");
  bottom.className = "basic-unit-bottom";

  // Create content container
  const contentContainer = document.createElement("div");
  contentContainer.className = "basic-unit-content";

  // Tool buttons container
  const toolsContainer = document.createElement("div");
  toolsContainer.className = "basic-unit-tools";

  // File upload button
  const uploadBtn = document.createElement("button");
  uploadBtn.innerHTML = "&#128247;"; // Camera emoji
  uploadBtn.title = "Upload Image";
  uploadBtn.className = "upload-btn";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";

  uploadBtn.onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        col.imageData = event.target.result;
        const img = document.createElement("img");
        img.src = col.imageData;
        imageContainer.innerHTML = "";
        imageContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drawing canvas (optional)
  const canvas = document.createElement("canvas");
  canvas.className = "basic-unit-canvas";
  canvas.width = 300;
  canvas.height = 200;
  canvas.style.display = "none";
  canvas.style.userSelect = "none"; // Prevent selection
  canvas.draggable = false; // Prevent dragging of canvas itself
  let isDrawing = false;
  let context = canvas.getContext("2d");

  // Drawing event listeners
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);

  function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    context.beginPath();
    context.moveTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    );
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    context.lineTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    );
    context.stroke();
  }

  function stopDrawing(e) {
    if (e) {
      e.preventDefault();
    }
    if (isDrawing) {
      isDrawing = false;
      col.canvasData = canvas.toDataURL();
    }
  }

  // Restore previous canvas data if it exists
  if (col.canvasData) {
    const img = new Image();
    img.onload = () => {
      context.drawImage(img, 0, 0);
      canvas.style.display = "block";
    };
    img.src = col.canvasData;
  }

  // Drawing toggle button
  const drawBtn = document.createElement("button");
  drawBtn.innerHTML = "&#9999;&#65039;"; // Pencil emoji
  drawBtn.title = "Toggle Drawing Mode";
  drawBtn.className = "draw-btn";
  let isCanvasVisible = canvas.style.display === "block";
  drawBtn.onclick = () => {
    isCanvasVisible = !isCanvasVisible;
    canvas.style.display = isCanvasVisible ? "block" : "none";
    drawBtn.classList.toggle("active", isCanvasVisible);
  };

  // Clear button
  const clearBtn = document.createElement("button");
  clearBtn.innerHTML = "&#128465;"; // Trash emoji
  clearBtn.title = "Clear Content";
  clearBtn.className = "clear-btn";
  clearBtn.onclick = () => {
    textEditor.innerHTML = "";
    imageContainer.innerHTML = "";
    context.clearRect(0, 0, canvas.width, canvas.height);
    col.content = "";
    col.imageData = null;
    col.canvasData = null;
  };

  // ── Shot field grid (2-column) ───────────────────────────────────────
  const shotDetailsContainer = document.createElement("div");
  shotDetailsContainer.style.cssText =
    "display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;";

  const FIELD_LABEL_STYLE =
    "display:block;font-size:0.65rem;text-transform:uppercase;" +
    "letter-spacing:0.08em;color:rgba(232,224,208,0.45);margin-bottom:3px;";

  // Helper: simple <select> field
  function makeSelectField(labelText, optionsArr, fieldKey) {
    const wrap = document.createElement("div");
    const lbl = document.createElement("label");
    lbl.textContent = labelText;
    lbl.style.cssText = FIELD_LABEL_STYLE;
    const sel = document.createElement("select");
    sel.className = "shot-dropdown";
    const def = document.createElement("option");
    def.value = ""; def.textContent = labelText; def.disabled = true; def.selected = !col[fieldKey];
    sel.appendChild(def);
    optionsArr.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt; o.textContent = opt;
      sel.appendChild(o);
    });
    if (col[fieldKey]) sel.value = col[fieldKey];
    sel.onchange = () => { col[fieldKey] = sel.value; };
    wrap.appendChild(lbl); wrap.appendChild(sel);
    return wrap;
  }

  // Helper: plain text <input> field
  function makeInputField(labelText, fieldKey, placeholder) {
    const wrap = document.createElement("div");
    const lbl = document.createElement("label");
    lbl.textContent = labelText;
    lbl.style.cssText = FIELD_LABEL_STYLE;
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "custom-shot-input";
    inp.placeholder = placeholder || labelText;
    inp.value = col[fieldKey] || "";
    inp.oninput = () => { col[fieldKey] = inp.value; };
    wrap.appendChild(lbl); wrap.appendChild(inp);
    return wrap;
  }

  // Row 1: Shot Size (existing autocomplete) + Angle
  const shotSizeDropdown = createAutocompleteDropdown(
    SHOT_SIZES, "Select Shot Size", "Enter custom shot size..."
  );
  shotSizeDropdown.className = "shot-size-dropdown";
  const shotSizeWrap = document.createElement("div");
  const shotSizeLbl = document.createElement("label");
  shotSizeLbl.textContent = "Shot Size";
  shotSizeLbl.style.cssText = FIELD_LABEL_STYLE;
  shotSizeWrap.appendChild(shotSizeLbl);
  shotSizeWrap.appendChild(shotSizeDropdown);
  shotDetailsContainer.appendChild(shotSizeWrap);

  shotDetailsContainer.appendChild(makeSelectField("Angle", ANGLES, "angle"));

  // Row 2: Movement + Lens
  shotDetailsContainer.appendChild(makeSelectField("Movement", MOVEMENTS, "movement"));
  shotDetailsContainer.appendChild(makeSelectField("Lens", LENSES, "lens"));

  // Row 3: Frame Rate + Equipment
  shotDetailsContainer.appendChild(makeSelectField("Frame Rate", FRAME_RATES, "frameRate"));
  shotDetailsContainer.appendChild(makeSelectField("Equipment", EQUIPMENT_OPTIONS, "equipment"));

  // Row 4: Subject + Sound
  shotDetailsContainer.appendChild(makeInputField("Subject", "subject", "Person or object"));
  shotDetailsContainer.appendChild(makeSelectField("Sound", SOUND_OPTIONS, "sound"));

  // Row 5: Priority + VFX Note
  shotDetailsContainer.appendChild(makeSelectField("Priority", PRIORITY_OPTIONS, "priority"));
  shotDetailsContainer.appendChild(makeInputField("VFX Note", "vfxNote", "None"));

  // Restore + save for shotSize (autocomplete)
  const saveShots = () => {
    const sizeSelect = shotSizeDropdown.querySelector("select");
    const sizeInput  = shotSizeDropdown.querySelector("input");
    col.shotSize = sizeSelect.style.display !== "none" ? sizeSelect.value : sizeInput.value;
  };
  shotSizeDropdown.querySelectorAll("select, input").forEach((el) =>
    el.addEventListener("change", saveShots)
  );
  if (col.shotSize) {
    const sizeSelect = shotSizeDropdown.querySelector("select");
    const sizeInput  = shotSizeDropdown.querySelector("input");
    if ([].slice.call(sizeSelect.options).some((o) => o.value === col.shotSize)) {
      sizeSelect.value = col.shotSize;
    } else {
      sizeSelect.value = "custom";
      sizeSelect.style.display = "none";
      sizeInput.style.display = "block";
      sizeInput.value = col.shotSize;
    }
  }

  // Add all tools
  toolsContainer.appendChild(uploadBtn);
  toolsContainer.appendChild(drawBtn);
  toolsContainer.appendChild(clearBtn);
  toolsContainer.appendChild(fileInput);

  contentContainer.appendChild(toolsContainer);

  // Description (full-width text area)
  const descWrap = document.createElement("div");
  descWrap.style.cssText = "grid-column:1/-1;";
  const descLbl = document.createElement("label");
  descLbl.textContent = "Description";
  descLbl.style.cssText = FIELD_LABEL_STYLE;
  descWrap.appendChild(descLbl);

  const textEditor = document.createElement("div");
  textEditor.className = "basic-unit-text";
  textEditor.contentEditable = true;
  textEditor.innerHTML = col.content || "";
  textEditor.setAttribute("placeholder", "Enter description...");

  // Image container
  const imageContainer = document.createElement("div");
  imageContainer.className = "basic-unit-image";
  if (col.imageData) {
    const img = document.createElement("img");
    img.src = col.imageData;
    imageContainer.appendChild(img);
  }

  // Handle paste events for both text and images
  contentContainer.addEventListener("paste", (e) => {
    e.preventDefault();
    // Handle image paste
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          col.imageData = event.target.result;
          const img = document.createElement("img");
          img.src = col.imageData;
          imageContainer.innerHTML = "";
          imageContainer.appendChild(img);
        };
        reader.readAsDataURL(blob);
        return;
      }
    }
    // Handle text paste
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  });

  // Save text content
  textEditor.oninput = (e) => {
    col.content = e.target.innerHTML;
  };

  // Director/DP Note textarea (full-width)
  const dpNoteEditor = document.createElement("div");
  dpNoteEditor.className = "basic-unit-text";
  dpNoteEditor.contentEditable = true;
  dpNoteEditor.innerHTML = col.dpNote || "";
  dpNoteEditor.setAttribute("placeholder", "Director or DP instruction...");
  dpNoteEditor.oninput = (e) => { col.dpNote = e.target.innerHTML; };
  const dpNoteWrap = document.createElement("div");
  const dpNoteLbl = document.createElement("label");
  dpNoteLbl.textContent = "Director / DP Note";
  dpNoteLbl.style.cssText = FIELD_LABEL_STYLE;
  dpNoteWrap.appendChild(dpNoteLbl);
  dpNoteWrap.appendChild(dpNoteEditor);

  descWrap.appendChild(textEditor);   // textEditor lives inside the Description label wrapper

  contentContainer.appendChild(shotDetailsContainer);
  contentContainer.appendChild(descWrap);
  contentContainer.appendChild(dpNoteWrap);
  contentContainer.appendChild(imageContainer);
  contentContainer.appendChild(canvas);

  bottom.appendChild(contentContainer);
  cell.appendChild(bottom);
  parent.appendChild(cell);
}

// ── Scene Script Preview Panel ─────────────────────────────────────────
let _previewPanel = null;
let _previewOpenTitle = null;

function openScenePreview(rawLines, sceneTitle) {
  // Toggle if same scene clicked again
  if (_previewPanel && _previewOpenTitle === sceneTitle) {
    _previewPanel.style.transform = "translateX(100%)";
    _previewOpenTitle = null;
    const section = document.getElementById("compound-table-root");
    if (section) section.style.paddingRight = "";
    return;
  }

  // Create panel once
  if (!_previewPanel) {
    _previewPanel = document.createElement("div");
    _previewPanel.id = "scene-preview-panel";
    _previewPanel.style.cssText =
      "position:fixed;right:0;top:64px;bottom:0;width:320px;" +
      "transform:translateX(100%);transition:transform 0.25s ease;" +
      "background:#0d1b2a;border-left:1px solid rgba(201,168,76,0.25);" +
      "z-index:500;display:flex;flex-direction:column;";

    const header = document.createElement("div");
    header.style.cssText =
      "background:#162032;padding:12px 16px;display:flex;" +
      "justify-content:space-between;align-items:center;flex-shrink:0;";

    const titleEl = document.createElement("span");
    titleEl.id = "scene-preview-title";
    titleEl.style.cssText =
      "color:#c9a84c;font-family:'Lora',serif;font-size:0.82rem;" +
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText =
      "background:none;border:none;color:#c9a84c;font-size:1.3rem;" +
      "cursor:pointer;line-height:1;padding:0 0 0 8px;flex-shrink:0;";
    closeBtn.onclick = () => {
      _previewPanel.style.transform = "translateX(100%)";
      _previewOpenTitle = null;
      const section = document.getElementById("compound-table-root");
      if (section) section.style.paddingRight = "";
    };

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const body = document.createElement("div");
    body.id = "scene-preview-body";
    body.style.cssText =
      "flex:1;overflow-y:auto;padding:16px;";

    const pre = document.createElement("pre");
    pre.id = "scene-preview-pre";
    pre.style.cssText =
      "white-space:pre-wrap;word-break:break-word;" +
      "font-family:'Courier New',monospace;font-size:0.75rem;" +
      "line-height:1.7;color:rgba(245,240,232,0.75);user-select:text;cursor:text;margin:0;";

    body.appendChild(pre);
    _previewPanel.appendChild(header);
    _previewPanel.appendChild(body);
    document.body.appendChild(_previewPanel);
  }

  // Populate and open
  document.getElementById("scene-preview-title").textContent = sceneTitle;
  document.getElementById("scene-preview-pre").textContent =
    rawLines.join("\n");

  _previewOpenTitle = sceneTitle;
  _previewPanel.style.transform = "translateX(0)";

  // Nudge the table left to make room
  const section = document.getElementById("compound-table-root");
  if (section) {
    section.style.transition = "padding-right 0.25s ease";
    section.style.paddingRight = "330px";
  }
}

// Modify the renderAllL1Tables function to be async
async function renderAllL1Tables() {
  await perf.start("Rendering compound table");
  const root = document.getElementById("compound-table-root");
  root.innerHTML = "";
  window.compoundTableDataList.forEach((data, idx) => {
    const l1Div = document.createElement("div");
    l1Div.className = "compound-l1-block";
    renderUnit(l1Div, data, 0, data, idx, window.compoundTableDataList, idx);
    root.appendChild(l1Div);
  });
  await perf.end();
  saveCompoundTableToLocal();
}

// Modify add functions to be async
async function addShot(parentUnit) {
  await perf.start("Adding Shot");
  const newShot = {
    type: "basic",
    number: getNextNumber(parentUnit.children),
    content: { content: "", imageData: null, canvasData: null },
  };
  parentUnit.children.push(newShot);
  await renderAllL1Tables();
  await perf.end();
}

async function addSequence(parentUnit) {
  await perf.start("Adding Sequence");
  const newSequence = {
    type: "compound",
    number: getNextNumber(parentUnit.children),
    title: `Sequence ${getNextNumber(parentUnit.children)}`,
    children: [],
  };
  parentUnit.children.push(newSequence);
  await renderAllL1Tables();
  await perf.end();
}

async function addScene(parentUnit) {
  await perf.start("Adding Scene");
  const newScene = {
    type: "high",
    number: getNextNumber(parentUnit.children),
    title: `Scene ${getNextNumber(parentUnit.children)}`,
    children: [],
  };
  parentUnit.children.push(newScene);
  await renderAllL1Tables();
  await perf.end();
}

// Update the button click handlers
window.addEventListener("DOMContentLoaded", () => {
  loader.init();
  const root = document.getElementById("compound-table-root");
  if (root) {
    const rootContainer = document.createElement("div");
    rootContainer.id = "compound-table-root-container";
    root.parentNode.insertBefore(rootContainer, root);
    rootContainer.appendChild(root);

    // ── Hierarchy legend ─────────────────────────────────────────────────
    const legend = document.createElement('div');
    legend.id = 'ct-legend';
    legend.innerHTML = `
      <button id="ct-legend-toggle"
        style="background:none;border:none;cursor:pointer;
        color:rgba(201,168,76,.6);font-size:.74rem;font-family:'Lora',Georgia,serif;
        padding:8px 0;letter-spacing:.05em;display:flex;align-items:center;gap:6px;">
        ▶ How this works
      </button>
      <div id="ct-legend-body" style="display:none;padding:12px 0 4px;
        gap:10px;flex-wrap:wrap;">
        <span class="ct-legend-pill" style="background:rgba(201,168,76,.1);
          border:1px solid rgba(201,168,76,.2);border-radius:5px;padding:5px 12px;
          font-size:.74rem;color:rgba(245,240,232,.7);font-family:'Lora',Georgia,serif;">
          <strong style="color:#c9a84c;">Act</strong> — Story act (Act I, II, III)
        </span>
        <span class="ct-legend-pill" style="background:rgba(201,168,76,.1);
          border:1px solid rgba(201,168,76,.2);border-radius:5px;padding:5px 12px;
          font-size:.74rem;color:rgba(245,240,232,.7);font-family:'Lora',Georgia,serif;">
          <strong style="color:#c9a84c;">Scene</strong> — Each INT./EXT. location heading
        </span>
        <span class="ct-legend-pill" style="background:rgba(201,168,76,.1);
          border:1px solid rgba(201,168,76,.2);border-radius:5px;padding:5px 12px;
          font-size:.74rem;color:rgba(245,240,232,.7);font-family:'Lora',Georgia,serif;">
          <strong style="color:#c9a84c;">Sequence</strong> — A group of related shots in a scene
        </span>
        <span class="ct-legend-pill" style="background:rgba(201,168,76,.1);
          border:1px solid rgba(201,168,76,.2);border-radius:5px;padding:5px 12px;
          font-size:.74rem;color:rgba(245,240,232,.7);font-family:'Lora',Georgia,serif;">
          <strong style="color:#c9a84c;">Shot</strong> — Single camera position with all specs
        </span>
      </div>`;
    rootContainer.insertBefore(legend, root);

    const legendToggle = document.getElementById('ct-legend-toggle');
    const legendBody = document.getElementById('ct-legend-body');
    if (legendToggle && legendBody) {
      legendToggle.addEventListener('click', () => {
        const isOpen = legendBody.style.display === 'flex';
        legendBody.style.display = isOpen ? 'none' : 'flex';
        legendToggle.textContent = (isOpen ? '▶' : '▼') + ' How this works';
      });
    }

    const addL1Btn = document.createElement("button");
    addL1Btn.textContent = "Add Act";
    addL1Btn.onclick = async () => {
      await perf.start("Adding Act");
      if (!Array.isArray(window.compoundTableDataList)) {
        window.compoundTableDataList = [compoundTableData];
      }
      window.compoundTableDataList.push({
        type: "super",
        number: getNextNumber(window.compoundTableDataList),
        title: `ACT ${getNextNumber(window.compoundTableDataList)}`,
        children: [],
      });
      await renderAllL1Tables();
      await perf.end();
    };
    rootContainer.insertBefore(addL1Btn, root);

    if (!loadCompoundTableFromLocal()) {
      // No saved data — show empty state instead of placeholder data
      root.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
          <p style="font-family:'Playfair Display',Georgia,serif;font-size:1.1rem;
             color:#f5f0e8;margin:0 0 10px;">No shot list yet</p>
          <p style="font-size:.82rem;color:rgba(245,240,232,.4);
             font-family:'Lora',Georgia,serif;max-width:320px;margin:0 auto;">
             Upload your script on the Shot List tab to get started.
          </p>
        </div>`;
    }
  }

  // Create floating save button
  createFloatingSaveButton();

  // ── Export JSON button ───────────────────────────────────────────────
  if (!document.getElementById("floating-export-btn")) {
    const exportBtn = document.createElement("button");
    exportBtn.id = "floating-export-btn";
    exportBtn.innerHTML = "⬇ Export JSON";
    exportBtn.title = "Export shot list as JSON";
    exportBtn.style.cssText =
      "position:fixed;bottom:24px;right:130px;" +
      "padding:11px 18px;background:transparent;" +
      "border:1px solid rgba(201,168,76,0.5);color:#c9a84c;" +
      "border-radius:7px;font-size:0.88rem;font-weight:700;" +
      "cursor:pointer;z-index:1000;font-family:'Lora',serif;" +
      "transition:background 0.2s,box-shadow 0.2s;";
    exportBtn.onmouseover = () => {
      exportBtn.style.background = "rgba(201,168,76,0.1)";
      exportBtn.style.boxShadow = "0 0 12px rgba(201,168,76,0.3)";
    };
    exportBtn.onmouseout = () => {
      exportBtn.style.background = "transparent";
      exportBtn.style.boxShadow = "";
    };
    exportBtn.onclick = () => {
      const dataStr = JSON.stringify(window.compoundTableDataList, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shot-list.json";
      a.click();
      URL.revokeObjectURL(url);
    };
    document.body.appendChild(exportBtn);
  }

  // ── Export PDF button ─────────────────────────────────────────────────
  if (!document.getElementById("floating-pdf-btn")) {
    const pdfBtn = document.createElement("button");
    pdfBtn.id = "floating-pdf-btn";
    pdfBtn.innerHTML = "⬇ PDF";
    pdfBtn.title = "Export shot list as PDF";
    pdfBtn.style.cssText =
      "position:fixed;bottom:24px;right:240px;" +
      "padding:11px 18px;background:transparent;" +
      "border:1px solid rgba(201,168,76,0.5);color:#c9a84c;" +
      "border-radius:7px;font-size:0.88rem;font-weight:700;" +
      "cursor:pointer;z-index:1000;font-family:'Lora',serif;" +
      "transition:background 0.2s,box-shadow 0.2s;";
    pdfBtn.onmouseover = () => {
      pdfBtn.style.background = "rgba(201,168,76,0.1)";
      pdfBtn.style.boxShadow = "0 0 12px rgba(201,168,76,0.3)";
    };
    pdfBtn.onmouseout = () => {
      pdfBtn.style.background = "transparent";
      pdfBtn.style.boxShadow = "";
    };
    pdfBtn.onclick = () => {
      if (typeof window.exportShotListPDF === "function") window.exportShotListPDF();
    };
    document.body.appendChild(pdfBtn);
  }

  // ── Export DOCX button ────────────────────────────────────────────────
  if (!document.getElementById("floating-docx-btn")) {
    const docxBtn = document.createElement("button");
    docxBtn.id = "floating-docx-btn";
    docxBtn.innerHTML = "⬇ DOCX";
    docxBtn.title = "Export shot list as DOCX";
    docxBtn.style.cssText =
      "position:fixed;bottom:24px;right:310px;" +
      "padding:11px 18px;background:transparent;" +
      "border:1px solid rgba(201,168,76,0.5);color:#c9a84c;" +
      "border-radius:7px;font-size:0.88rem;font-weight:700;" +
      "cursor:pointer;z-index:1000;font-family:'Lora',serif;" +
      "transition:background 0.2s,box-shadow 0.2s;";
    docxBtn.onmouseover = () => {
      docxBtn.style.background = "rgba(201,168,76,0.1)";
      docxBtn.style.boxShadow = "0 0 12px rgba(201,168,76,0.3)";
    };
    docxBtn.onmouseout = () => {
      docxBtn.style.background = "transparent";
      docxBtn.style.boxShadow = "";
    };
    docxBtn.onclick = () => {
      if (typeof window.exportShotListDOCX === "function") window.exportShotListDOCX();
    };
    document.body.appendChild(docxBtn);
  }
});

// Update the CSS for loader
const style = document.createElement("style");
style.textContent = `
  .loader-overlay {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }
  .loader-overlay.active {
    opacity: 1;
  }
`;
document.head.appendChild(style);

// Add performance monitoring to script initialization
function initializeFromScript(scriptData) {
  if (!scriptData) return;

  perf.start("Initializing from script");

  // Accept new shape: direct array of act nodes from convertToCompoundTableFormat()
  if (Array.isArray(scriptData)) {
    window.compoundTableDataList = scriptData;
    renderAllL1Tables();
    perf.end();
    return;
  }

  // Legacy shape: { acts: [...] }
  if (!scriptData.acts) { perf.end(); return; }
  window.compoundTableDataList = scriptData.acts.map((act, actIndex) => ({
    type: "super",
    number: actIndex + 1,
    title: act.title || `ACT ${actIndex + 1}`,
    children: (act.sceneHeadings || []).map((scene, sceneIndex) => ({
      type: "high",
      number: sceneIndex + 1,
      title: scene.title || `Scene ${sceneIndex + 1}`,
      rawLines: scene.rawLines || [],
      children: (scene.components || [{ text: "Sequence 1" }]).map((component, compIndex) => ({
        type: "compound",
        number: compIndex + 1,
        title: component.text || `Sequence ${compIndex + 1}`,
        children: [
          {
            type: "basic",
            number: 1,
            content: { content: "", imageData: null, canvasData: null },
          },
        ],
      })),
    })),
  }));

  renderAllL1Tables();
  perf.end();
}

// Listen for script upload event
window.addEventListener("scriptUploaded", function (e) {
  console.log("Script uploaded, initializing compound table...", e.detail);
  initializeFromScript(e.detail);
});

// Export the initialize function for direct calls
window.initializeCompoundTableFromScript = initializeFromScript;

function saveCompoundTableToLocal() {
  try {
    localStorage.setItem(
      "compoundTableDataList",
      JSON.stringify(window.compoundTableDataList)
    );
  } catch (e) {
    console.error("Failed to save compound table data:", e);
  }
}

function loadCompoundTableFromLocal() {
  const data = localStorage.getItem("compoundTableDataList");
  if (data) {
    try {
      window.compoundTableDataList = JSON.parse(data);
      window.renderAllL1Tables();
      return true;
    } catch (e) {
      console.error("Failed to load compound table data:", e);
    }
  }
  return false;
}

function createFloatingSaveButton() {
  if (document.getElementById("floating-save-btn")) return; // Prevent duplicates

  const btn = document.createElement("button");
  btn.id = "floating-save-btn";
  btn.innerHTML = "💾 Save";
  btn.title = "Save your work";
  btn.onclick = () => {
    saveCompoundTableToLocal();
    btn.classList.add("saved");
    setTimeout(() => btn.classList.remove("saved"), 1200);
  };
  document.body.appendChild(btn);
}
