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

function renderUnit(parent, unit, level) {
  const wrapper = document.createElement("div");
  wrapper.className = `compound-level compound-level-${level}`;

  // Top row with number
  const topRow = document.createElement("div");
  topRow.className = "compound-top-row";
  topRow.textContent = unit.number;
  wrapper.appendChild(topRow);

  // Bottom row
  const bottomRow = document.createElement("div");
  bottomRow.className = "compound-bottom-row";

  if (unit.type === "basic") {
    renderBasicUnit(bottomRow, unit);
  } else {
    unit.children.forEach((child) => {
      renderUnit(bottomRow, child, level + 1);
    });
    // Add button to add new child
    const addBtn = document.createElement("button");
    addBtn.textContent = `+ Add ${
      unit.type === "compound"
        ? "Basic Unit"
        : unit.type === "high"
        ? "Compound Cell"
        : "High Level Cell"
    }`;
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

function renderBasicUnit(parent, unit) {
  const cell = document.createElement("div");
  cell.className = "basic-unit";

  // Top row (number)
  const top = document.createElement("div");
  top.className = "basic-unit-top";
  top.textContent = unit.number;
  cell.appendChild(top);

  // Bottom row (columns)
  const bottom = document.createElement("div");
  bottom.className = "basic-unit-bottom";
  unit.columns.forEach((col, idx) => {
    const colDiv = document.createElement("div");
    colDiv.className = "basic-unit-col";
    colDiv.contentEditable = true;
    colDiv.textContent = col.content;
    colDiv.oninput = (e) => {
      unit.columns[idx].content = e.target.textContent;
    };
    // Remove column button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "-";
    removeBtn.onclick = (ev) => {
      unit.columns.splice(idx, 1);
      renderCompoundTable(
        document.getElementById("compound-table-root"),
        compoundTableData
      );
      ev.stopPropagation();
    };
    colDiv.appendChild(removeBtn);
    bottom.appendChild(colDiv);
  });
  // Add column button
  const addColBtn = document.createElement("button");
  addColBtn.textContent = "+ Add Column";
  addColBtn.onclick = () => {
    if (unit.columns.length < 6) {
      unit.columns.push({ content: "" });
      renderCompoundTable(
        document.getElementById("compound-table-root"),
        compoundTableData
      );
    }
  };
  bottom.appendChild(addColBtn);
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
