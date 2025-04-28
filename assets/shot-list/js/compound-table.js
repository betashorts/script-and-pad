// Compound Table Data Structure Example
let compoundTableData = {
  type: "super",
  number: 1,
  children: [
    {
      type: "high",
      number: 1,
      children: [
        {
          type: "compound",
          number: 1,
          children: [
            {
              type: "basic",
              number: 1,
              columns: [{ content: "" }, { content: "" }],
            },
          ],
        },
      ],
    },
  ],
};

// Utility to generate incremental numbers
function getNextNumber(arr) {
  return arr.length ? Math.max(...arr.map((x) => x.number)) + 1 : 1;
}

// Render the compound table recursively
function renderCompoundTable(container, data, rootData, l1Idx) {
  container.innerHTML = "";
  renderUnit(container, data, 0, rootData, l1Idx);
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

function renderBasicUnitCell(
  parent,
  unit,
  level,
  colIdx,
  col,
  showL4Header,
  rootData,
  l1Idx
) {
  console.log(
    `[L${level + 1}] Rendering basic unit cell: L4 ${
      unit.number
    }, column ${colIdx}, showL4Header: ${showL4Header}`
  );
  const cell = document.createElement("div");
  cell.className = "basic-unit";
  // Top row (number with level prefix) only if showL4Header
  if (showL4Header) {
    const top = document.createElement("div");
    top.className = "basic-unit-top";
    top.textContent = `L${
      unit.level !== undefined ? unit.level + 1 : level + 1
    } ${unit.number}`;
    cell.appendChild(top);
  } else {
    // Add an empty top row for alignment
    const top = document.createElement("div");
    top.className = "basic-unit-top";
    top.style.visibility = "hidden";
    top.textContent = "";
    cell.appendChild(top);
  }
  // Bottom row (single column)
  const bottom = document.createElement("div");
  bottom.className = "basic-unit-bottom";
  const colDiv = document.createElement("div");
  colDiv.className = "basic-unit-col";
  colDiv.contentEditable = true;
  colDiv.textContent = col.content;
  colDiv.oninput = (e) => {
    unit.columns[colIdx].content = e.target.textContent;
  };
  // Remove column button
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "-";
  removeBtn.onclick = (ev) => {
    const l1 = window.compoundTableDataList[l1Idx];
    unit.columns.splice(colIdx, 1);
    window.renderAllL1Tables();
    ev.stopPropagation();
  };
  colDiv.appendChild(removeBtn);
  bottom.appendChild(colDiv);
  cell.appendChild(bottom);
  parent.appendChild(cell);
}

function renderUnit(parent, unit, level, rootData, l1Idx) {
  const wrapper = document.createElement("div");
  wrapper.className = `compound-level compound-level-${level}`;

  // Top row with number and level prefix
  const topRow = document.createElement("div");
  topRow.className = "compound-top-row";
  topRow.textContent = `L${level + 1} ${unit.number}`;
  wrapper.appendChild(topRow);

  // Bottom row
  const bottomRow = document.createElement("div");
  bottomRow.className = "compound-bottom-row";
  bottomRow.style.display = "flex";
  bottomRow.style.flexDirection = "column"; // Always stack vertically for L1, L2, L3

  if (unit.type === "basic") {
    // L4: Render columns horizontally with 6-column rule
    renderBasicUnitRow(bottomRow, unit, level, rootData, l1Idx);
  } else {
    // For L1, L2, L3: stack children vertically
    unit.children.forEach((child) => {
      renderUnit(bottomRow, child, level + 1, rootData, l1Idx);
    });
    // Add button to add new child
    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.onclick = () => {
      const l1 = window.compoundTableDataList[l1Idx];
      if (unit.type === "compound") {
        console.log(
          "[ADD BASIC UNIT] Appending new basic unit to children array (L3 block will stack vertically)",
          unit.children
        );
        unit.children.push({
          type: "basic",
          number: getNextNumber(unit.children),
          columns: [{ content: "" }],
        });
      } else if (unit.type === "high") {
        console.log(
          "[ADD COMPOUND CELL] Appending new compound cell to children array (L2 block will stack vertically)",
          unit.children
        );
        unit.children.push({
          type: "compound",
          number: getNextNumber(unit.children),
          children: [],
        });
      } else if (unit.type === "super") {
        console.log(
          "[ADD HIGH LEVEL CELL] Appending new high level cell to children array (L1 block will stack vertically)",
          unit.children
        );
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

// Render a basic unit (L4) and its columns horizontally with the 6-column rule
function renderBasicUnitRow(parent, unit, level, rootData, l1Idx) {
  // Flatten columns for this L4 unit
  let flatColumns = unit.columns.map((col, colIdx) => ({ unit, col, colIdx }));
  const numRows = Math.ceil(flatColumns.length / 6);
  let colPointer = 0;
  for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
    let row = document.createElement("div");
    row.className = "compound-table-row";
    for (
      let colInRow = 0;
      colInRow < 6 && colPointer < flatColumns.length;
      colInRow++, colPointer++
    ) {
      const { unit, col, colIdx } = flatColumns[colPointer];
      // Show L4 header only for the first column in the first row
      let showL4Header = rowIdx === 0 && colInRow === 0;
      renderBasicUnitCell(
        row,
        unit,
        level,
        colIdx,
        col,
        showL4Header,
        rootData,
        l1Idx
      );
    }
    parent.appendChild(row);
  }
  // Add column button for this L4 unit
  const addColBtn = document.createElement("button");
  addColBtn.textContent = "+";
  addColBtn.onclick = () => {
    const l1 = window.compoundTableDataList[l1Idx];
    unit.columns.push({ content: "" });
    window.renderAllL1Tables();
  };
  parent.appendChild(addColBtn);
}

function renderBasicUnit(parent, unit, level, startIdx = 0, count = null) {
  const cell = document.createElement("div");
  cell.className = "basic-unit";

  // Top row (number with level prefix)
  const top = document.createElement("div");
  top.className = "basic-unit-top";
  top.textContent = `L${
    unit.level !== undefined ? unit.level + 1 : level + 1
  } ${unit.number}`;
  cell.appendChild(top);

  // Bottom row (columns)
  const bottom = document.createElement("div");
  bottom.className = "basic-unit-bottom";
  const columnsToRender =
    count === null
      ? unit.columns
      : unit.columns.slice(startIdx, startIdx + count);
  for (let j = 0; j < columnsToRender.length; j++) {
    const colIdx = startIdx + j;
    const col = unit.columns[colIdx];
    const colDiv = document.createElement("div");
    colDiv.className = "basic-unit-col";
    colDiv.contentEditable = true;
    colDiv.textContent = col.content;
    colDiv.oninput = (e) => {
      console.log(`[EDIT] Editing column at index ${colIdx} in unit`, unit);
      unit.columns[colIdx].content = e.target.textContent;
    };
    // Remove column button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "-";
    removeBtn.onclick = (ev) => {
      console.log(`[REMOVE] Removing column at index ${colIdx} in unit`, unit);
      unit.columns.splice(colIdx, 1);
      renderCompoundTable(
        document.getElementById("compound-table-root"),
        compoundTableData
      );
      ev.stopPropagation();
    };
    colDiv.appendChild(removeBtn);
    bottom.appendChild(colDiv);
  }
  // Add column button (only show if this is the last split part for this unit)
  if (startIdx + columnsToRender.length === unit.columns.length) {
    const addColBtn = document.createElement("button");
    addColBtn.textContent = "+";
    addColBtn.onclick = () => {
      console.log(`[ADD] Adding column to unit`, unit);
      unit.columns.push({ content: "" });
      renderCompoundTable(
        document.getElementById("compound-table-root"),
        compoundTableData
      );
    };
    bottom.appendChild(addColBtn);
  }
  cell.appendChild(bottom);
  parent.appendChild(cell);
}

// Add a button for adding L1 elements at the root level
window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("compound-table-root");
  if (root) {
    // Create a container for the root and the add button
    const rootContainer = document.createElement("div");
    rootContainer.id = "compound-table-root-container";
    root.parentNode.insertBefore(rootContainer, root);
    rootContainer.appendChild(root);

    // Add button for new L1
    const addL1Btn = document.createElement("button");
    addL1Btn.textContent = "+";
    addL1Btn.style.marginBottom = "10px";
    addL1Btn.onclick = () => {
      if (!Array.isArray(window.compoundTableDataList)) {
        window.compoundTableDataList = [compoundTableData];
      }
      window.compoundTableDataList.push({
        type: "super",
        number: getNextNumber(window.compoundTableDataList),
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
        renderCompoundTable(l1Div, data, data, idx);
        root.appendChild(l1Div);
      });
    }
    window.renderAllL1Tables = renderAllL1Tables;
    renderAllL1Tables();
  }
});
