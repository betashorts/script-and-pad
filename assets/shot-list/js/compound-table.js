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
function renderCompoundTable(container, data) {
  container.innerHTML = "";
  renderUnit(container, data, 0);
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
  // Step 2: Compute number of rows
  const numRows = Math.ceil(flatColumns.length / 6);
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
      // Only render the L4 number cell if this is the first column for this L4 in this row
      let showL4Header = !renderedL4s.has(unit) || colIdx === 0;
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

function renderBasicUnitCell(parent, unit, level, colIdx, col, showL4Header) {
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
    unit.columns.splice(colIdx, 1);
    renderCompoundTable(
      document.getElementById("compound-table-root"),
      compoundTableData
    );
    ev.stopPropagation();
  };
  colDiv.appendChild(removeBtn);
  bottom.appendChild(colDiv);
  cell.appendChild(bottom);
  parent.appendChild(cell);
}

function renderUnit(parent, unit, level) {
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

  if (unit.type === "basic") {
    renderBasicUnit(bottomRow, unit, level);
  } else if (unit.type === "compound") {
    renderCompoundRow(bottomRow, unit.children, level + 1);
    // Add button to add new child
    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.onclick = () => {
      console.log(
        "[ADD BASIC UNIT] Appending new basic unit to children array",
        unit.children
      );
      unit.children.push({
        type: "basic",
        number: getNextNumber(unit.children),
        columns: [{ content: "" }],
      });
      renderCompoundTable(
        document.getElementById("compound-table-root"),
        compoundTableData
      );
    };
    bottomRow.appendChild(addBtn);
  } else {
    unit.children.forEach((child) => {
      renderUnit(bottomRow, child, level + 1);
    });
    // Add button to add new child
    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.onclick = () => {
      if (unit.type === "high") {
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
      renderCompoundTable(
        document.getElementById("compound-table-root"),
        compoundTableData
      );
    };
    bottomRow.appendChild(addBtn);
  }
  wrapper.appendChild(bottomRow);
  parent.appendChild(wrapper);
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

// Initial render on page load
window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("compound-table-root");
  if (root) {
    renderCompoundTable(root, compoundTableData);
  }
});
