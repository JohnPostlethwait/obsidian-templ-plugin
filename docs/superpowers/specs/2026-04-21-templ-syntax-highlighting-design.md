# TEMPL Syntax Highlighting for Obsidian — Design

**Date:** 2026-04-21
**Author:** JohnPostlethwait
**Status:** Approved for implementation planning

## Purpose

Publish an Obsidian community plugin that adds syntax highlighting for Go's TEMPL language inside ```templ fenced code blocks. Highlighting must work in both reading mode (via PrismJS) and live/edit mode (via CodeMirror 6), matching the behavior users expect for any first-class language in Obsidian.

## Non-goals

- Language server features (completion, go-to-definition, diagnostics).
- `templ fmt` integration.
- Formatting or linting of TEMPL code inside Obsidian.
- A full, spec-exhaustive TEMPL grammar. We target "medium depth" — see Grammar Scope.

## Architecture

Single TypeScript plugin bundled with esbuild into `main.js`. Two integration points share one grammar source of truth:

1. **Prism grammar** (`src/templ-prism.ts`) — a Prism.js language definition registered on `window.Prism.languages.templ` at plugin load. Powers reading-mode highlighting. Obsidian owns the Prism instance; we augment it.
2. **CodeMirror 6 extension** (`src/templ-cm6.ts`) — a `ViewPlugin` that scans visible ranges for ```templ fenced regions, runs `Prism.tokenize` on their contents, and emits `Decoration.mark` ranges whose classes match Prism's (`.token.keyword`, etc.). This mirrors the pattern used by the Svelte Syntax Highlighter plugin.
3. **Plugin entry** (`src/main.ts`) — extends `Plugin`; `onload` installs the Prism grammar and registers the CM6 extension via `this.registerEditorExtension(...)`; `onunload` removes the grammar from `window.Prism.languages` so unloads are clean.

## Components

### `src/templ-prism.ts`

Exports:
- `templGrammar: Prism.Grammar` — the grammar object.
- `registerTemplGrammar(): void` — idempotent installer. Guards against double-registration and missing `window.Prism`.

The grammar references Prism's existing `markup` and `go` grammars for embedded highlighting (HTML tags inside templ bodies, Go expressions inside `{ ... }` interpolation).

### `src/templ-cm6.ts`

Exports:
- `templHighlighter: Extension` — an array containing a `ViewPlugin` and any required `EditorView.baseTheme` additions.

The ViewPlugin:
- On `update` (doc change or viewport change), walks visible lines to find ```templ ... ``` fences.
- Tokenizes fence contents with `Prism.tokenize(content, Prism.languages.templ)`.
- Converts the nested token stream into flat `{from, to, className}` ranges.
- Builds a `DecorationSet` via `Decoration.mark(...).range(from, to)`.

### `src/main.ts`

```
export default class TemplSyntaxPlugin extends Plugin {
  async onload() {
    registerTemplGrammar();
    this.registerEditorExtension(templHighlighter);
  }
  onunload() {
    unregisterTemplGrammar();
  }
}
```

## Grammar Scope (medium depth)

Tokens recognized:

- **Keywords:** `templ`, `script`, `css`, `if`, `else`, `for`, `switch`, `case`, `default`, `return`, `package`, `import`, `var`, `range`.
- **Component definitions:** `templ Name(args) { ... }` — `Name` captured as `function`.
- **Component calls:** `@Pkg.Component(args)` — the `@` plus identifier path captured as `function`.
- **Interpolation:** `{ goExpr }` inside templ bodies — contents tokenized as embedded `go`.
- **Embedded HTML:** tag names, attribute names, attribute values inside templ bodies via Prism's `markup` reference.
- **Literals:** double-quoted strings, backtick strings, numbers.
- **Comments:** `//` line and `/* */` block.
- **Top-level Go:** `package`, `import (...)`, and other Go tokens outside templ blocks handled by referencing Prism's `go` grammar.

## Data Flow

**Reading mode**
1. Obsidian renders a fenced code block with info string `templ`.
2. Obsidian's Prism instance finds `Prism.languages.templ` (we registered it).
3. Prism emits `<span class="token ...">...</span>` markup.
4. `styles.css` themes the token classes.

**Edit mode (live preview / source)**
1. User types inside a ```templ block.
2. CM6 ViewPlugin's `update` fires.
3. We locate fences in the visible range and tokenize their contents with the same Prism grammar.
4. A DecorationSet with `token-keyword`, `token-string`, etc. classes is applied.
5. Same CSS from `styles.css` themes them identically to reading mode.

## Error Handling

- Missing `window.Prism`: log a console warning, skip grammar registration; CM6 extension no-ops. Obsidian's own startup guarantees Prism is present, so this is a defensive path only.
- Malformed TEMPL inside a block: Prism tokenizers are lenient — unmatched braces or partial constructs produce plaintext tokens rather than throwing.
- No user-facing error surfaces. Worst case is plain, uncolored code.

## Testing

**Manual**
- `test-vault/samples.md` contains canonical TEMPL snippets:
  - Component definition with parameters and nested HTML.
  - `@Component()` call with args.
  - `{ expression }` interpolation.
  - `for` / `if` / `switch`.
  - `script` and `css` blocks.
  - Multi-line block comments.
  - `package` + `import` header.
- Load plugin via "Install plugin from folder" (symlink build output into `test-vault/.obsidian/plugins/templ-syntax-highlighting/`), visually verify both modes.

**Automated**
- `tests/grammar.test.ts` using vitest.
- For each snippet, assert `Prism.tokenize(snippet, templGrammar)` produces a stable snapshot.
- Covers: keyword recognition, component def capture, `@call` capture, interpolation boundaries, comment tokens, string tokens.

## File Layout

```
obsidian-templ-plugin/
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── versions.json
├── styles.css
├── README.md
├── LICENSE                       # MIT
├── .gitignore
├── src/
│   ├── main.ts
│   ├── templ-prism.ts
│   └── templ-cm6.ts
├── tests/
│   └── grammar.test.ts
└── test-vault/
    └── samples.md
```

## Plugin Manifest

- `id`: `templ-syntax-highlighting`
- `name`: `TEMPL Syntax Highlighting`
- `author`: `JohnPostlethwait`
- `authorUrl`: `https://github.com/JohnPostlethwait`
- `description`: `Syntax highlighting for Go's TEMPL language in code blocks.`
- `minAppVersion`: `1.4.0`
- `isDesktopOnly`: `false`

## Publishing

- Repo: `https://github.com/JohnPostlethwait/obsidian-templ-plugin`
- License: MIT
- Release flow: tag `1.0.0`, GitHub release with `main.js`, `manifest.json`, `styles.css` attached.
- Community submission: fork `obsidianmd/obsidian-releases`, append entry to `community-plugins.json`, open PR.
- README covers: what it does, install via community directory, manual install fallback, screenshot of both modes, build-from-source instructions.

## Build Toolchain

- TypeScript 5.x, target ES2020, module ESNext, strict mode on.
- esbuild bundling to CJS `main.js` with `obsidian`, `electron`, `@codemirror/*` marked external (Obsidian provides them at runtime).
- npm scripts: `dev` (esbuild watch), `build` (tsc typecheck + esbuild production), `test` (vitest).
