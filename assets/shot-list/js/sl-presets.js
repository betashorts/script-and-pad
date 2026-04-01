// sl-presets.js — Storyboard preset SVG library for Shot List Generator
// Exports window.SL_PRESETS — array of 20 preset objects

(function () {
  'use strict';

  // ── Stick figure builder ──────────────────────────────────────────────
  function stickFigure(cx, cy, s) {
    s = s === undefined ? 1 : s;
    return [
      `<circle cx="${cx}" cy="${cy - 28 * s}" r="${8 * s}" stroke="#c9a84c" fill="none" stroke-width="1.5"/>`,
      `<line x1="${cx}" y1="${cy - 20 * s}" x2="${cx}" y2="${cy + 5 * s}" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>`,
      `<line x1="${cx - 16 * s}" y1="${cy - 14 * s}" x2="${cx + 16 * s}" y2="${cy - 14 * s}" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>`,
      `<line x1="${cx}" y1="${cy + 5 * s}" x2="${cx - 10 * s}" y2="${cy + 22 * s}" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>`,
      `<line x1="${cx}" y1="${cy + 5 * s}" x2="${cx + 10 * s}" y2="${cy + 22 * s}" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>`,
    ].join('');
  }

  function bg() {
    return '<rect width="160" height="100" fill="#1e2f45"/>';
  }

  function label(text) {
    return `<text x="80" y="96" fill="#c9a84c" font-size="7" font-family="monospace" text-anchor="middle">${text}</text>`;
  }

  function svgWrap(content) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100">${bg()}${content}</svg>`;
  }

  // ── Camera icon helper ────────────────────────────────────────────────
  function cameraIcon(x, y) {
    return `<rect x="${x - 10}" y="${y - 4}" width="20" height="13" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.3"/>` +
           `<circle cx="${x}" cy="${y + 2}" r="3.5" stroke="#c9a84c" fill="none" stroke-width="1.1"/>`;
  }

  // ── Tripod helper ─────────────────────────────────────────────────────
  function tripod(cx, ty) {
    return `<line x1="${cx}" y1="${ty}" x2="${cx - 14}" y2="${ty + 20}" stroke="#c9a84c" stroke-width="1.3" stroke-linecap="round"/>` +
           `<line x1="${cx}" y1="${ty}" x2="${cx}" y2="${ty + 20}" stroke="#c9a84c" stroke-width="1.3" stroke-linecap="round"/>` +
           `<line x1="${cx}" y1="${ty}" x2="${cx + 14}" y2="${ty + 20}" stroke="#c9a84c" stroke-width="1.3" stroke-linecap="round"/>` +
           cameraIcon(cx, ty - 8);
  }

  // ── PRESETS ───────────────────────────────────────────────────────────

  const ECU = svgWrap(
    `<rect x="50" y="16" width="60" height="68" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    `<circle cx="80" cy="34" r="14" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    `<path d="M55,55 Q80,46 105,55" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    // corner crop marks
    `<polyline points="50,22 50,16 56,16" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    `<polyline points="104,22 110,22 110,16" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    `<polyline points="50,78 50,84 56,84" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    `<polyline points="104,84 110,84 110,78" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    label('ECU')
  );

  const CU = svgWrap(
    `<rect x="40" y="12" width="80" height="72" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    `<circle cx="80" cy="35" r="11" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    `<line x1="80" y1="46" x2="80" y2="52" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>` +
    `<line x1="65" y1="58" x2="95" y2="58" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>` +
    label('CU')
  );

  const MCU = svgWrap(
    `<rect x="30" y="10" width="100" height="76" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    stickFigure(80, 58, 0.9) +
    `<line x1="30" y1="62" x2="130" y2="62" stroke="#c9a84c" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>` +
    label('MCU')
  );

  const MS = svgWrap(
    `<rect x="25" y="8" width="110" height="80" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    stickFigure(80, 55, 0.85) +
    `<line x1="25" y1="68" x2="135" y2="68" stroke="#c9a84c" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>` +
    label('MS')
  );

  const MFS = svgWrap(
    `<rect x="20" y="6" width="120" height="82" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    stickFigure(80, 52, 0.8) +
    `<line x1="20" y1="74" x2="140" y2="74" stroke="#c9a84c" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>` +
    label('MFS')
  );

  const FS = svgWrap(
    `<rect x="18" y="5" width="124" height="84" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    stickFigure(80, 50, 0.75) +
    label('FS')
  );

  const WS = svgWrap(
    `<line x1="0" y1="58" x2="160" y2="58" stroke="rgba(201,168,76,0.3)" stroke-width="1"/>` +
    `<rect x="0" y="58" width="160" height="36" fill="#162032"/>` +
    stickFigure(80, 48, 0.55) +
    label('WS')
  );

  const ELS = svgWrap(
    `<rect x="0" y="0" width="160" height="60" fill="#162032"/>` +
    `<rect x="0" y="60" width="160" height="34" fill="#1a2a3a"/>` +
    `<line x1="0" y1="60" x2="160" y2="60" stroke="#c9a84c" stroke-width="0.8" opacity="0.5"/>` +
    `<path d="M0,60 Q40,52 80,58 Q120,64 160,60" fill="#253652" stroke="none"/>` +
    stickFigure(80, 57, 0.3) +
    label('ELS')
  );

  const EYE_LEVEL = svgWrap(
    stickFigure(100, 50, 0.8) +
    cameraIcon(26, 24) +
    `<line x1="36" y1="24" x2="76" y2="24" stroke="#c9a84c" stroke-width="1" stroke-dasharray="3,2" opacity="0.5"/>` +
    `<line x1="36" y1="24" x2="46" y2="24" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round" marker-end="url(#arrowhead)"/>` +
    label('EYE LEVEL')
  );

  const LOW_ANGLE = svgWrap(
    stickFigure(90, 44, 0.8) +
    `<g transform="rotate(-30, 26, 68)">` +
      cameraIcon(26, 68) +
    `</g>` +
    `<line x1="34" y1="62" x2="70" y2="30" stroke="#c9a84c" stroke-width="1" stroke-dasharray="3,2" opacity="0.5"/>` +
    `<line x1="55" y1="44" x2="62" y2="36" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>` +
    label('LOW ANGLE')
  );

  const HIGH_ANGLE = svgWrap(
    stickFigure(90, 57, 0.7) +
    `<g transform="rotate(25, 26, 14)">` +
      cameraIcon(26, 14) +
    `</g>` +
    `<line x1="36" y1="20" x2="72" y2="44" stroke="#c9a84c" stroke-width="1" stroke-dasharray="3,2" opacity="0.5"/>` +
    `<line x1="50" y1="30" x2="58" y2="38" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>` +
    label('HIGH ANGLE')
  );

  const DUTCH = svgWrap(
    `<g transform="rotate(18, 80, 50)">` +
      `<rect x="25" y="12" width="110" height="76" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
      stickFigure(80, 50, 0.75) +
    `</g>` +
    `<path d="M18,82 A10,10 0 0,1 28,72" stroke="#c9a84c" fill="none" stroke-width="1" opacity="0.7"/>` +
    `<text x="30" y="86" fill="#c9a84c" font-size="5.5" font-family="monospace">18°</text>` +
    label('DUTCH')
  );

  const OVERHEAD = svgWrap(
    `<circle cx="80" cy="50" r="10" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    `<ellipse cx="80" cy="64" rx="6" ry="18" stroke="#c9a84c" fill="none" stroke-width="1.3"/>` +
    `<line x1="64" y1="52" x2="74" y2="52" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>` +
    `<line x1="86" y1="52" x2="96" y2="52" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>` +
    `<circle cx="80" cy="9" r="4" stroke="#c9a84c" fill="none" stroke-width="1.3"/>` +
    `<line x1="80" y1="13" x2="80" y2="20" stroke="#c9a84c" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>` +
    `<circle cx="80" cy="50" r="22" stroke="#c9a84c" fill="none" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.4"/>` +
    `<circle cx="80" cy="50" r="35" stroke="#c9a84c" fill="none" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.25"/>` +
    label('OVERHEAD')
  );

  const STATIC = svgWrap(
    stickFigure(108, 48, 0.75) +
    tripod(32, 66) +
    label('STATIC')
  );

  const PAN = svgWrap(
    tripod(80, 62) +
    `<path d="M30,32 Q80,20 130,32" stroke="#c9a84c" fill="none" stroke-width="1.5" stroke-dasharray="4,2"/>` +
    `<polyline points="120,30 130,32 124,40" stroke="#c9a84c" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    label('PAN')
  );

  const TILT = svgWrap(
    tripod(80, 62) +
    `<path d="M38,78 Q22,50 38,22" stroke="#c9a84c" fill="none" stroke-width="1.5" stroke-dasharray="4,2"/>` +
    `<polyline points="30,30 38,22 46,30" stroke="#c9a84c" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    label('TILT')
  );

  const DOLLY = svgWrap(
    stickFigure(112, 48, 0.7) +
    `<rect x="22" y="40" width="22" height="14" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.3"/>` +
    `<circle cx="26" cy="56" r="2.5" stroke="#c9a84c" fill="none" stroke-width="1.1"/>` +
    `<circle cx="40" cy="56" r="2.5" stroke="#c9a84c" fill="none" stroke-width="1.1"/>` +
    `<line x1="44" y1="47" x2="60" y2="47" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round" marker-end="url(#ah)"/>` +
    `<polyline points="60,47 68,47" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>` +
    `<line x1="16" y1="47" x2="22" y2="47" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>` +
    `<polyline points="16,47 10,47" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>` +
    `<line x1="0" y1="68" x2="160" y2="68" stroke="#c9a84c" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.45"/>` +
    `<line x1="0" y1="72" x2="160" y2="72" stroke="#c9a84c" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.45"/>` +
    label('DOLLY')
  );

  const HANDHELD = svgWrap(
    stickFigure(112, 48, 0.65) +
    stickFigure(42, 50, 0.65) +
    `<rect x="62" y="36" width="18" height="12" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.3"/>` +
    `<line x1="56" y1="42" x2="62" y2="42" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="M60,33 Q64,30 68,33 Q72,36 68,39 Q72,42 68,45 Q64,48 60,45 Q56,42 60,39 Q56,36 60,33" stroke="#c9a84c" fill="none" stroke-width="0.8" opacity="0.6"/>` +
    label('HANDHELD')
  );

  const OTS = svgWrap(
    `<rect x="15" y="8" width="130" height="78" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    `<circle cx="38" cy="30" r="16" stroke="rgba(201,168,76,0.5)" fill="rgba(201,168,76,0.1)" stroke-width="1.5"/>` +
    `<path d="M18,58 Q38,44 58,52" stroke="rgba(201,168,76,0.5)" fill="rgba(201,168,76,0.1)" stroke-width="1.5"/>` +
    stickFigure(105, 50, 0.7) +
    label('OTS')
  );

  const TWO_SHOT = svgWrap(
    `<rect x="10" y="8" width="140" height="78" rx="2" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    stickFigure(50, 48, 0.7) +
    stickFigure(110, 48, 0.7) +
    `<line x1="80" y1="8" x2="80" y2="86" stroke="#c9a84c" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.2"/>` +
    label('2-SHOT')
  );

  const POV = svgWrap(
    `<circle cx="80" cy="50" r="45" stroke="#c9a84c" fill="none" stroke-width="1.5"/>` +
    `<circle cx="80" cy="50" r="40" fill="#162032" stroke="none"/>` +
    stickFigure(80, 52, 0.6) +
    `<line x1="60" y1="50" x2="70" y2="50" stroke="#c9a84c" stroke-width="1.2"/>` +
    `<line x1="90" y1="50" x2="100" y2="50" stroke="#c9a84c" stroke-width="1.2"/>` +
    `<line x1="80" y1="30" x2="80" y2="40" stroke="#c9a84c" stroke-width="1.2"/>` +
    `<line x1="80" y1="60" x2="80" y2="70" stroke="#c9a84c" stroke-width="1.2"/>` +
    `<rect x="0" y="0" width="20" height="20" fill="#1e2f45" opacity="0.7"/>` +
    `<rect x="140" y="0" width="20" height="20" fill="#1e2f45" opacity="0.7"/>` +
    `<rect x="0" y="80" width="20" height="20" fill="#1e2f45" opacity="0.7"/>` +
    `<rect x="140" y="80" width="20" height="20" fill="#1e2f45" opacity="0.7"/>` +
    label('POV')
  );

  window.SL_PRESETS = [
    { id: 'ecu',        label: 'Extreme Close-Up',     abbr: 'ECU',    category: 'Size',        svgString: ECU },
    { id: 'cu',         label: 'Close-Up',              abbr: 'CU',     category: 'Size',        svgString: CU },
    { id: 'mcu',        label: 'Medium Close-Up',       abbr: 'MCU',    category: 'Size',        svgString: MCU },
    { id: 'ms',         label: 'Medium Shot',           abbr: 'MS',     category: 'Size',        svgString: MS },
    { id: 'mfs',        label: 'Medium Full Shot',      abbr: 'MFS',    category: 'Size',        svgString: MFS },
    { id: 'fs',         label: 'Full Shot',             abbr: 'FS',     category: 'Size',        svgString: FS },
    { id: 'ws',         label: 'Wide Shot',             abbr: 'WS',     category: 'Size',        svgString: WS },
    { id: 'els',        label: 'Extreme Long Shot',     abbr: 'ELS',    category: 'Size',        svgString: ELS },
    { id: 'eye-level',  label: 'Eye Level',             abbr: 'EYE',    category: 'Angle',       svgString: EYE_LEVEL },
    { id: 'low-angle',  label: 'Low Angle',             abbr: 'LOW',    category: 'Angle',       svgString: LOW_ANGLE },
    { id: 'high-angle', label: 'High Angle',            abbr: 'HIGH',   category: 'Angle',       svgString: HIGH_ANGLE },
    { id: 'dutch',      label: 'Dutch Angle',           abbr: 'DUTCH',  category: 'Angle',       svgString: DUTCH },
    { id: 'overhead',   label: 'Overhead / Bird\'s Eye',abbr: 'OVH',    category: 'Angle',       svgString: OVERHEAD },
    { id: 'static',     label: 'Static',                abbr: 'STATIC', category: 'Movement',    svgString: STATIC },
    { id: 'pan',        label: 'Pan',                   abbr: 'PAN',    category: 'Movement',    svgString: PAN },
    { id: 'tilt',       label: 'Tilt',                  abbr: 'TILT',   category: 'Movement',    svgString: TILT },
    { id: 'dolly',      label: 'Dolly In/Out',          abbr: 'DOLLY',  category: 'Movement',    svgString: DOLLY },
    { id: 'handheld',   label: 'Handheld',              abbr: 'HH',     category: 'Movement',    svgString: HANDHELD },
    { id: 'ots',        label: 'Over the Shoulder',     abbr: 'OTS',    category: 'Composition', svgString: OTS },
    { id: 'two-shot',   label: 'Two Shot',              abbr: '2-SHOT', category: 'Composition', svgString: TWO_SHOT },
    { id: 'pov',        label: 'Point of View',         abbr: 'POV',    category: 'Composition', svgString: POV },
  ];
})();
