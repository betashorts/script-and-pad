/* ============================================================
   sl-export.js — Shot List PDF & DOCX Export
   Depends on: window.compoundTableDataList (compound-table.js)
   Libraries loaded dynamically from CDN on first use.
   ============================================================ */

// ── CDN URLs ──────────────────────────────────────────────────
const SL_JSPDF_URL     = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const SL_AUTOTABLE_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
const SL_DOCX_URL      = "https://unpkg.com/docx@8.5.0/build/index.js";

// ── Dynamic script loader ─────────────────────────────────────
function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + url + '"]')) { resolve(); return; }
    const s = document.createElement("script");
    s.src = url;
    s.onload  = resolve;
    s.onerror = () => reject(new Error("Failed to load: " + url));
    document.head.appendChild(s);
  });
}

// ── Status bar helper ─────────────────────────────────────────
function slStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}

// ── Strip HTML tags ───────────────────────────────────────────
function stripHtml(str) {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

// ── Flatten nested Act→Scene→Seq→Shot to flat rows ───────────
function extractShotListRows() {
  const data = window.compoundTableDataList || [];
  const rows = [];
  const multiAct = data.length > 1;

  data.forEach(act => {
    const actNum   = act.number   || "";
    const actTitle = act.title    || ("Act " + actNum);
    (act.children || []).forEach(scene => {
      const sceneNum   = scene.number || "";
      const sceneTitle = scene.title  || ("Scene " + sceneNum);
      (scene.children || []).forEach(seq => {
        const seqNum   = seq.number || "";
        const seqTitle = seq.title  || ("Seq " + seqNum);
        (seq.children || []).forEach(shot => {
          const shotNum = shot.number || "";
          const col     = shot.content || {};
          const label   = multiAct
            ? [actNum, sceneNum, shotNum].join(".")
            : [sceneNum, seqNum, shotNum].join(".");
          rows.push({
            label,
            actTitle,
            sceneTitle,
            seqTitle,
            description: stripHtml(col.content),
            shotSize:    col.shotSize  || "",
            angle:       col.angle     || "",
            movement:    col.movement  || "",
            lens:        col.lens      || "",
            equipment:   col.equipment || "",
            subject:     col.subject   || "",
            sound:       col.sound     || "",
            priority:    col.priority  || "",
            dpNote:      stripHtml(col.dpNote),
            imageData:   col.imageData || col.canvasData || null,
          });
        });
      });
    });
  });
  return rows;
}

// ── PDF Export ────────────────────────────────────────────────
window.exportShotListPDF = async function () {
  slStatus("Generating PDF…");
  try {
    await loadScript(SL_JSPDF_URL);
    await loadScript(SL_AUTOTABLE_URL);

    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const rows = extractShotListRows();
    if (!rows.length) { slStatus("No shots to export."); return; }

    // Build body rows + parallel image map indexed by body row position
    const body      = [];
    const rowImages = [];   // null for separator rows, imageData string or null for data rows
    let lastKey     = null;

    rows.forEach(r => {
      const key = r.actTitle + "||" + r.sceneTitle;
      if (key !== lastKey) {
        body.push([{
          content: r.actTitle + " — " + r.sceneTitle,
          colSpan: 10,
          styles: {
            fillColor: [22, 32, 50],
            textColor: [201, 168, 76],
            fontStyle:  "bold",
            halign:     "left",
            cellPadding: 3,
          },
        }]);
        rowImages.push(null);
        lastKey = key;
      }
      const soundPri = (r.sound + (r.priority ? " [" + r.priority + "]" : "")).trim();
      body.push([r.label, r.description, r.shotSize, r.angle, r.movement, r.lens, r.equipment, r.subject, soundPri, ""]);
      rowImages.push(r.imageData || null);
    });

    doc.autoTable({
      head: [["Shot", "Description", "Size", "Angle", "Movement", "Lens", "Equipment", "Subject", "Sound / Priority", "Image"]],
      body,
      startY: 10,
      margin: { left: 6, right: 6 },
      styles: {
        fontSize:    7,
        cellPadding: 2,
        overflow:    "linebreak",
        fillColor:   [13, 27, 42],
        textColor:   [232, 224, 208],
        lineColor:   [44, 62, 80],
        lineWidth:   0.2,
        font:        "helvetica",
      },
      headStyles: {
        fillColor:  [13, 27, 42],
        textColor:  [201, 168, 76],
        fontStyle:  "bold",
        lineColor:  [201, 168, 76],
        lineWidth:  0.4,
      },
      alternateRowStyles: {
        fillColor: [18, 32, 48],
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 52 },
        2: { cellWidth: 18 },
        3: { cellWidth: 16 },
        4: { cellWidth: 18 },
        5: { cellWidth: 14 },
        6: { cellWidth: 22 },
        7: { cellWidth: 22 },
        8: { cellWidth: 24 },
        9: { cellWidth: 30, minCellHeight: 22 },
      },
      didDrawCell: function (data) {
        if (data.section !== "body" || data.column.index !== 9) return;
        const imgData = rowImages[data.row.index];
        if (!imgData) return;
        const fmt = imgData.startsWith("data:image/png") ? "PNG" : "JPEG";
        const x = data.cell.x + 1;
        const y = data.cell.y + 1;
        const w = data.cell.width  - 2;
        const h = data.cell.height - 2;
        try { doc.addImage(imgData, fmt, x, y, w, h); } catch (e) { /* skip corrupt image */ }
      },
    });

    doc.save("shot-list.pdf");
    slStatus("PDF exported successfully.");
  } catch (err) {
    console.error("[sl-export] PDF:", err);
    slStatus("PDF export failed: " + err.message);
  }
};

// ── DOCX Export ───────────────────────────────────────────────
window.exportShotListDOCX = async function () {
  slStatus("Generating DOCX…");
  try {
    await loadScript(SL_DOCX_URL);

    const D = window.docx;
    const { Document, Table, TableRow, TableCell, Paragraph, TextRun, ImageRun,
            Packer, WidthType, PageOrientation, AlignmentType, HeightRule, ShadingType } = D;

    const rows = extractShotListRows();
    if (!rows.length) { slStatus("No shots to export."); return; }

    // base64 data URL → Uint8Array
    function b64ToBytes(dataUrl) {
      const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
      const bin    = atob(base64);
      const buf    = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return buf;
    }

    // Column widths in DXA (1 inch = 1440 DXA); landscape A4 usable ≈ 14400 DXA
    const COL_W = [700, 3000, 900, 800, 900, 700, 1300, 1300, 1300, 1500];

    function makeCell(text, { bold = false, gold = false, bg = "0d1b2a", w, span } = {}) {
      return new TableCell({
        columnSpan:    span || 1,
        width:         w != null ? { size: w, type: WidthType.DXA } : undefined,
        shading:       { fill: bg, type: ShadingType.CLEAR, color: "auto" },
        children: [new Paragraph({
          children: [new TextRun({
            text:  String(text || ""),
            bold,
            color: gold ? "c9a84c" : "e8e0d0",
            size:  16,
            font:  "Calibri",
          })],
        })],
      });
    }

    // Header row
    const COLS = ["Shot", "Description", "Size", "Angle", "Movement", "Lens", "Equipment", "Subject", "Sound / Priority", "Image"];
    const headerRow = new TableRow({
      tableHeader: true,
      height: { value: 400, rule: HeightRule.ATLEAST },
      children: COLS.map((c, i) => makeCell(c, { bold: true, gold: true, bg: "0a131e", w: COL_W[i] })),
    });

    const tableRows = [headerRow];
    let lastKey = null;

    for (const r of rows) {
      const key = r.actTitle + "||" + r.sceneTitle;
      if (key !== lastKey) {
        tableRows.push(new TableRow({
          height: { value: 380, rule: HeightRule.ATLEAST },
          children: [makeCell(r.actTitle + " — " + r.sceneTitle, {
            bold: true, gold: true, bg: "162032",
            w: COL_W.reduce((a, b) => a + b, 0),
            span: COLS.length,
          })],
        }));
        lastKey = key;
      }

      // Image cell
      let imgCell;
      if (r.imageData) {
        const imgType = r.imageData.startsWith("data:image/png") ? "png" : "jpg";
        try {
          imgCell = new TableCell({
            width:   { size: COL_W[9], type: WidthType.DXA },
            shading: { fill: "0d1b2a", type: ShadingType.CLEAR, color: "auto" },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children:  [new ImageRun({
                data:           b64ToBytes(r.imageData),
                type:           imgType,
                transformation: { width: 90, height: 68 },
              })],
            })],
          });
        } catch (e) {
          imgCell = makeCell("", { w: COL_W[9] });
        }
      } else {
        imgCell = makeCell("", { w: COL_W[9] });
      }

      const soundPri = (r.sound + (r.priority ? " [" + r.priority + "]" : "")).trim();

      tableRows.push(new TableRow({
        height: { value: 900, rule: HeightRule.ATLEAST },
        children: [
          makeCell(r.label,       { w: COL_W[0] }),
          makeCell(r.description, { w: COL_W[1] }),
          makeCell(r.shotSize,    { w: COL_W[2] }),
          makeCell(r.angle,       { w: COL_W[3] }),
          makeCell(r.movement,    { w: COL_W[4] }),
          makeCell(r.lens,        { w: COL_W[5] }),
          makeCell(r.equipment,   { w: COL_W[6] }),
          makeCell(r.subject,     { w: COL_W[7] }),
          makeCell(soundPri,      { w: COL_W[8] }),
          imgCell,
        ],
      }));
    }

    const table = new Table({
      width: { size: COL_W.reduce((a, b) => a + b, 0), type: WidthType.DXA },
      rows:  tableRows,
    });

    const docFile = new Document({
      sections: [{
        properties: {
          page: {
            size:   { orientation: PageOrientation.LANDSCAPE, width: 16838, height: 11906 },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [table],
      }],
    });

    const blob = await Packer.toBlob(docFile);
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "shot-list.docx";
    a.click();
    URL.revokeObjectURL(url);
    slStatus("DOCX exported successfully.");
  } catch (err) {
    console.error("[sl-export] DOCX:", err);
    slStatus("DOCX export failed: " + err.message);
  }
};
