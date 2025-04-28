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
  let row = document.createElement("div");
  row.className = "compound-table-row";
  let colCount = 0;
  for (let i = 0; i < basicUnits.length; i++) {
    let unit = basicUnits[i];
    let unitColIdx = 0;
    while (unitColIdx < unit.columns.length) {
      let remainingCols = 6 - colCount;
      let colsToRender = Math.min(
        remainingCols,
        unit.columns.length - unitColIdx
      );
      // Pass the original unit and the starting index
      renderBasicUnit(row, unit, level, unitColIdx, colsToRender);
      colCount += colsToRender;
      unitColIdx += colsToRender;
      if (colCount === 6) {
        parent.appendChild(row);
        row = document.createElement("div");
        row.className = "compound-table-row";
        colCount = 0;
      }
    }
  }
  if (colCount > 0) {
    parent.appendChild(row);
  }
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
    addBtn.textContent = "+ Add Basic Unit";
    addBtn.onclick = () => {
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
    addBtn.textContent =
      unit.type === "high" ? "+ Add Compound Cell" : "+ Add High Level Cell";
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
    addColBtn.textContent = "+ Add Column";
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
