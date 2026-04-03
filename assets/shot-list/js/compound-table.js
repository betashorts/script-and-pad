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
    previewBtn.innerHTML =
      '<svg viewBox="0 0 12 14" width="10" height="12" fill="none" style="vertical-align:-1px;margin-right:4px;">' +
      '<rect x="1" y="1" width="8" height="11" rx="1.5" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="3" y1="4.5" x2="7" y2="4.5" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>' +
      '<line x1="3" y1="6.5" x2="7" y2="6.5" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>' +
      '<line x1="3" y1="8.5" x2="5.5" y2="8.5" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>' +
      '</svg>Script';
    previewBtn.title = hasLines ? "View scene script" : "No script text available";
    previewBtn.disabled = !hasLines;
    previewBtn.style.cssText =
      "font-size:0.68rem;padding:2px 8px;border:1px solid rgba(201,168,76,0.3);" +
      "border-radius:4px;background:transparent;color:#c9a84c;" +
      "font-family:'Lora',Georgia,serif;letter-spacing:0.05em;cursor:" +
      (hasLines ? "pointer" : "default") + ";opacity:" + (hasLines ? "1" : "0.3") + ";";
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
  uploadBtn.innerHTML = `<svg viewBox="0 0 18 18" width="15" height="15" fill="none">
    <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
    <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
    <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
    <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
  </svg>`;
  uploadBtn.title = "Choose storyboard preset or upload image";
  uploadBtn.className = "upload-btn";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";

  uploadBtn.onclick = () => {
    if (window.openPresetPanel) {
      window.openPresetPanel(col, (dataURL, action) => {
        if (action === 'upload') {
          fileInput.click();
          return;
        }
        if (action === 'blank') {
          showCanvas();
          return;
        }
        if (dataURL) {
          // Load preset ONLY onto canvas — no static imageContainer duplicate
          showCanvas();
          pushUndo();
          const bgImg = new Image();
          bgImg.onload = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            col.canvasData = canvas.toDataURL();
            // Clear any stale static image so it doesn't reappear on re-render
            col.imageData = null;
            imageContainer.innerHTML = "";
          };
          bgImg.src = dataURL;
        }
      });
    } else {
      fileInput.click();
    }
  };

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
  canvas.width = 320;
  canvas.height = 200;
  canvas.style.display = "none";
  canvas.style.userSelect = "none";
  canvas.draggable = false;
  let isDrawing = false;
  let context = canvas.getContext("2d");

  // ── Tool state ──────────────────────────────────────────────────────
  let activeTool = "freehand";
  let shapeStart = null;
  let snapshotData = null;
  let strokeColor = "#c9a84c";
  let strokeWidth = 1.5;
  let isCanvasVisible = false;

  // ── Undo/Redo history ───────────────────────────────────────────────
  const undoStack = [];
  const redoStack = [];
  const UNDO_MAX = 40;

  function pushUndo() {
    undoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.length > UNDO_MAX) undoStack.shift();
    redoStack.length = 0;
    syncUndoRedoBtns();
  }

  function syncUndoRedoBtns() {
    if (typeof undoBtn !== "undefined") {
      undoBtn.disabled = undoStack.length === 0;
      redoBtn.disabled = redoStack.length === 0;
    }
  }

  // ── Canvas show/hide helper ─────────────────────────────────────────
  function showCanvas() {
    canvas.style.display = "block";
    isCanvasVisible = true;
    drawBtn.classList.add("active");
    // Hide static imageContainer when canvas is in view — avoids duplicate
    imageContainer.style.display = "none";
  }

  function hideCanvas() {
    canvas.style.display = "none";
    isCanvasVisible = false;
    drawBtn.classList.remove("active");
    // Show imageContainer again only if it has content
    if (imageContainer.children.length > 0) {
      imageContainer.style.display = "";
    }
  }

  // ── Coordinate helper ───────────────────────────────────────────────
  function getScaledPos(e, targetCanvas) {
    const c = targetCanvas || canvas;
    const rect = c.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (c.width / rect.width),
      y: (e.clientY - rect.top) * (c.height / rect.height),
    };
  }

  function applyDrawStyle(ctx) {
    const c = ctx || context;
    c.strokeStyle = strokeColor;
    c.fillStyle = strokeColor;
    c.lineWidth = strokeWidth;
    c.lineCap = "round";
    c.lineJoin = "round";
  }

  function drawArrowOnCtx(ctx, x1, y1, x2, y2) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 12;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 7), y2 - headLen * Math.sin(angle - Math.PI / 7));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 7), y2 - headLen * Math.sin(angle + Math.PI / 7));
  }

  // ── Drawing logic (works on any canvas+context pair) ────────────────
  function makeDrawHandlers(targetCanvas, targetContext) {
    let drawing = false;
    let start = null;
    let snap = null;
    // Text input overlay
    let textInputEl = null;

    function handleMousedown(e) {
      e.preventDefault();
      const pos = getScaledPos(e, targetCanvas);

      if (activeTool === "text") {
        // Place an inline input over the canvas at the clicked position
        const rect = targetCanvas.getBoundingClientRect();
        const scaleX = rect.width / targetCanvas.width;
        const scaleY = rect.height / targetCanvas.height;
        const screenX = rect.left + pos.x * scaleX;
        const screenY = rect.top + pos.y * scaleY;

        if (textInputEl) textInputEl.remove();
        textInputEl = document.createElement("input");
        textInputEl.type = "text";
        textInputEl.placeholder = "Type then Enter…";
        textInputEl.style.cssText =
          `position:fixed;left:${screenX}px;top:${screenY - 12}px;` +
          `z-index:10000;background:rgba(13,27,42,0.9);color:${strokeColor};` +
          `border:1px solid ${strokeColor};border-radius:3px;font-size:${Math.max(10, strokeWidth * 5)}px;` +
          "padding:2px 5px;outline:none;min-width:80px;font-family:'Lora',serif;";
        document.body.appendChild(textInputEl);
        textInputEl.focus();

        function commitText() {
          const txt = textInputEl.value.trim();
          if (txt) {
            pushUndo();
            applyDrawStyle(targetContext);
            targetContext.globalCompositeOperation = "source-over";
            targetContext.font = `${Math.max(12, strokeWidth * 5 + 8)}px 'Lora', serif`;
            targetContext.fillStyle = strokeColor;
            targetContext.fillText(txt, pos.x, pos.y);
            if (targetCanvas === canvas) {
              col.canvasData = canvas.toDataURL();
            }
          }
          textInputEl.remove();
          textInputEl = null;
        }
        textInputEl.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") { ev.preventDefault(); commitText(); }
          if (ev.key === "Escape") { textInputEl.remove(); textInputEl = null; }
        });
        textInputEl.addEventListener("blur", commitText);
        return;
      }

      drawing = true;
      applyDrawStyle(targetContext);

      if (activeTool === "eraser") {
        targetContext.globalCompositeOperation = "destination-out";
        targetContext.lineWidth = 14;
        targetContext.beginPath();
        targetContext.moveTo(pos.x, pos.y);
      } else if (activeTool === "freehand") {
        pushUndo();
        targetContext.globalCompositeOperation = "source-over";
        targetContext.beginPath();
        targetContext.moveTo(pos.x, pos.y);
      } else {
        pushUndo();
        targetContext.globalCompositeOperation = "source-over";
        start = { x: pos.x, y: pos.y };
        snap = targetContext.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
      }
    }

    function handleMousemove(e) {
      e.preventDefault();
      if (!drawing) return;
      const pos = getScaledPos(e, targetCanvas);
      applyDrawStyle(targetContext);

      if (activeTool === "freehand") {
        targetContext.lineTo(pos.x, pos.y);
        targetContext.stroke();
      } else if (activeTool === "eraser") {
        targetContext.lineWidth = 14;
        targetContext.lineTo(pos.x, pos.y);
        targetContext.stroke();
      } else if (start && snap) {
        targetContext.putImageData(snap, 0, 0);
        applyDrawStyle(targetContext);
        const w = pos.x - start.x;
        const h = pos.y - start.y;
        targetContext.beginPath();
        if (activeTool === "rect") {
          targetContext.strokeRect(start.x, start.y, w, h);
        } else if (activeTool === "circle") {
          targetContext.ellipse(start.x + w / 2, start.y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, 2 * Math.PI);
          targetContext.stroke();
        } else if (activeTool === "line") {
          targetContext.moveTo(start.x, start.y);
          targetContext.lineTo(pos.x, pos.y);
          targetContext.stroke();
        } else if (activeTool === "arrow") {
          drawArrowOnCtx(targetContext, start.x, start.y, pos.x, pos.y);
          targetContext.stroke();
        }
      }
    }

    function handleMouseup(e) {
      if (e) e.preventDefault();
      if (drawing) {
        drawing = false;
        start = null;
        snap = null;
        if (activeTool === "eraser") {
          targetContext.globalCompositeOperation = "source-over";
          targetContext.lineWidth = strokeWidth;
        }
        if (targetCanvas === canvas) {
          col.canvasData = canvas.toDataURL();
        }
      }
    }

    return { handleMousedown, handleMousemove, handleMouseup };
  }

  // Attach draw handlers to the card canvas
  const cardHandlers = makeDrawHandlers(canvas, context);
  canvas.addEventListener("mousedown", cardHandlers.handleMousedown);
  canvas.addEventListener("mousemove", cardHandlers.handleMousemove);
  canvas.addEventListener("mouseup",   cardHandlers.handleMouseup);
  canvas.addEventListener("mouseleave", cardHandlers.handleMouseup);

  // ── Restore previous canvas data ────────────────────────────────────
  if (col.canvasData) {
    const img = new Image();
    img.onload = () => {
      context.drawImage(img, 0, 0);
      canvas.style.display = "block";
      isCanvasVisible = true;
      drawBtn.classList.add("active");
      // Hide static image to prevent duplicate when canvas has content
      imageContainer.style.display = "none";
    };
    img.src = col.canvasData;
  }

  // ── Drawing toggle button (freehand pencil) ─────────────────────────
  const drawBtn = document.createElement("button");
  drawBtn.innerHTML = "&#9999;&#65039;";
  drawBtn.title = "Toggle Drawing Mode (freehand)";
  drawBtn.className = "draw-btn";
  drawBtn.onclick = () => {
    if (isCanvasVisible) {
      hideCanvas();
    } else {
      showCanvas();
      activeTool = "freehand";
      toolsContainer.querySelectorAll(".draw-btn").forEach(b => b.classList.remove("active"));
      drawBtn.classList.add("active");
    }
  };

  // ── Undo button ──────────────────────────────────────────────────────
  const undoBtn = document.createElement("button");
  undoBtn.innerHTML = `<svg viewBox="0 0 18 18" width="14" height="14" fill="none">
    <path d="M3 7 Q3 3 9 3 Q15 3 15 9 Q15 15 9 15 Q5 15 3.5 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    <polyline points="3,3 3,7 7,7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  undoBtn.title = "Undo";
  undoBtn.className = "draw-btn";
  undoBtn.disabled = true;
  undoBtn.onclick = () => {
    if (undoStack.length === 0) return;
    redoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
    context.putImageData(undoStack.pop(), 0, 0);
    col.canvasData = canvas.toDataURL();
    syncUndoRedoBtns();
  };

  // ── Redo button ──────────────────────────────────────────────────────
  const redoBtn = document.createElement("button");
  redoBtn.innerHTML = `<svg viewBox="0 0 18 18" width="14" height="14" fill="none">
    <path d="M15 7 Q15 3 9 3 Q3 3 3 9 Q3 15 9 15 Q13 15 14.5 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    <polyline points="15,3 15,7 11,7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  redoBtn.title = "Redo";
  redoBtn.className = "draw-btn";
  redoBtn.disabled = true;
  redoBtn.onclick = () => {
    if (redoStack.length === 0) return;
    undoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
    context.putImageData(redoStack.pop(), 0, 0);
    col.canvasData = canvas.toDataURL();
    syncUndoRedoBtns();
  };

  // ── Expand canvas button ─────────────────────────────────────────────
  const expandBtn = document.createElement("button");
  expandBtn.innerHTML = `<svg viewBox="0 0 18 18" width="14" height="14" fill="none">
    <polyline points="11,2 16,2 16,7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="7,16 2,16 2,11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="16" y1="2" x2="10" y2="8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="2" y1="16" x2="8" y2="10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;
  expandBtn.title = "Expand canvas";
  expandBtn.className = "draw-btn";
  expandBtn.onclick = () => openExpandedCanvas(canvas, context, col);

  // ── Clear button ─────────────────────────────────────────────────────
  const clearBtn = document.createElement("button");
  clearBtn.innerHTML = "&#128465;";
  clearBtn.title = "Clear Content";
  clearBtn.className = "clear-btn";
  clearBtn.onclick = () => {
    textEditor.innerHTML = "";
    imageContainer.innerHTML = "";
    imageContainer.style.display = "";
    context.clearRect(0, 0, canvas.width, canvas.height);
    col.content = "";
    col.imageData = null;
    col.canvasData = null;
    undoStack.length = 0;
    redoStack.length = 0;
    syncUndoRedoBtns();
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

  // ── Shape tool buttons ───────────────────────────────────────────────
  function makeShapeBtn(svgContent, title, tool) {
    const btn = document.createElement("button");
    btn.innerHTML = svgContent;
    btn.title = title;
    btn.className = "draw-btn shape-btn";
    btn.onclick = () => {
      activeTool = tool;
      document.querySelectorAll && toolsContainer.querySelectorAll(".draw-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      canvas.style.display = "block";
      isCanvasVisible = true;
    };
    return btn;
  }

  const rectBtn = makeShapeBtn(
    `<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><rect x="2" y="4" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4"/></svg>`,
    "Draw rectangle", "rect"
  );
  const circleBtn = makeShapeBtn(
    `<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.4"/></svg>`,
    "Draw circle/ellipse", "circle"
  );
  const lineBtn = makeShapeBtn(
    `<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><line x1="3" y1="15" x2="15" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    "Draw straight line", "line"
  );
  const arrowBtn = makeShapeBtn(
    `<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><line x1="3" y1="15" x2="15" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><polyline points="9,3 15,3 15,9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    "Draw arrow", "arrow"
  );
  const eraserBtn = makeShapeBtn(
    `<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><path d="M14 4 L8 14 L4 14 L2 12 L9 2 Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><line x1="4" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    "Eraser", "eraser"
  );

  // ── Color picker (cycles through palette) ───────────────────────────
  const STROKE_COLORS = ["#c9a84c", "#f5f0e8", "#c0533a", "#2a7f7f", "#d4956a"];
  let colorIdx = 0;
  const colorDot = document.createElement("button");
  colorDot.className = "sl-color-dot";
  colorDot.title = "Cycle stroke color";
  colorDot.style.cssText =
    "width:16px;height:16px;border-radius:50%;border:1.5px solid rgba(201,168,76,0.4);" +
    `background:${STROKE_COLORS[0]};cursor:pointer;flex-shrink:0;transition:transform 0.15s;` +
    "padding:0;";
  colorDot.onclick = () => {
    colorIdx = (colorIdx + 1) % STROKE_COLORS.length;
    strokeColor = STROKE_COLORS[colorIdx];
    colorDot.style.background = strokeColor;
  };

  // ── Stroke width (3 sizes) ───────────────────────────────────────────
  const STROKE_WIDTHS = [1, 2, 4];
  const STROKE_SIZES = ["8px", "11px", "15px"];
  const strokeBtns = STROKE_WIDTHS.map((w, i) => {
    const sb = document.createElement("button");
    sb.className = "sl-stroke-btn draw-btn";
    sb.title = `Stroke width: ${w}px`;
    sb.innerHTML = `<span style="font-size:${STROKE_SIZES[i]};line-height:1;display:block;">&#9679;</span>`;
    sb.onclick = () => {
      strokeWidth = w;
      toolsContainer.querySelectorAll(".sl-stroke-btn").forEach(b => b.classList.remove("active"));
      sb.classList.add("active");
    };
    if (i === 0) sb.classList.add("active");
    return sb;
  });

  // Text tool button
  const textBtn = makeShapeBtn(
    `<svg viewBox="0 0 18 18" width="14" height="14" fill="none">
      <text x="3" y="14" font-size="12" font-family="serif" fill="currentColor" stroke="none">T</text>
    </svg>`,
    "Add text", "text"
  );

  // Add all tools in correct order
  toolsContainer.appendChild(uploadBtn);
  toolsContainer.appendChild(drawBtn);
  toolsContainer.appendChild(rectBtn);
  toolsContainer.appendChild(circleBtn);
  toolsContainer.appendChild(lineBtn);
  toolsContainer.appendChild(arrowBtn);
  toolsContainer.appendChild(textBtn);
  toolsContainer.appendChild(eraserBtn);
  toolsContainer.appendChild(colorDot);
  strokeBtns.forEach(sb => toolsContainer.appendChild(sb));
  toolsContainer.appendChild(undoBtn);
  toolsContainer.appendChild(redoBtn);
  toolsContainer.appendChild(expandBtn);
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

// ── Expanded Canvas Dialog ─────────────────────────────────────────────
function openExpandedCanvas(sourceCanvas, sourceContext, col) {
  const W = Math.min(840, window.innerWidth - 40);
  const H = Math.round(W * (9 / 16));

  // Local state — fully self-contained, not sharing card's vars
  let exTool = "freehand";
  let exColor = "#c9a84c";
  let exWidth = 1.5;
  const EX_COLORS = ["#c9a84c", "#f5f0e8", "#c0533a", "#2a7f7f", "#d4956a"];
  let exColorIdx = 0;
  const exUndo = [], exRedo = [];
  let exDrawing = false;
  let exStart = null;
  let exSnap = null;
  let exTextEl = null;

  function exPushUndo() {
    exUndo.push(bigCtx.getImageData(0, 0, W, H));
    if (exUndo.length > 40) exUndo.shift();
    exRedo.length = 0;
    syncEx();
  }
  function syncEx() {
    exUndoBtn.disabled = exUndo.length === 0;
    exRedoBtn.disabled = exRedo.length === 0;
  }
  function exApplyStyle() {
    bigCtx.strokeStyle = exColor;
    bigCtx.fillStyle   = exColor;
    bigCtx.lineWidth   = exWidth;
    bigCtx.lineCap     = "round";
    bigCtx.lineJoin    = "round";
  }
  function exDrawArrow(x1, y1, x2, y2) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = 14;
    bigCtx.moveTo(x1, y1); bigCtx.lineTo(x2, y2);
    bigCtx.moveTo(x2, y2);
    bigCtx.lineTo(x2 - L * Math.cos(a - Math.PI / 7), y2 - L * Math.sin(a - Math.PI / 7));
    bigCtx.moveTo(x2, y2);
    bigCtx.lineTo(x2 - L * Math.cos(a + Math.PI / 7), y2 - L * Math.sin(a + Math.PI / 7));
  }
  function exPos(e) {
    const r = bigCanvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }

  // Overlay
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:9100;background:rgba(10,19,30,0.92);" +
    "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
    "backdrop-filter:blur(4px);";

  // Dialog
  const dialog = document.createElement("div");
  dialog.style.cssText =
    "background:#162032;border:1px solid rgba(201,168,76,0.25);border-radius:14px;" +
    "display:flex;flex-direction:column;overflow:hidden;max-width:98vw;box-sizing:border-box;";

  // Header
  const hdr = document.createElement("div");
  hdr.style.cssText =
    "display:flex;align-items:center;justify-content:space-between;" +
    "padding:12px 16px;border-bottom:1px solid rgba(201,168,76,0.12);flex-shrink:0;";
  const hdrTitle = document.createElement("span");
  hdrTitle.textContent = "Storyboard Canvas — Expanded View";
  hdrTitle.style.cssText = "font-family:'Playfair Display',serif;font-size:14px;color:#f5f0e8;font-weight:700;";
  const hdrClose = document.createElement("button");
  hdrClose.textContent = "×";
  hdrClose.style.cssText = "background:transparent;border:none;color:#c9a84c;font-size:20px;cursor:pointer;padding:0 4px;";
  hdrClose.onclick = commitAndClose;
  hdr.appendChild(hdrTitle);
  hdr.appendChild(hdrClose);

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.style.cssText =
    "display:flex;gap:5px;padding:8px 12px;background:#1e2f45;flex-wrap:wrap;align-items:center;" +
    "border-bottom:1px solid rgba(201,168,76,0.1);flex-shrink:0;";

  const bigCanvas = document.createElement("canvas");
  bigCanvas.width = W;
  bigCanvas.height = H;
  bigCanvas.style.cssText = `display:block;cursor:crosshair;width:${W}px;max-width:100%;background:#1e2f45;`;
  const bigCtx = bigCanvas.getContext("2d");
  bigCtx.drawImage(sourceCanvas, 0, 0, W, H);

  // ── Toolbar button factory ──────────────────────────────────────────
  function mkBtn(html, ttip) {
    const b = document.createElement("button");
    b.innerHTML = html;
    b.title = ttip;
    b.style.cssText =
      "width:32px;height:32px;padding:0;border:1px solid rgba(201,168,76,0.2);" +
      "background:#0d1b2a;color:rgba(232,224,208,0.5);border-radius:4px;cursor:pointer;" +
      "display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;";
    return b;
  }
  function mkToolBtn(html, ttip, tool) {
    const b = mkBtn(html, ttip);
    b.dataset.tool = tool;
    b.onclick = () => {
      exTool = tool;
      toolbar.querySelectorAll("[data-tool]").forEach(x => {
        x.style.background = "#0d1b2a";
        x.style.color = "rgba(232,224,208,0.5)";
        x.style.borderColor = "rgba(201,168,76,0.2)";
      });
      b.style.background = "rgba(201,168,76,0.12)";
      b.style.color = "#c9a84c";
      b.style.borderColor = "#c9a84c";
    };
    return b;
  }

  const exPencilBtn = mkToolBtn("&#9999;&#65039;", "Freehand", "freehand");
  const exRectBtn   = mkToolBtn(`<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><rect x="2" y="4" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4"/></svg>`, "Rectangle", "rect");
  const exCircleBtn = mkToolBtn(`<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.4"/></svg>`, "Ellipse", "circle");
  const exLineBtn   = mkToolBtn(`<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><line x1="3" y1="15" x2="15" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`, "Line", "line");
  const exArrowBtn  = mkToolBtn(`<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><line x1="3" y1="15" x2="15" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><polyline points="9,3 15,3 15,9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`, "Arrow", "arrow");
  const exTextBtn   = mkToolBtn(`<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><text x="3" y="14" font-size="12" font-family="serif" fill="currentColor" stroke="none">T</text></svg>`, "Text", "text");
  const exEraserBtn = mkToolBtn(`<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><path d="M14 4 L8 14 L4 14 L2 12 L9 2 Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><line x1="4" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`, "Eraser", "eraser");

  // Color dot
  const exColorDot = document.createElement("button");
  exColorDot.title = "Cycle stroke color";
  exColorDot.style.cssText =
    `width:18px;height:18px;border-radius:50%;border:2px solid rgba(201,168,76,0.5);` +
    `background:${exColor};cursor:pointer;flex-shrink:0;padding:0;transition:transform .15s;`;
  exColorDot.onclick = () => {
    exColorIdx = (exColorIdx + 1) % EX_COLORS.length;
    exColor = EX_COLORS[exColorIdx];
    exColorDot.style.background = exColor;
  };

  // Stroke width buttons
  const strokeWidthBtns = [1, 2, 4].map((w, i) => {
    const sb = mkBtn(`<span style="font-size:${["9px","12px","16px"][i]};line-height:1;">&#9679;</span>`, `Stroke ${w}px`);
    sb.onclick = () => {
      exWidth = w;
      strokeWidthBtns.forEach(x => { x.style.borderColor = "rgba(201,168,76,0.2)"; });
      sb.style.borderColor = "#c9a84c";
    };
    if (i === 0) sb.style.borderColor = "#c9a84c";
    return sb;
  });

  // Undo/Redo
  const exUndoBtn = mkBtn(`<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><path d="M3 7 Q3 3 9 3 Q15 3 15 9 Q15 15 9 15 Q5 15 3.5 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/><polyline points="3,3 3,7 7,7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`, "Undo");
  exUndoBtn.disabled = true;
  exUndoBtn.onclick = () => {
    if (!exUndo.length) return;
    exRedo.push(bigCtx.getImageData(0, 0, W, H));
    bigCtx.putImageData(exUndo.pop(), 0, 0);
    syncEx();
  };
  const exRedoBtn = mkBtn(`<svg viewBox="0 0 18 18" width="14" height="14" fill="none"><path d="M15 7 Q15 3 9 3 Q3 3 3 9 Q3 15 9 15 Q13 15 14.5 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/><polyline points="15,3 15,7 11,7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`, "Redo");
  exRedoBtn.disabled = true;
  exRedoBtn.onclick = () => {
    if (!exRedo.length) return;
    exUndo.push(bigCtx.getImageData(0, 0, W, H));
    bigCtx.putImageData(exRedo.pop(), 0, 0);
    syncEx();
  };

  // Append toolbar items
  [exPencilBtn, exRectBtn, exCircleBtn, exLineBtn, exArrowBtn, exTextBtn, exEraserBtn].forEach(b => toolbar.appendChild(b));
  toolbar.appendChild(exColorDot);
  strokeWidthBtns.forEach(b => toolbar.appendChild(b));
  toolbar.appendChild(exUndoBtn);
  toolbar.appendChild(exRedoBtn);

  // ── Canvas draw handlers ────────────────────────────────────────────
  bigCanvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const pos = exPos(e);
    if (exTool === "text") {
      const r = bigCanvas.getBoundingClientRect();
      const sx = r.left + pos.x * (r.width / W);
      const sy = r.top  + pos.y * (r.height / H);
      if (exTextEl) exTextEl.remove();
      exTextEl = document.createElement("input");
      exTextEl.type = "text";
      exTextEl.placeholder = "Type then Enter…";
      exTextEl.style.cssText =
        `position:fixed;left:${sx}px;top:${sy - 12}px;z-index:10001;` +
        `background:rgba(13,27,42,0.9);color:${exColor};border:1px solid ${exColor};` +
        `border-radius:3px;font-size:${Math.max(12, exWidth * 5 + 8)}px;` +
        "padding:2px 6px;outline:none;min-width:100px;font-family:'Lora',serif;";
      document.body.appendChild(exTextEl);
      exTextEl.focus();
      const commit = () => {
        const txt = exTextEl.value.trim();
        if (txt) {
          exPushUndo();
          exApplyStyle();
          bigCtx.globalCompositeOperation = "source-over";
          bigCtx.font = `${Math.max(14, exWidth * 5 + 8)}px 'Lora', serif`;
          bigCtx.fillStyle = exColor;
          bigCtx.fillText(txt, pos.x, pos.y);
        }
        exTextEl.remove(); exTextEl = null;
      };
      exTextEl.addEventListener("keydown", ev => {
        if (ev.key === "Enter") { ev.preventDefault(); commit(); }
        if (ev.key === "Escape") { exTextEl.remove(); exTextEl = null; }
      });
      exTextEl.addEventListener("blur", commit);
      return;
    }
    exDrawing = true;
    exApplyStyle();
    if (exTool === "eraser") {
      bigCtx.globalCompositeOperation = "destination-out";
      bigCtx.lineWidth = 18;
      bigCtx.beginPath();
      bigCtx.moveTo(pos.x, pos.y);
    } else if (exTool === "freehand") {
      exPushUndo();
      bigCtx.globalCompositeOperation = "source-over";
      bigCtx.beginPath();
      bigCtx.moveTo(pos.x, pos.y);
    } else {
      exPushUndo();
      bigCtx.globalCompositeOperation = "source-over";
      exStart = pos;
      exSnap = bigCtx.getImageData(0, 0, W, H);
    }
  });

  bigCanvas.addEventListener("mousemove", (e) => {
    e.preventDefault();
    if (!exDrawing) return;
    const pos = exPos(e);
    exApplyStyle();
    if (exTool === "freehand") {
      bigCtx.lineTo(pos.x, pos.y); bigCtx.stroke();
    } else if (exTool === "eraser") {
      bigCtx.lineWidth = 18; bigCtx.lineTo(pos.x, pos.y); bigCtx.stroke();
    } else if (exStart && exSnap) {
      bigCtx.putImageData(exSnap, 0, 0);
      exApplyStyle();
      const w = pos.x - exStart.x, h = pos.y - exStart.y;
      bigCtx.beginPath();
      if (exTool === "rect") {
        bigCtx.strokeRect(exStart.x, exStart.y, w, h);
      } else if (exTool === "circle") {
        bigCtx.ellipse(exStart.x + w / 2, exStart.y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, 2 * Math.PI);
        bigCtx.stroke();
      } else if (exTool === "line") {
        bigCtx.moveTo(exStart.x, exStart.y); bigCtx.lineTo(pos.x, pos.y); bigCtx.stroke();
      } else if (exTool === "arrow") {
        exDrawArrow(exStart.x, exStart.y, pos.x, pos.y); bigCtx.stroke();
      }
    }
  });

  const stopEx = (e) => {
    if (e) e.preventDefault();
    if (exDrawing) {
      exDrawing = false; exStart = null; exSnap = null;
      if (exTool === "eraser") {
        bigCtx.globalCompositeOperation = "source-over";
        bigCtx.lineWidth = exWidth;
      }
    }
  };
  bigCanvas.addEventListener("mouseup", stopEx);
  bigCanvas.addEventListener("mouseleave", stopEx);

  // Done button
  const footer = document.createElement("div");
  footer.style.cssText =
    "padding:12px 16px;border-top:1px solid rgba(201,168,76,0.12);display:flex;gap:10px;align-items:center;flex-shrink:0;";
  const doneBtn = document.createElement("button");
  doneBtn.textContent = "Done — Apply to Shot";
  doneBtn.style.cssText =
    "padding:9px 22px;background:#c9a84c;color:#0d1b2a;border:none;border-radius:6px;" +
    "font-family:'Lora',serif;font-size:13px;font-weight:700;cursor:pointer;";
  doneBtn.onclick = commitAndClose;
  const cancelLnk = document.createElement("button");
  cancelLnk.textContent = "Cancel";
  cancelLnk.style.cssText =
    "background:transparent;border:none;color:rgba(245,240,232,0.35);font-size:12px;" +
    "font-family:'Lora',serif;cursor:pointer;";
  cancelLnk.onclick = () => document.body.removeChild(overlay);
  footer.appendChild(doneBtn);
  footer.appendChild(cancelLnk);

  function commitAndClose() {
    sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    sourceContext.drawImage(bigCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height);
    col.canvasData = sourceCanvas.toDataURL();
    col.imageData = null;
    document.body.removeChild(overlay);
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) commitAndClose(); });

  dialog.appendChild(hdr);
  dialog.appendChild(toolbar);
  dialog.appendChild(bigCanvas);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Default to freehand
  exPencilBtn.click();
}

// ── Scene Script Preview Panel ─────────────────────────────────────────
let _previewPanel = null;
let _previewOpenTitle = null;

function classifyScriptLine(line, prevType) {
  if (!line || !line.trim()) return 'empty';

  const t = line.trim();

  // Scene headings
  if (/^(INT\.|EXT\.|INT\/EXT\.?)\s/i.test(t) ||
      /^(INT|EXT|INT\/EXT)\s+/i.test(t)) {
    return 'heading';
  }

  // Transitions
  if (/^(FADE\s+(IN|OUT|TO)|CUT\s+TO:|SMASH\s+CUT|MATCH\s+CUT|DISSOLVE\s+TO)/i.test(t) ||
      t === 'FADE OUT.' || t === 'THE END') {
    return 'transition';
  }

  // Parentheticals
  if (t.startsWith('(') && t.endsWith(')')) {
    return 'parenthetical';
  }

  // Fast-path: lines starting with common action words are always action
  // (prevents "We watch AJAI..." from being misclassified)
  if (/^(We |He |She |They |The |A |An |His |Her |It |As |At |By |From |In |On |With )/i.test(t)) {
    if (prevType !== 'character' && prevType !== 'parenthetical') {
      return 'action';
    }
  }

  // Strip character name extensions (V.O., O.S., CONT'D, etc.) before ALL CAPS checks
  const stripped = t.replace(/\s*\(V\.?O\.?\)|\s*\(O\.?S\.?\)|\s*\(CONT'D\)|\s*\(CONT\)|\s*\(PRE-LAP\)/gi, '').trim();

  // Character interrupting dialogue (two characters alternating, no empty line between)
  if (['character', 'parenthetical', 'dialogue'].includes(prevType)) {
    if (stripped === stripped.toUpperCase()
        && /[A-Z]{2,}/.test(stripped)
        && stripped.length <= 35
        && !/[.!?,]$/.test(stripped)) {
      return 'character';
    }
  }

  // Character names: ALL CAPS, short, no sentence-ending punctuation,
  // only valid after action / heading / transition / empty
  const isAllCaps  = stripped === stripped.toUpperCase() && /[A-Z]/.test(stripped);
  const isShort    = stripped.length <= 35;
  const noEndPunct = !/[.!?]$/.test(stripped);
  const validPrev  = !prevType ||
    ['action', 'heading', 'transition', 'empty'].includes(prevType);

  if (isAllCaps && isShort && noEndPunct && validPrev) {
    if (/[A-Z]{2,}/.test(stripped)) {
      return 'character';
    }
  }

  // Dialogue: follows character or parenthetical (or continues)
  if (prevType === 'character' || prevType === 'parenthetical' ||
      prevType === 'dialogue') {
    if (t !== t.toUpperCase() || t.length > 35) {
      return 'dialogue';
    }
  }

  return 'action';
}

function openScenePreview(rawLines, sceneTitle) {
  // Toggle if same scene clicked again
  if (_previewPanel && _previewOpenTitle === sceneTitle) {
    _previewPanel.style.transform = "translateX(100%)";
    _previewOpenTitle = null;
    const section = document.getElementById("compound-table-root");
    if (section) section.style.paddingRight = "";
    return;
  }

  const MOON_SVG =
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none">' +
    '<path d="M14 9.5A6 6 0 0 1 6.5 2a6 6 0 1 0 7.5 7.5z" ' +
    'stroke="rgba(201,168,76,0.7)" stroke-width="1.3" stroke-linecap="round"/>' +
    '</svg>';
  const SUN_SVG =
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none">' +
    '<circle cx="8" cy="8" r="3" stroke="rgba(201,168,76,0.7)" stroke-width="1.3"/>' +
    '<line x1="8" y1="1" x2="8" y2="3" stroke="rgba(201,168,76,0.7)" stroke-width="1.3" stroke-linecap="round"/>' +
    '<line x1="8" y1="13" x2="8" y2="15" stroke="rgba(201,168,76,0.7)" stroke-width="1.3" stroke-linecap="round"/>' +
    '<line x1="1" y1="8" x2="3" y2="8" stroke="rgba(201,168,76,0.7)" stroke-width="1.3" stroke-linecap="round"/>' +
    '<line x1="13" y1="8" x2="15" y2="8" stroke="rgba(201,168,76,0.7)" stroke-width="1.3" stroke-linecap="round"/>' +
    '</svg>';

  // Create panel once
  if (!_previewPanel) {
    _previewPanel = document.createElement("div");
    _previewPanel.id = "scene-preview-panel";

    // Header
    const header = document.createElement("div");
    header.className = "sp-panel-header";

    const titleGroup = document.createElement("div");
    titleGroup.style.cssText = "min-width:0;flex:1;";

    const titleEl = document.createElement("div");
    titleEl.id = "scene-preview-title";
    titleEl.className = "sp-panel-title";

    const subtitleEl = document.createElement("div");
    subtitleEl.className = "sp-panel-subtitle";
    subtitleEl.textContent = "Script Preview";

    titleGroup.appendChild(titleEl);
    titleGroup.appendChild(subtitleEl);

    const themeBtn = document.createElement("button");
    themeBtn.className = "sp-theme-btn";
    themeBtn.title = "Toggle dark/light mode";
    themeBtn.style.cssText =
      "background:none;border:none;cursor:pointer;padding:0;flex-shrink:0;" +
      "opacity:0.7;transition:opacity 0.15s;line-height:1;display:flex;align-items:center;";
    themeBtn.onmouseover = () => { themeBtn.style.opacity = "1"; };
    themeBtn.onmouseout  = () => { themeBtn.style.opacity = "0.7"; };
    themeBtn.onclick = () => {
      const next = (_previewPanel.dataset.theme || 'light') === 'light' ? 'dark' : 'light';
      _previewPanel.dataset.theme = next;
      localStorage.setItem('sp-theme', next);
      themeBtn.innerHTML = next === 'light' ? MOON_SVG : SUN_SVG;
    };

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.className = "sp-close-btn";
    closeBtn.onclick = () => {
      _previewPanel.style.transform = "translateX(100%)";
      _previewOpenTitle = null;
      const section = document.getElementById("compound-table-root");
      if (section) section.style.paddingRight = "";
    };

    header.appendChild(titleGroup);
    header.appendChild(themeBtn);
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement("div");
    body.id = "scene-preview-body";
    body.className = "sp-body";

    _previewPanel.appendChild(header);
    _previewPanel.appendChild(body);
    document.body.appendChild(_previewPanel);
  }

  // Apply saved theme on every open
  const savedTheme = localStorage.getItem('sp-theme') || 'light';
  _previewPanel.dataset.theme = savedTheme;
  const themeBtnEl = _previewPanel.querySelector('.sp-theme-btn');
  if (themeBtnEl) themeBtnEl.innerHTML = savedTheme === 'light' ? MOON_SVG : SUN_SVG;

  // Update title
  document.getElementById("scene-preview-title").textContent = sceneTitle;

  // Render formatted screenplay content
  const body = document.getElementById("scene-preview-body");
  body.innerHTML = "";

  let prevType = null;
  (rawLines || []).forEach((line) => {
    const type = classifyScriptLine(line, prevType);
    const el = document.createElement("div");
    if (type === 'empty') {
      el.className = "sp-spacer";
    } else {
      el.className = "sp-" + type;
      el.textContent = line.trim();
    }
    body.appendChild(el);
    prevType = type;
  });

  _previewOpenTitle = sceneTitle;
  _previewPanel.style.transform = "translateX(0)";

  // Nudge the table left to make room
  const section = document.getElementById("compound-table-root");
  if (section) {
    section.style.transition = "padding-right 0.28s ease";
    section.style.paddingRight = "350px";
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
    exportBtn.style.display = 'none';
  }

  // ── Export PDF button ─────────────────────────────────────────────────
  if (!document.getElementById("floating-pdf-btn")) {
    const pdfBtn = document.createElement("button");
    pdfBtn.id = "floating-pdf-btn";
    pdfBtn.innerHTML = "↓ PDF";
    pdfBtn.title = "Export shot list as PDF";
    pdfBtn.style.cssText =
      "position:fixed;bottom:24px;right:24px;" +
      "padding:10px 20px;background:#c9a84c;" +
      "color:#0d1b2a;border:none;" +
      "border-radius:7px;font-size:0.86rem;font-weight:700;" +
      "cursor:pointer;z-index:1000;font-family:'Playfair Display',Georgia,serif;" +
      "transition:background 0.2s,transform 0.2s,box-shadow 0.2s;" +
      "box-shadow:0 4px 18px rgba(201,168,76,0.3);";
    pdfBtn.onmouseover = () => {
      pdfBtn.style.background = "#e8c96a";
      pdfBtn.style.transform = "translateY(-2px)";
      pdfBtn.style.boxShadow = "0 6px 24px rgba(201,168,76,0.45)";
    };
    pdfBtn.onmouseout = () => {
      pdfBtn.style.background = "#c9a84c";
      pdfBtn.style.transform = "";
      pdfBtn.style.boxShadow = "0 4px 18px rgba(201,168,76,0.3)";
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
    docxBtn.innerHTML = "↓ DOCX";
    docxBtn.title = "Export shot list as DOCX";
    docxBtn.style.cssText =
      "position:fixed;bottom:24px;right:110px;" +
      "padding:10px 20px;background:transparent;" +
      "border:1px solid rgba(201,168,76,0.45);color:#c9a84c;" +
      "border-radius:7px;font-size:0.86rem;font-weight:700;" +
      "cursor:pointer;z-index:1000;font-family:'Playfair Display',Georgia,serif;" +
      "transition:background 0.2s,box-shadow 0.2s,border-color 0.2s;";
    docxBtn.onmouseover = () => {
      docxBtn.style.background = "rgba(201,168,76,0.1)";
      docxBtn.style.borderColor = "#c9a84c";
      docxBtn.style.boxShadow = "0 0 14px rgba(201,168,76,0.25)";
    };
    docxBtn.onmouseout = () => {
      docxBtn.style.background = "transparent";
      docxBtn.style.borderColor = "rgba(201,168,76,0.45)";
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
  btn.style.display = 'none';
}
