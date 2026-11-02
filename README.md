# Duskfeather

A VS Code theme based on **Night Owl (No Italics)**, in dark and light. Deep cards sit on a slightly lighter shell, borders are a single gray, the accent is VS Code blue, and nothing is italic. Syntax colors stay as in Night Owl, with comments lifted for contrast.

## Duskfeather

![Duskfeather (dark)](images/dark.png)

## Duskfeather Light

![Duskfeather Light](images/light.png)

## Install

1. Open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`), search for **Duskfeather** and click *Install*.
2. Run *Preferences: Color Theme* and pick **Duskfeather** or **Duskfeather Light**.

### From source

```bash
npm run package
code --install-extension duskfeather-*.vsix
```

To try it without installing, open this folder in VS Code and press `F5`. The `demo/` folder has sample files to look at.

## Edit colors

UI colors live in `palette.json`, under `dark` and `light`. After editing:

```bash
npm run build   # regenerate both theme files in themes/
npm run check   # validate them
```

## Credits

Based on [Night Owl](https://github.com/sdras/night-owl-vscode-theme) by Sarah Drasner, MIT License. See [LICENSE.md](LICENSE.md).
