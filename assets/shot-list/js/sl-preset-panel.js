// sl-preset-panel.js — Storyboard preset picker panel
// Exposes: window.openPresetPanel(col, onSelect)

(function () {
  'use strict';

  window.openPresetPanel = function openPresetPanel(col, onSelect) {
    // ── Overlay ──────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:9000;background:rgba(10,19,30,0.88);' +
      'display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';

    // ── Panel container ──────────────────────────────────────────────────
    const panel = document.createElement('div');
    panel.style.cssText =
      'background:#162032;border:1px solid rgba(201,168,76,0.2);border-radius:16px;' +
      'width:min(900px,95vw);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;';

    // ── Header ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText =
      'padding:16px 20px;border-bottom:1px solid rgba(201,168,76,0.12);' +
      'display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;';

    const headerText = document.createElement('div');
    const title = document.createElement('div');
    title.textContent = 'Choose a Shot Preset';
    title.style.cssText =
      "font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#f5f0e8;font-weight:700;";
    const subtitle = document.createElement('div');
    subtitle.textContent = 'Select a preset to edit, or upload your own image';
    subtitle.style.cssText =
      "font-family:'Lora',Georgia,serif;font-size:12px;color:rgba(245,240,232,0.45);margin-top:4px;";
    headerText.appendChild(title);
    headerText.appendChild(subtitle);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText =
      'width:28px;height:28px;background:transparent;border:none;color:#c9a84c;' +
      'font-size:22px;cursor:pointer;line-height:1;flex-shrink:0;padding:0;';
    closeBtn.onclick = () => document.body.removeChild(overlay);

    header.appendChild(headerText);
    header.appendChild(closeBtn);

    // ── Body ─────────────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.style.cssText = 'padding:20px;overflow-y:auto;flex:1;';

    const CATEGORIES = ['Size', 'Angle', 'Movement', 'Composition'];
    const CAT_LABELS = {
      Size:        'Shot Size',
      Angle:       'Camera Angle',
      Movement:    'Movement',
      Composition: 'Composition',
    };

    CATEGORIES.forEach(function (cat) {
      const presets = (window.SL_PRESETS || []).filter(function (p) {
        return p.category === cat;
      });
      if (!presets.length) return;

      // Category header
      const catHeader = document.createElement('div');
      catHeader.textContent = CAT_LABELS[cat];
      catHeader.style.cssText =
        "font-family:'Lora',Georgia,serif;font-size:10px;text-transform:uppercase;" +
        'letter-spacing:0.12em;color:#c9a84c;margin-bottom:12px;';
      body.appendChild(catHeader);

      // Grid
      const grid = document.createElement('div');
      grid.style.cssText =
        'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px;';

      // Mobile: single column at narrow widths
      const mq = window.matchMedia('(max-width:520px)');
      function applyGrid() {
        grid.style.gridTemplateColumns = mq.matches ? '1fr 1fr' : 'repeat(4,1fr)';
      }
      applyGrid();
      if (mq.addEventListener) mq.addEventListener('change', applyGrid);

      presets.forEach(function (preset) {
        const card = document.createElement('div');
        card.style.cssText =
          'background:#1e2f45;border:1px solid rgba(201,168,76,0.12);border-radius:8px;' +
          'padding:8px;cursor:pointer;transition:border-color 0.15s,transform 0.15s;';
        card.onmouseenter = function () {
          card.style.borderColor = '#c9a84c';
          card.style.transform = 'translateY(-2px)';
        };
        card.onmouseleave = function () {
          card.style.borderColor = 'rgba(201,168,76,0.12)';
          card.style.transform = '';
        };

        // SVG preview
        const svgWrap = document.createElement('div');
        svgWrap.style.cssText = 'width:100%;aspect-ratio:16/10;overflow:hidden;border-radius:4px;';
        svgWrap.innerHTML = preset.svgString;
        const svgEl = svgWrap.querySelector('svg');
        if (svgEl) {
          svgEl.style.cssText = 'width:100%;height:100%;display:block;';
        }

        // Label
        const lbl = document.createElement('div');
        lbl.textContent = preset.label;
        lbl.style.cssText =
          "font-family:'Lora',Georgia,serif;font-size:10px;color:#c9a84c;" +
          'text-align:center;margin-top:6px;';

        // Abbr badge
        const badge = document.createElement('div');
        badge.textContent = preset.abbr;
        badge.style.cssText =
          'display:inline-block;background:rgba(201,168,76,0.1);color:#c9a84c;' +
          'font-size:8px;padding:1px 5px;border-radius:3px;margin:3px auto 0;' +
          'font-family:monospace;display:block;text-align:center;';

        card.appendChild(svgWrap);
        card.appendChild(lbl);
        card.appendChild(badge);

        card.onclick = function () {
          convertSvgToDataURL(preset.svgString, function (dataURL) {
            if (dataURL) {
              onSelect(dataURL);
            }
            document.body.removeChild(overlay);
          });
        };

        grid.appendChild(card);
      });

      body.appendChild(grid);
    });

    // ── Footer ────────────────────────────────────────────────────────────
    const footer = document.createElement('div');
    footer.style.cssText =
      'padding:14px 20px;border-top:1px solid rgba(201,168,76,0.12);' +
      'display:flex;gap:10px;align-items:center;flex-shrink:0;flex-wrap:wrap;';

    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = 'Upload Your Own Image';
    uploadBtn.style.cssText =
      "background:transparent;border:1px solid rgba(201,168,76,0.35);color:#c9a84c;" +
      "font-family:'Lora',Georgia,serif;font-size:12px;padding:8px 16px;border-radius:6px;" +
      'cursor:pointer;transition:background 0.15s,border-color 0.15s;';
    uploadBtn.onmouseenter = function () {
      uploadBtn.style.background = 'rgba(201,168,76,0.08)';
      uploadBtn.style.borderColor = '#c9a84c';
    };
    uploadBtn.onmouseleave = function () {
      uploadBtn.style.background = 'transparent';
      uploadBtn.style.borderColor = 'rgba(201,168,76,0.35)';
    };
    uploadBtn.onclick = function () {
      document.body.removeChild(overlay);
      // Signal caller to open file picker
      onSelect(null, 'upload');
    };

    const blankBtn = document.createElement('button');
    blankBtn.textContent = 'Start with Blank Canvas';
    blankBtn.style.cssText = uploadBtn.style.cssText;
    blankBtn.onmouseenter = uploadBtn.onmouseenter;
    blankBtn.onmouseleave = uploadBtn.onmouseleave;
    blankBtn.onclick = function () {
      document.body.removeChild(overlay);
      onSelect(null, 'blank');
    };

    const cancelLink = document.createElement('button');
    cancelLink.textContent = 'Cancel';
    cancelLink.style.cssText =
      'background:transparent;border:none;color:rgba(245,240,232,0.35);' +
      "font-family:'Lora',Georgia,serif;font-size:12px;cursor:pointer;margin-left:auto;";
    cancelLink.onclick = function () {
      document.body.removeChild(overlay);
    };

    footer.appendChild(uploadBtn);
    footer.appendChild(blankBtn);
    footer.appendChild(cancelLink);

    // Close on overlay click (outside panel)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) document.body.removeChild(overlay);
    });

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  };

  // ── SVG → PNG data URL ───────────────────────────────────────────────
  function convertSvgToDataURL(svgString, callback) {
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = function () {
        const c = document.createElement('canvas');
        c.width = 320;
        c.height = 200;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 320, 200);
        URL.revokeObjectURL(url);
        callback(c.toDataURL('image/png'));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        // Fallback: inline SVG as data URI
        const encoded = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
        callback(encoded);
      };
      img.src = url;
    } catch (err) {
      console.warn('sl-preset-panel: SVG conversion error', err);
      callback(null);
    }
  }
})();
