#!/usr/bin/env node
// Sanity checks for the generated themes. Run: npm run check
// Fails if a theme is stale vs build.js, has italics, a card not on bg.base,
// non-color values, deprecated keys, or key UI text and syntax colors below
// its contrast floor.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const { VARIANTS } = require("./build.js");
const errors = [];

// Workbench colors VS Code no longer reads (checked against VS Code 1.144).
const OBSOLETE = new Set([
  "source.elm",
  "progress.background",
  "activityBar.dropBackground",
  "welcomePage.buttonBackground",
  "welcomePage.buttonHoverBackground",
  "editorIndentGuide.background",
  "editorIndentGuide.activeBackground",
  "editorGroup.background",
]);

const files = VARIANTS.map((v) => path.join(ROOT, "themes", v.out));
const before = files.map((f) => fs.readFileSync(f, "utf8"));
execFileSync(process.execPath, [path.join(__dirname, "build.js")], { stdio: "ignore" });
const after = files.map((f) => fs.readFileSync(f, "utf8"));

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
// Cards must use bg.base.
const CARDS = ["editor.background", "editorGutter.background", "sideBar.background", "activityBar.background", "panel.background", "terminal.background", "tab.activeBackground"];

// WCAG contrast helpers.
function rgba(h) {
  h = h.slice(1);
  if (h.length <= 4) h = [...h].map((x) => x + x).join("");
  return [0, 2, 4, 6].map((i) => (i < h.length ? parseInt(h.slice(i, i + 2), 16) : 255));
}
function over(fg, bg) {
  const f = rgba(fg), b = rgba(bg), a = f[3] / 255;
  return [0, 1, 2].map((i) => f[i] * a + b[i] * (1 - a));
}
function lum(rgb) {
  return rgb
    .map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
}
function ratio(fg, bg) {
  const b = over(bg, "#000000");
  const bHex = "#" + b.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const [x, y] = [lum(over(fg, bHex)), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const summary = [];
VARIANTS.forEach((v, n) => {
  const err = (msg) => errors.push(`${v.out}: ${msg}`);
  if (before[n] !== after[n]) err("theme JSON is stale: run `npm run build` and commit");
  const theme = JSON.parse(after[n]);

  for (const key of CARDS) {
    if (theme.colors[key] !== v.p.bg.base) err(`colors.${key}: card is not palette bg.base`);
  }
  for (const [key, value] of Object.entries(theme.colors)) {
    if (!HEX.test(value)) err(`colors.${key}: invalid color ${value}`);
    if (!/^[a-zA-Z]+(\.[a-zA-Z0-9]+)+$|^[a-zA-Z]+$/.test(key)) err(`colors.${key}: not a workbench key`);
    if (OBSOLETE.has(key)) err(`colors.${key}: removed or deprecated in VS Code`);
  }
  theme.tokenColors.forEach((t, i) => {
    const s = t.settings || {};
    if (/italic/.test(s.fontStyle || "")) err(`tokenColors[${i}] (${t.name}): italic`);
    for (const k of ["foreground", "background"]) {
      if (s[k] && !HEX.test(s[k])) err(`tokenColors[${i}] (${t.name}): invalid ${k} ${s[k]}`);
    }
  });

  // WCAG contrast of key foregrounds against the base background.
  const c = theme.colors;
  const bg = c["editor.background"];
  const tokenFg = (name) => theme.tokenColors.find((t) => t.name === name).settings.foreground;
  const MIN = [
    ["editor.foreground", c["editor.foreground"], bg, 7],
    ["comment", tokenFg("Comment"), bg, 4.5],
    ["comment //", tokenFg("Double-Slashed Comment"), bg, 4.5],
    ["list.warningForeground", c["list.warningForeground"], bg, 4.5],
    ["editorLineNumber.foreground", c["editorLineNumber.foreground"], bg, 3],
    ["tab.inactiveForeground", c["tab.inactiveForeground"], bg, 4.5],
    ["statusBar.foreground", c["statusBar.foreground"], bg, 4.5],
    ["button.foreground on button.background", c["button.foreground"], c["button.background"], 4.5],
    ["activityBarBadge", c["activityBarBadge.foreground"], c["activityBarBadge.background"], 4.5],
    ["badge", c["badge.foreground"], c["badge.background"], 4.5],
  ];
  for (const [name, fg, back, min] of MIN) {
    const r = ratio(fg, back);
    if (r < min) err(`contrast ${name}: ${r.toFixed(2)} < ${min}`);
  }
  // Every opaque syntax color drawn on the editor background stays readable.
  for (const t of theme.tokenColors) {
    const s = t.settings || {};
    if (!s.foreground || s.background || !/^#[0-9a-f]{6}(ff)?$/i.test(s.foreground)) continue;
    const r = ratio(s.foreground, bg);
    if (r < 3) err(`contrast token "${t.name}": ${r.toFixed(2)} < 3`);
  }
  summary.push(`✓ ${v.name}: ${Object.keys(c).length} colors, ${theme.tokenColors.length} token rules`);
});

if (errors.length) {
  console.error(errors.map((e) => "✗ " + e).join("\n"));
  process.exit(1);
}
console.log(summary.join("\n"));
