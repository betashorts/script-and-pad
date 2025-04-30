// Debug version 17
console.log("Compound Table deployed - version 28");

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
  console.log(
    `Rendering unit: type=${unit.type}, level=${level}, number=${unit.number}`
  );

  const wrapper = document.createElement("div");
  wrapper.className = `compound-level compound-level-${level}`;
  wrapper.dataset.level = unit.type;
  console.log(`Created wrapper with class: ${wrapper.className}`);

  // Top row with number and level prefix
  const topRow = document.createElement("div");
  topRow.className = "compound-top-row";

  // Add drag handle
  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.textContent = "⋮⋮";
  topRow.appendChild(dragHandle);

  // Update the label based on level
  const label = document.createElement("span");
  let levelText;
  switch (level) {
    case 0:
      levelText = unit.title || `ACT ${unit.number}`;
      break;
    case 1:
      levelText = unit.title || `Scene ${unit.number}`;
      break;
    case 2:
      levelText = unit.title || `Sequence ${unit.number}`;
      break;
    case 3:
      levelText = `Shot ${unit.number}`;
      break;
    default:
      levelText = `Level ${level + 1} ${unit.number}`;
  }
  label.textContent = levelText;
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
  bottomRow.style.display = "flex";
  bottomRow.style.flexDirection = "column";

  if (unit.type === "basic") {
    console.log(`Rendering basic unit row at level ${level}`);
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
    console.log(`Rendering children for ${unit.type} unit at level ${level}`);
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

  // Create shot details container
  const shotDetailsContainer = document.createElement("div");
  shotDetailsContainer.className = "shot-details-container";

  // Add shot size dropdown
  const shotSizeDropdown = createAutocompleteDropdown(
    SHOT_SIZES,
    "Select Shot Size",
    "Enter custom shot size..."
  );
  shotSizeDropdown.className = "shot-size-dropdown";

  // Add shot type dropdown
  const shotTypeDropdown = createAutocompleteDropdown(
    SHOT_TYPES,
    "Select Shot Type",
    "Enter custom shot type..."
  );
  shotTypeDropdown.className = "shot-type-dropdown";

  // Add dropdowns to shot details container
  shotDetailsContainer.appendChild(shotSizeDropdown);
  shotDetailsContainer.appendChild(shotTypeDropdown);

  // Save shot details
  const saveShots = () => {
    const sizeSelect = shotSizeDropdown.querySelector("select");
    const sizeInput = shotSizeDropdown.querySelector("input");
    const typeSelect = shotTypeDropdown.querySelector("select");
    const typeInput = shotTypeDropdown.querySelector("input");

    col.shotSize =
      sizeSelect.style.display !== "none" ? sizeSelect.value : sizeInput.value;
    col.shotType =
      typeSelect.style.display !== "none" ? typeSelect.value : typeInput.value;
  };

  // Add change listeners
  shotSizeDropdown
    .querySelectorAll("select, input")
    .forEach((el) => el.addEventListener("change", saveShots));
  shotTypeDropdown
    .querySelectorAll("select, input")
    .forEach((el) => el.addEventListener("change", saveShots));

  // Restore previous values if they exist
  if (col.shotSize) {
    const sizeSelect = shotSizeDropdown.querySelector("select");
    const sizeInput = shotSizeDropdown.querySelector("input");
    if (
      [].slice
        .call(sizeSelect.options)
        .some((opt) => opt.value === col.shotSize)
    ) {
      sizeSelect.value = col.shotSize;
    } else {
      sizeSelect.value = "custom";
      sizeSelect.style.display = "none";
      sizeInput.style.display = "block";
      sizeInput.value = col.shotSize;
    }
  }

  if (col.shotType) {
    const typeSelect = shotTypeDropdown.querySelector("select");
    const typeInput = shotTypeDropdown.querySelector("input");
    if (
      [].slice
        .call(typeSelect.options)
        .some((opt) => opt.value === col.shotType)
    ) {
      typeSelect.value = col.shotType;
    } else {
      typeSelect.value = "custom";
      typeSelect.style.display = "none";
      typeInput.style.display = "block";
      typeInput.value = col.shotType;
    }
  }

  // Add all elements to the container
  toolsContainer.appendChild(uploadBtn);
  toolsContainer.appendChild(drawBtn);
  toolsContainer.appendChild(clearBtn);
  toolsContainer.appendChild(fileInput);

  contentContainer.appendChild(toolsContainer);

  // Text editor div
  const textEditor = document.createElement("div");
  textEditor.className = "basic-unit-text";
  textEditor.contentEditable = true;
  textEditor.innerHTML = col.content || "";

  // Placeholder for text
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

  contentContainer.appendChild(shotDetailsContainer);
  contentContainer.appendChild(textEditor);
  contentContainer.appendChild(imageContainer);
  contentContainer.appendChild(canvas);

  bottom.appendChild(contentContainer);
  cell.appendChild(bottom);
  parent.appendChild(cell);
}

// Update the root level drag and drop
window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("compound-table-root");
  if (root) {
    // Create a container for the root and the add button
    const rootContainer = document.createElement("div");
    rootContainer.id = "compound-table-root-container";
    root.parentNode.insertBefore(rootContainer, root);
    rootContainer.appendChild(root);

    // Update Add L1 button text
    const addL1Btn = document.createElement("button");
    addL1Btn.textContent = "Add Act";
    addL1Btn.onclick = () => {
      if (!Array.isArray(window.compoundTableDataList)) {
        window.compoundTableDataList = [compoundTableData];
      }
      window.compoundTableDataList.push({
        type: "super",
        number: getNextNumber(window.compoundTableDataList),
        title: `ACT ${getNextNumber(window.compoundTableDataList)}`,
        children: [],
      });
      renderAllL1Tables();
    };
    rootContainer.insertBefore(addL1Btn, root);

    // Support for multiple L1s
    window.compoundTableDataList = [compoundTableData];
    function renderAllL1Tables() {
      root.innerHTML = "";
      window.compoundTableDataList.forEach((data, idx) => {
        const l1Div = document.createElement("div");
        l1Div.className = "compound-l1-block";
        renderUnit(
          l1Div,
          data,
          0,
          data,
          idx,
          window.compoundTableDataList,
          idx
        );
        root.appendChild(l1Div);
      });
    }
    window.renderAllL1Tables = renderAllL1Tables;
    renderAllL1Tables();

    // Initialize file upload functionality
    const uploadContainer = document.createElement("div");
    uploadContainer.className = "script-upload-container";

    // Create file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "scriptFileInput";
    fileInput.accept = ".pdf,.docx,.doc";

    // Create upload button
    const uploadButton = document.createElement("button");
    uploadButton.textContent = "Upload and Process";
    uploadButton.onclick = () => {
      const file = fileInput.files[0];
      if (file) {
        // Here you can add your file processing logic
        console.log("Processing file:", file);
        // After processing, you would call initializeFromScript with the processed data
      }
    };

    // Add elements to container
    uploadContainer.appendChild(fileInput);
    uploadContainer.appendChild(uploadButton);

    // Insert container before the compound table root
    if (root && root.parentNode) {
      root.parentNode.insertBefore(uploadContainer, root);
    }
  }
});

// Function to initialize compound table from script data
function initializeFromScript(scriptData) {
  if (!scriptData || !scriptData.acts) return;

  // Convert script data to compound table format
  window.compoundTableDataList = scriptData.acts.map((act, actIndex) => {
    return {
      type: "super",
      number: actIndex + 1,
      title: act.title || `ACT ${actIndex + 1}`,
      children: act.sceneHeadings.map((scene, sceneIndex) => {
        return {
          type: "high",
          number: sceneIndex + 1,
          title: scene.title || `Scene ${sceneIndex + 1}`,
          children: scene.components.map((component, compIndex) => {
            return {
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
            };
          }),
        };
      }),
    };
  });

  // Render the table
  window.renderAllL1Tables();
}

// Listen for script upload event
window.addEventListener("scriptUploaded", function (e) {
  console.log("Script uploaded, initializing compound table...", e.detail);
  initializeFromScript(e.detail);
});

// Export the initialize function for direct calls
window.initializeCompoundTableFromScript = initializeFromScript;
