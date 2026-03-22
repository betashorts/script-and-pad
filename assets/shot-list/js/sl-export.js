/* ============================================================
   sl-export.js — Shot List PDF & DOCX Export
   Depends on: window.compoundTableDataList (compound-table.js)
   Libraries loaded dynamically from CDN on first use.
   ============================================================ */

// ── CDN URLs ──────────────────────────────────────────────────
const SL_JSPDF_URL     = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const SL_AUTOTABLE_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
const SL_DOCX_URL      = "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js";

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
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pW  = doc.internal.pageSize.getWidth();
    const pH  = doc.internal.pageSize.getHeight();

    const rows = extractShotListRows();
    if (!rows.length) { slStatus("No shots to export."); return; }

    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // ── Page header block ─────────────────────────────────────
    doc.setFillColor(26, 43, 60);
    doc.rect(10, 6, 2, 13, "F");                       // left accent bar

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(26, 43, 60);
    doc.text("SHOT LIST", 15, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(85, 85, 85);
    doc.text(rows[0].sceneTitle || "Shot List", 15, 18.5);

    doc.setFontSize(8);
    doc.setTextColor(136, 136, 136);
    doc.text(dateStr, pW - 10, 13, { align: "right" });

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(10, 21, pW - 10, 21);

    // ── Build body + tracking arrays ──────────────────────────
    // rowTypes[i]: "act" | "scene" | "data"
    // rowImages[i]: imageData string | null
    // dataIndexByBodyRow[i]: sequential data-row index (for alternating colors)
    const body               = [];
    const rowTypes           = [];
    const rowImages          = [];
    const dataIndexByBodyRow = {};
    let lastAct   = null;
    let lastScene = null;
    let dataCount = 0;

    rows.forEach(r => {
      const actKey   = r.actTitle;
      const sceneKey = r.actTitle + "||" + r.sceneTitle;

      if (actKey !== lastAct) {
        body.push([{
          content: r.actTitle.toUpperCase(),
          colSpan: 12,
          styles: {
            fillColor:   [26, 43, 60],
            textColor:   [201, 168, 76],
            fontStyle:   "bold",
            fontSize:    9,
            halign:      "left",
            cellPadding: { top: 4, bottom: 4, left: 6, right: 4 },
          },
        }]);
        rowTypes.push("act");
        rowImages.push(null);
        lastAct   = actKey;
        lastScene = null;
      }

      if (sceneKey !== lastScene) {
        body.push([{
          content: "  " + r.sceneTitle,
          colSpan: 12,
          styles: {
            fillColor:   [245, 247, 250],
            textColor:   [26, 43, 60],
            fontStyle:   "bold",
            fontSize:    8,
            halign:      "left",
            cellPadding: { top: 3, bottom: 3, left: 10, right: 4 },
          },
        }]);
        rowTypes.push("scene");
        rowImages.push(null);
        lastScene = sceneKey;
      }

      const bodyIdx = body.length;
      body.push([
        r.label, "",          // 0: #, 1: IMAGE (drawn in didDrawCell)
        r.shotSize, r.angle, r.movement, r.lens,
        r.subject, r.sound, r.priority,
        "",                   // 9: VFX NOTE (no field in extracted rows)
        r.description, r.dpNote,
      ]);
      dataIndexByBodyRow[bodyIdx] = dataCount;
      rowTypes.push("data");
      rowImages.push(r.imageData || null);
      dataCount++;
    });

    // ── AutoTable ─────────────────────────────────────────────
    doc.autoTable({
      head: [["#", "IMAGE", "SHOT SIZE", "ANGLE", "MOVEMENT", "LENS", "SUBJECT", "SOUND", "PRIORITY", "VFX NOTE", "DESCRIPTION", "DR NOTE"]],
      body,
      startY: 23,
      margin: { top: 20, right: 10, bottom: 16, left: 10 },
      styles: {
        fontSize:    7,
        cellPadding: 2,
        overflow:    "ellipsize",
        valign:      "middle",
        lineColor:   [220, 220, 220],
        lineWidth:   0.1,
        font:        "helvetica",
        fillColor:   [255, 255, 255],
        textColor:   [51, 51, 51],
      },
      headStyles: {
        fillColor:  [26, 43, 60],
        textColor:  [201, 168, 76],
        fontStyle:  "bold",
        fontSize:   7,
        halign:     "center",
        lineColor:  [26, 43, 60],
        lineWidth:  0.2,
      },
      // Disable AutoTable's built-in alternating — handled manually in didParseCell
      alternateRowStyles: {},
      columnStyles: {
        0:  { cellWidth: 8,  halign: "center" },
        1:  { cellWidth: 25, minCellHeight: 18 },
        2:  { cellWidth: 18 },
        3:  { cellWidth: 16 },
        4:  { cellWidth: 16 },
        5:  { cellWidth: 14 },
        6:  { cellWidth: 22 },
        7:  { cellWidth: 16 },
        8:  { cellWidth: 14 },
        9:  { cellWidth: 22 },
        10: { cellWidth: 60 },
        11: { cellWidth: 46 },
      },
      didParseCell: function (data) {
        if (data.section !== "body") return;
        const type = rowTypes[data.row.index];
        if (type === "act" || type === "scene") return; // styled via inline body styles

        // Data row alternating fill
        const di = dataIndexByBodyRow[data.row.index];
        data.cell.styles.fillColor = (di % 2 === 0) ? [255, 255, 255] : [248, 249, 251];
        data.cell.styles.textColor = [51, 51, 51];

        // Shot # cell: bold dark navy
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [26, 43, 60];
        }

        // Description (col 10) and DR Note (col 11): top-align, slightly smaller, wrap
        if (data.column.index === 10 || data.column.index === 11) {
          data.cell.styles.fontSize = 6.5;
          data.cell.styles.valign   = "top";
          data.cell.styles.overflow = "linebreak";
        }
      },
      didDrawCell: function (data) {
        if (data.section !== "body") return;
        const type = rowTypes[data.row.index];

        // Scene header row: gold left-border accent (1.5mm)
        if (type === "scene" && data.column.index === 0) {
          doc.setFillColor(201, 168, 76);
          doc.rect(data.cell.x, data.cell.y, 1.5, data.cell.height, "F");
        }

        // IMAGE column (index 1), data rows only
        if (type === "data" && data.column.index === 1) {
          const imgData = rowImages[data.row.index];
          const x = data.cell.x + 1;
          const y = data.cell.y + 1;
          const w = data.cell.width  - 2;
          const h = data.cell.height - 2;

          if (imgData) {
            const fmt = imgData.startsWith("data:image/png") ? "PNG" : "JPEG";
            try { doc.addImage(imgData, fmt, x, y, w, h); } catch (e) { /* skip corrupt */ }
          } else {
            // Placeholder: light gray rect with em-dash
            doc.setFillColor(240, 240, 240);
            doc.rect(x, y, w, h, "F");
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(180, 180, 180);
            doc.text("\u2014", x + w / 2, y + h / 2 + 1.5, { align: "center" });
          }
        }
      },
      didDrawPage: function (data) {
        // Footer: thin rule + left label + right page number
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(10, pH - 8, pW - 10, pH - 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(136, 136, 136);
        doc.text("Script & Pad \u2014 scriptandpad.com", 10, pH - 4);
        doc.text("Page " + data.pageNumber, pW - 10, pH - 4, { align: "right" });
      },
    });

    doc.save("shot-list-" + dateStr.replace(/,?\s+/g, "-") + ".pdf");
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

    // Library detection: docx@8 UMD exposes itself as window.docx
    const D = window.docx || window;
    if (!D || !D.Document) {
      throw new Error("docx library failed to load. Document constructor not found.");
    }

    const { Document, Packer, Paragraph, Table, TableRow, TableCell,
            ImageRun, TextRun, WidthType, PageOrientation, AlignmentType,
            HeightRule, ShadingType } = D;

    const rows = extractShotListRows();
    if (!rows.length) { slStatus("No shots to export."); return; }

    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-");

    // base64 data URL → Uint8Array
    function b64ToBytes(dataUrl) {
      const base64 = dataUrl.split(",")[1];
      const bin = atob(base64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return buf;
    }

    // Column widths in DXA; landscape A4 = 16838 twips, margins 720 each side
    const COLS  = ["#", "IMAGE", "SHOT SIZE", "ANGLE", "MOVEMENT", "LENS", "SUBJECT", "SOUND", "PRIORITY", "VFX NOTE", "DESCRIPTION", "DR NOTE"];
    const COL_W = [400, 1800, 1000, 900, 900, 1100, 1000, 800, 800, 900, 2000, 1600];
    const TOTAL_W = COL_W.reduce((a, b) => a + b, 0);

    function makeCell(text, { bold = false, textColor = "333333", bg = "FFFFFF", w, span, fontSize = 16 } = {}) {
      return new TableCell({
        columnSpan: span || 1,
        width:      w != null ? { size: w, type: WidthType.DXA } : undefined,
        shading:    { fill: bg, type: ShadingType.CLEAR, color: "auto" },
        children: [new Paragraph({
          children: [new TextRun({
            text:  String(text || ""),
            bold,
            color: textColor,
            size:  fontSize,
            font:  "Calibri",
          })],
        })],
      });
    }

    // Header row
    const headerRow = new TableRow({
      tableHeader: true,
      height: { value: 400, rule: HeightRule.ATLEAST },
      children: COLS.map((c, i) => makeCell(c, { bold: true, textColor: "C9A84C", bg: "1A2B3C", w: COL_W[i], fontSize: 16 })),
    });

    const tableRows = [headerRow];
    let lastAct   = null;
    let lastScene = null;
    let dataCount = 0;

    for (const r of rows) {
      const actKey   = r.actTitle;
      const sceneKey = r.actTitle + "||" + r.sceneTitle;

      if (actKey !== lastAct) {
        tableRows.push(new TableRow({
          height: { value: 420, rule: HeightRule.ATLEAST },
          children: [makeCell(r.actTitle.toUpperCase(), {
            bold: true, textColor: "C9A84C", bg: "1A2B3C",
            w: TOTAL_W, span: COLS.length, fontSize: 24,
          })],
        }));
        lastAct   = actKey;
        lastScene = null;
      }

      if (sceneKey !== lastScene) {
        tableRows.push(new TableRow({
          height: { value: 360, rule: HeightRule.ATLEAST },
          children: [makeCell(r.sceneTitle, {
            bold: true, textColor: "1A2B3C", bg: "F5F7FA",
            w: TOTAL_W, span: COLS.length, fontSize: 20,
          })],
        }));
        lastScene = sceneKey;
      }

      const bg = dataCount % 2 === 0 ? "FFFFFF" : "F8F9FB";

      // Image cell (column index 1)
      let imgCell;
      if (r.imageData) {
        const imgType = r.imageData.startsWith("data:image/png") ? "png" : "jpg";
        try {
          imgCell = new TableCell({
            width:   { size: COL_W[1], type: WidthType.DXA },
            shading: { fill: bg, type: ShadingType.CLEAR, color: "auto" },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children:  [new ImageRun({
                data:           b64ToBytes(r.imageData),
                type:           imgType,
                transformation: { width: 100, height: 56 },
              })],
            })],
          });
        } catch (e) {
          imgCell = makeCell("", { bg, w: COL_W[1] });
        }
      } else {
        imgCell = makeCell("", { bg, w: COL_W[1] });
      }

      tableRows.push(new TableRow({
        height: { value: 900, rule: HeightRule.ATLEAST },
        children: [
          makeCell(r.label,       { bold: true, textColor: "1A2B3C", bg, w: COL_W[0]  }),
          imgCell,
          makeCell(r.shotSize,    { textColor: "333333", bg, w: COL_W[2]  }),
          makeCell(r.angle,       { textColor: "333333", bg, w: COL_W[3]  }),
          makeCell(r.movement,    { textColor: "333333", bg, w: COL_W[4]  }),
          makeCell(r.lens,        { textColor: "333333", bg, w: COL_W[5]  }),
          makeCell(r.subject,     { textColor: "333333", bg, w: COL_W[6]  }),
          makeCell(r.sound,       { textColor: "333333", bg, w: COL_W[7]  }),
          makeCell(r.priority,    { textColor: "333333", bg, w: COL_W[8]  }),
          makeCell("",            { textColor: "333333", bg, w: COL_W[9]  }),
          makeCell(r.description, { textColor: "333333", bg, w: COL_W[10] }),
          makeCell(r.dpNote,      { textColor: "333333", bg, w: COL_W[11] }),
        ],
      }));
      dataCount++;
    }

    const table = new Table({
      width: { size: TOTAL_W, type: WidthType.DXA },
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

    // Packer: toBlob (docx@8) with toBuffer fallback
    let blob;
    if (typeof Packer.toBlob === "function") {
      blob = await Packer.toBlob(docFile);
    } else {
      const buffer = await Packer.toBuffer(docFile);
      blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    }

    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = "shot-list-" + dateStr + ".docx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    slStatus("DOCX exported successfully.");
  } catch (err) {
    console.error("[sl-export] DOCX:", err);
    slStatus("DOCX export failed: " + err.message);
  }
};
