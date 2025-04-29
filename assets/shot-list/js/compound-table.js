// Debug version 4
console.log("Compound Table deployed - version 4");

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

  // Top row with number and level prefix
  const topRow = document.createElement("div");
  topRow.className = "compound-top-row";
  topRow.textContent = `L${level + 1} ${unit.number}`;

  // Insert and Remove buttons for this unit (except for the root L1 if only one left)
  const btnGroup = document.createElement("span");
  btnGroup.style.marginLeft = "8px";

  // Dedicated L1 plus button (for level 0)
  if (level === 0) {
    const l1InsertBtn = document.createElement("button");
    l1InsertBtn.textContent = "+";
    l1InsertBtn.title = "Insert L1 below";
    l1InsertBtn.onclick = () => {
      // Insert new L1 (super) below the current one
      const newItem = {
        type: "super",
        number: getNextNumber(window.compoundTableDataList),
        children: [],
      };
      window.compoundTableDataList.splice(l1Idx + 1, 0, newItem);
      window.renderAllL1Tables();
    };
    btnGroup.appendChild(l1InsertBtn);
  }

  // Insert and Remove buttons for this unit (except for the root L1 if only one left)
  if (parentArr) {
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
          children: [],
        };
        window.compoundTableDataList.splice(l1Idx + 1, 0, newItem);
      } else if (unit.type === "high") {
        // Insert new L2 (high) below
        newItem = {
          type: "high",
          number: getNextNumber(parentArr),
          children: [],
        };
        parentArr.splice(unitIdx + 1, 0, newItem);
      } else if (unit.type === "compound") {
        // Insert new L3 (compound) below
        newItem = {
          type: "compound",
          number: getNextNumber(parentArr),
          children: [],
        };
        parentArr.splice(unitIdx + 1, 0, newItem);
      } else if (unit.type === "basic") {
        // Insert new L4 (basic) below
        newItem = {
          type: "basic",
          number: getNextNumber(parentArr),
          columns: [{ content: "" }],
        };
        parentArr.splice(unitIdx + 1, 0, newItem);
      }
      window.renderAllL1Tables();
    };
    btnGroup.appendChild(insertBtn);
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
    addBtn.textContent = "+";
    addBtn.onclick = () => {
      if (unit.type === "compound") {
        unit.children.push({
          type: "basic",
          number: getNextNumber(unit.children),
          columns: [{ content: "" }],
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
      let showL4Header = rowIdx === 0 && colInRow === 0;
      renderBasicUnitCell(
        row,
        unit,
        level,
        colIdx,
        col,
        showL4Header,
        rootData,
        l1Idx,
        parentArr,
        unitIdx
      );
    }
    parent.appendChild(row);
  }
  // Add column at end
  const addColBtn = document.createElement("button");
  addColBtn.textContent = "+";
  addColBtn.onclick = () => {
    unit.columns.push({ content: "" });
    window.renderAllL1Tables();
  };
  parent.appendChild(addColBtn);
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
  const colDiv = document.createElement("div");
  colDiv.className = "basic-unit-col";
  colDiv.contentEditable = true;
  colDiv.textContent = col.content;
  colDiv.oninput = (e) => {
    unit.columns[colIdx].content = e.target.textContent;
  };
  // Insert button for L4 (basic) unit
  const insertBtn = document.createElement("button");
  insertBtn.textContent = "+";
  insertBtn.title = "Insert L4 after";
  insertBtn.onclick = () => {
    // Insert a new L4 (basic) after the current one in the parentArr
    if (parentArr && typeof unitArrIdx === "number") {
      parentArr.splice(unitArrIdx + 1, 0, {
        type: "basic",
        number: getNextNumber(parentArr),
        columns: [{ content: "" }],
      });
      window.renderAllL1Tables();
    }
  };
  colDiv.appendChild(insertBtn);
  // Remove button for L4 (basic) unit
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "-";
  removeBtn.title = "Remove column";
  removeBtn.onclick = (ev) => {
    unit.columns.splice(colIdx, 1);
    window.renderAllL1Tables();
    ev.stopPropagation();
  };
  colDiv.appendChild(removeBtn);
  bottom.appendChild(colDiv);
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
