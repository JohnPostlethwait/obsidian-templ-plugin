# TEMPL Syntax Highlighting for Obsidian

Syntax highlighting for Go's [TEMPL](https://templ.guide) language inside Obsidian code blocks.
Works in both reading mode and live/edit mode.

## Usage

Write fenced code blocks with `templ` as the language:

```
```templ
templ Hello(name string) {
    <h1>Hello, { name }!</h1>
}
```
```

## Installation

### Community plugins

1. Open **Settings → Community plugins**.
2. Browse, search for "TEMPL Syntax Highlighting", install, and enable.

### Manual install

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [release](https://github.com/JohnPostlethwait/obsidian-templ-plugin/releases).
2. Copy them into `<vault>/.obsidian/plugins/templ-syntax-highlighting/`.
3. Reload Obsidian and enable the plugin.

## Build from source

```bash
npm install
npm run build
```

Outputs `main.js` at the repo root. Copy it alongside `manifest.json` and `styles.css` into a vault's plugin folder.

## License

MIT © JohnPostlethwait
