#!/usr/bin/env node
// Generates the dark and light Duskfeather themes from the upstream
// Night Owl (No Italics) bases + palette.json. Run: npm run build
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const palettes = require(path.join(ROOT, "palette.json"));

// Old upstream UI hex (first 7 chars, lowercase) -> palette color.
// Any alpha suffix on the original value is preserved.
const darkRemap = (p) => ({
  // backgrounds
  "#011627": p.bg.base,
  "#001122": p.bg.base,
  "#0b2942": p.bg.shell,
  "#010d18": p.bg.shell,
  "#021320": p.bg.shell,
  "#2c3043": p.bg.shell,
  "#202431": p.bg.shell,
  "#0b253a": p.bg.raised,
  "#0e293f": p.bg.raised,
  "#2e3250": p.bg.raised,
  "#01111d": p.bg.base,
  "#010e1a": p.bg.base,
  // borders
  "#122d42": p.border,
  "#262a39": p.border,
  "#272b3b": p.border,
  "#25293a": p.border,
  "#1f2330": p.border,
  "#2b2f40": p.border,
  // UI accent (syntax keeps #c792ea etc. — tokenColors are not touched).
  // Upstream purple fills (mostly with alpha) -> accentFill; text -> accent.
  "#7e57c2": p.accentFill,
  "#a599e9": p.accent,
  "#d1aaff": p.accent,
  // muted text
  "#5f7e97": p.textMuted,
});

const lightRemap = (p) => ({
  // backgrounds
  "#fbfbfb": p.bg.base,
  "#f6f6f6": p.bg.base,
  "#f0f0f0": p.bg.shell,
  "#e0e7ea": p.bg.raised,
  "#e0e0e0": p.bg.selection,
  "#d3e8f8": p.bg.active,
  // borders
  "#d9d9d9": p.border,
  "#cccccc": p.border,
  "#d0d0d0": p.border,
  // UI accent: upstream teal buttons/badges -> accentFill
  "#2aa298": p.accentFill,
  "#90a7b2": p.dim,
});

const VARIANTS = [
  {
    name: "Duskfeather",
    type: "dark",
    p: palettes.dark,
    base: "base-night-owl-noitalic.json",
    out: "duskfeather-color-theme.json",
    remap: darkRemap,
    comment: "#637777", // 4.17:1 on bg.base
  },
  {
    name: "Duskfeather Light",
    type: "light",
    p: palettes.light,
    base: "base-night-owl-light-noitalic.json",
    out: "duskfeather-light-color-theme.json",
    remap: lightRemap,
    comment: "#989fb1", // 2.56:1 on bg.base
    // Upstream light rules that kept dark-theme colors (1.4–2.6:1 on bg.base),
    // keyed by rule name.
    tokenFixes: (p) => ({
      "Double-Slashed Comment": p.comment,
      "JSON Property values (string)": "#994cc3",
      "TypeScript Class Variable Keyword": "#994cc3",
      "Markdown Links": p.link,
      "Other Variables in Code Documentations": p.link,
      "Changed": p.link,
      "RegExp String": p.link,
      "Entity Name tag reference in stylesheets": "#0c969b",
      "CoffeScript Variable Assignment": "#0c969b",
      "Invalid Unimplemented": "#08916a",
      "Object": p.fg,
      "Object Comma": p.fg,
    }),
  },
];

// Upstream keys that VS Code no longer reads: TextMate scopes that ended up in
// `colors`, and removed or deprecated workbench colors (replacement in comment).
// scripts/check.js fails if any of these reappear.
const DROP = new Set([
  "punctuation.definition.generic.begin.html",
  "string.quoted.single.js",
  "meta.objectliteral.js",
  "source.elm",
  "progress.background", // -> progressBar.background
  "activityBar.dropBackground", // -> activityBar.dropBorder
  "welcomePage.buttonBackground", // removed with the old welcome page
  "welcomePage.buttonHoverBackground",
  "editorIndentGuide.background", // -> editorIndentGuide.background1..6
  "editorIndentGuide.activeBackground", // -> editorIndentGuide.activeBackground1..6
  "editorGroup.background", // -> editorGroup.emptyBackground
]);

// Explicit per-key values; these win over REMAP.
function overrides(p) {
  const guides = {};
  for (let i = 1; i <= 6; i++) {
    guides[`editorIndentGuide.background${i}`] = p.mutedDim;
    guides[`editorIndentGuide.activeBackground${i}`] = p.muted;
  }
  // Bracket pair colors and their guides are left to VS Code's defaults
  // (#FFD700, #DA70D6, #179FFF), like upstream Night Owl.

  return {
    contrastBorder: p.border,
    // Keyboard focus outline, so Tab navigation stays visible.
    focusBorder: p.accent,
    // Validation messages; upstream light uses the body text color.
    errorForeground: p.error,
    "editorWarning.foreground": p.warning,
    "list.warningForeground": p.warning,
    "peekViewResult.selectionForeground": p.fgStrong,
    "widget.shadow": p.shadow,
    "scrollbar.shadow": p.shadow,

    // activity bar (user customizations)
    "activityBar.background": p.bg.base,
    "activityBar.foreground": p.accent,
    "activityBar.inactiveForeground": p.accentInactive,
    "activityBar.border": p.border,
    "activityBar.dropBorder": p.accent,
    "activityBarBadge.background": p.accentFill,
    "activityBarBadge.foreground": p.onAccent,
    "badge.background": p.textMuted,
    "badge.foreground": p.bg.base,

    // buttons: filled accent with white text
    "button.background": p.accentFill,
    "button.foreground": p.onAccent,
    "button.hoverBackground": p.accentFillHover,
    "button.secondaryBackground": p.bg.raised,
    "button.secondaryForeground": p.fg,
    "button.secondaryHoverBackground": p.border,
    "extensionButton.prominentBackground": p.accentFill,
    "extensionButton.prominentForeground": p.onAccent,
    "extensionButton.prominentHoverBackground": p.accentFillHover,
    "progressBar.background": p.accent,
    "textLink.foreground": p.link,
    "textLink.activeForeground": p.linkActive,
    "input.background": p.bg.raised,
    "input.border": p.muted,
    "inputOption.activeBorder": p.accent,
    "inputOption.activeBackground": p.accentFill + "40",
    "dropdown.border": p.muted,
    "list.invalidItemForeground": "#ef5350",

    // side bar
    "sideBar.background": p.bg.base,
    "sideBar.border": p.border,
    "sideBarSectionHeader.background": p.bg.base,
    "sideBarSectionHeader.border": p.border,
    "tree.indentGuidesStroke": p.muted,
    "tree.inactiveIndentGuidesStroke": p.mutedDim,

    // lists
    "list.hoverBackground": p.bg.shell,
    "list.focusBackground": p.bg.shell,
    "list.dropBackground": p.bg.raised,
    "list.activeSelectionBackground": p.bg.active,
    "list.activeSelectionForeground": p.fgStrong,
    "list.inactiveSelectionBackground": p.bg.raised,
    "list.inactiveSelectionForeground": p.fg,

    // editor groups & tabs: active tab = editor bg, inactive tabs sit on the shell
    "editorGroup.border": p.border,
    "editorGroup.emptyBackground": p.bg.base,
    "editorGroupHeader.tabsBackground": p.bg.shell,
    "editorGroupHeader.noTabsBackground": p.bg.base,
    "editorGroupHeader.tabsBorder": p.border,
    "tab.activeBackground": p.bg.base,
    "tab.unfocusedActiveBackground": p.bg.base,
    "tab.inactiveBackground": p.bg.shell,
    "tab.unfocusedInactiveBackground": p.bg.shell,
    "tab.hoverBackground": p.bg.raised,
    "tab.unfocusedHoverBackground": p.bg.raised,
    "tab.border": p.border,
    "tab.inactiveForeground": p.textMuted,
    // No line under the active tab: with connected tabs its outline already
    // curves into the strip's bottom line, and a straight line here notches
    // those curves. Transparent, not unset, or upstream #262A39 comes back.
    "tab.activeBorder": "#00000000",
    "tab.activeBorderTop": p.accent,
    "tab.unfocusedActiveBorder": "#00000000",
    "tab.unfocusedActiveBorderTop": p.border,
    // modern UI tab style (VS Code 1.14x)
    "modernEditorTab.activeBackground": p.bg.base,
    "modernEditorTab.activeHoverBackground": p.bg.base,
    // modernEditorTab.inactiveBackground stays unset (VS Code: transparent).
    // A fill turns each inactive tab into its own rounded box and breaks the
    // line under the connected tab strip.
    "modernEditorTab.hoverBackground": p.bg.raised,

    // editor
    "editor.background": p.bg.base,
    "editorGutter.background": p.bg.base,
    "editorLineNumber.foreground": p.dim,
    "editor.selectionBackground": p.bg.selection,
    "editor.inactiveSelectionBackground": p.bg.selection + "99",
    "editor.findMatchBorder": p.accent,
    "editor.findMatchHighlightBorder": "#1085bb80",
    "editorBracketMatch.background": p.bg.selection + "80",
    "editorBracketMatch.border": p.muted,
    "editorBracketHighlight.unexpectedBracket.foreground": "#ef5350",
    ...guides,

    // widgets
    "editorWidget.background": p.bg.shell,
    "editorWidget.border": p.border,
    "editorHoverWidget.background": p.bg.shell,
    "editorHoverWidget.border": p.border,
    "editorSuggestWidget.background": p.bg.shell,
    "editorSuggestWidget.border": p.border,
    "editorSuggestWidget.selectedBackground": p.bg.active,
    "debugExceptionWidget.background": p.bg.shell,
    "debugExceptionWidget.border": p.border,
    "dropdown.background": p.bg.shell,
    "menu.background": p.bg.shell,
    "menu.border": p.border,
    "menu.selectionBackground": p.bg.active,
    "quickInput.background": p.bg.shell,
    "pickerGroup.border": p.border,
    "notifications.background": p.bg.shell,
    "notifications.border": p.border,
    "notificationCenter.border": p.border,
    "notificationToast.border": p.border,
    "textCodeBlock.background": p.bg.shell,

    // breadcrumbs
    "breadcrumb.background": p.bg.base,
    "breadcrumbPicker.background": p.bg.shell,

    // peek view
    "peekView.border": p.border,
    "peekViewEditor.background": p.bg.base,
    "peekViewResult.background": p.bg.shell,
    "peekViewTitle.background": p.bg.shell,
    "peekViewResult.selectionBackground": p.bg.active,

    // panel & terminal
    "panel.background": p.bg.base,
    "panel.border": p.border,
    "panelTitle.activeBorder": p.accent,
    "terminal.background": p.bg.base,
    "terminal.foreground": p.fg,
    // not bg.base: prompt segments drawn on ansiBlack would vanish into the panel
    "terminal.ansiBlack": p.ansiBlack,
    "terminal.ansiBrightBlack": p.textMuted,

    // shell: the frame behind the floating cards (title bar, status bar, gaps).
    // Cards (activity bar, side bars, editor, panel/terminal) stay bg.base.
    "modernUI.shellBackground": p.bg.shell,
    "modernUI.inactiveShellBackground": p.bg.shell,
    "modernActivityBar.background": p.bg.base,
    // Active icon: accent on a light accent tint. Left unset, VS Code falls back
    // to list.inactiveSelection* (gray icon), dimmer than the blue inactive icons.
    "modernActivityBarItem.activeForeground": p.accent,
    "modernActivityBarItem.activeBackground": p.accentFill + "26",
    "modernActivityBarItem.hoverBackground": p.bg.raised,
    // Card outlines. surface.border also draws the side bar card and the pane
    // header dividers; left unset, VS Code mixes 15% foreground (~#212c35).
    "surface.border": p.border,
    "editor.border": p.border,
    "modernActivityBar.border": p.border,
    "modernPanel.border": p.border,
    // command center (window title box in the title bar) is a card too
    "commandCenter.background": p.bg.base,
    "commandCenter.border": p.border,
    "commandCenter.activeBackground": p.bg.shell,
    "commandCenter.activeBorder": p.muted,
    "commandCenter.inactiveBorder": p.border,

    // status bar & title bar
    "statusBar.background": p.bg.shell,
    "statusBar.foreground": p.textMuted,
    "statusBar.border": p.border,
    "statusBar.noFolderBackground": p.bg.shell,
    "statusBar.noFolderBorder": p.border,
    "statusBar.debuggingBackground": p.accent + "33",
    "statusBar.debuggingBorder": p.border,
    "statusBarItem.hoverBackground": p.bg.raised,
    "statusBarItem.activeBackground": p.bg.raised,
    "statusBarItem.prominentBackground": p.bg.raised,
    "statusBarItem.prominentHoverBackground": p.bg.raised,
    "titleBar.activeBackground": p.bg.shell,
    "titleBar.inactiveBackground": p.bg.shell,
    "titleBar.border": p.border,

    // misc
    "debugToolBar.background": p.bg.shell,
    "walkThrough.embeddedEditorBackground": p.bg.shell,
    "gitDecoration.ignoredResourceForeground": p.dim,
  };
}

function build(v) {
  const { p } = v;
  const base = require(path.join(ROOT, "themes", v.base));
  const REMAP = v.remap(p);

  function remap(key, value) {
    if (typeof value !== "string" || !value.startsWith("#")) return value;
    if (key.startsWith("terminal.ansi")) return value; // ANSI colors are syntax-like
    const head = value.slice(0, 7).toLowerCase();
    return REMAP[head] ? REMAP[head] + value.slice(7) : value;
  }

  const colors = {};
  for (const [key, value] of Object.entries(base.colors)) {
    if (value === null) continue; // upstream has null placeholders; VS Code ignores them
    if (DROP.has(key)) continue;
    colors[key] = remap(key, value);
  }
  Object.assign(colors, overrides(p));

  // Strip italic from every fontStyle (upstream "No Italics" still has a few).
  function noItalic(settings) {
    if (!settings || typeof settings.fontStyle !== "string") return settings;
    const fontStyle = settings.fontStyle
      .split(/\s+/)
      .filter((s) => s && s !== "italic")
      .join(" ");
    return { ...settings, fontStyle };
  }

  // Token backgrounds (the "Global settings" rule, #011627 in both upstreams)
  // follow the base bg. Foregrounds are syntax colors and stay untouched.
  function baseBackground(settings) {
    if (!settings || typeof settings.background !== "string") return settings;
    const bg = settings.background;
    if (bg.slice(0, 7).toLowerCase() !== "#011627") return settings;
    return { ...settings, background: p.bg.base + bg.slice(7) };
  }

  // Comments: lift the upstream comment color to palette comment for contrast.
  function commentColor(settings) {
    if (!settings || typeof settings.foreground !== "string") return settings;
    const fg = settings.foreground;
    if (fg.slice(0, 7).toLowerCase() !== v.comment) return settings;
    return { ...settings, foreground: p.comment + fg.slice(7) };
  }

  const fixes = v.tokenFixes ? v.tokenFixes(p) : {};
  const fixed = new Set();
  function tokenFix(name, settings) {
    if (!(name in fixes)) return settings;
    fixed.add(name);
    return { ...settings, foreground: fixes[name] };
  }

  const tokenColors = base.tokenColors.map((t) => ({
    ...t,
    settings: tokenFix(t.name, commentColor(baseBackground(noItalic(t.settings)))),
  }));
  const missing = Object.keys(fixes).filter((n) => !fixed.has(n));
  if (missing.length) throw new Error(`${v.name}: no token rule named ${missing.join(", ")}`);

  const theme = {
    name: v.name,
    type: v.type,
    semanticHighlighting: base.semanticHighlighting,
    colors,
    tokenColors,
  };

  const out = path.join(ROOT, "themes", v.out);
  fs.writeFileSync(out, JSON.stringify(theme, null, 2) + "\n");
  console.log(`Wrote ${path.relative(ROOT, out)} (${Object.keys(colors).length} colors, ${tokenColors.length} token rules)`);
}

module.exports = { VARIANTS };
if (require.main === module) VARIANTS.forEach(build);
