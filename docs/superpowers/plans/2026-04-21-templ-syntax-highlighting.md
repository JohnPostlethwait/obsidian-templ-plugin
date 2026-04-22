# TEMPL Syntax Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an Obsidian community plugin that provides medium-depth syntax highlighting for Go's TEMPL language in both reading mode (PrismJS) and live/edit mode (CodeMirror 6).

**Architecture:** One TypeScript plugin bundled with esbuild. A single Prism grammar is the source of truth. At load, the grammar is registered on `window.Prism.languages.templ` (reading mode) and a CodeMirror 6 `ViewPlugin` tokenizes ```templ fences with the same grammar to emit decorations (edit mode). Shared CSS themes token classes identically in both modes.

**Tech Stack:** TypeScript 5, esbuild, Obsidian API, PrismJS (provided by Obsidian at runtime), CodeMirror 6 (`@codemirror/view`, `@codemirror/state`), vitest (tests).

---

## File Structure

```
obsidian-templ-plugin/
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── versions.json
├── styles.css
├── README.md
├── LICENSE
├── .gitignore
├── src/
│   ├── main.ts             # Plugin entry — onload/onunload
│   ├── templ-prism.ts      # Prism grammar + register/unregister
│   └── templ-cm6.ts        # CodeMirror 6 ViewPlugin
├── tests/
│   └── grammar.test.ts     # Vitest snapshot tests for Prism grammar
└── test-vault/
    └── samples.md          # Manual-test TEMPL snippets
```

Responsibilities:
- `src/templ-prism.ts` — grammar object + idempotent register/unregister. Pure, no DOM or CM6 deps. Tested in isolation.
- `src/templ-cm6.ts` — CM6 `ViewPlugin` that maps Prism tokens → `Decoration.mark`. Imports grammar from `templ-prism.ts`.
- `src/main.ts` — Obsidian plugin class; wires the two together.

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `esbuild.config.mjs`
- Create: `manifest.json`
- Create: `versions.json`
- Create: `.gitignore`
- Create: `LICENSE`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
main.js
main.js.map
*.log
.DS_Store
.vscode/
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "obsidian-templ-plugin",
  "version": "1.0.0",
  "description": "Syntax highlighting for Go's TEMPL language in Obsidian.",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc --noEmit && node esbuild.config.mjs production",
    "test": "vitest run"
  },
  "keywords": ["obsidian", "plugin", "templ", "go", "syntax-highlighting"],
  "author": "JohnPostlethwait",
  "license": "MIT",
  "devDependencies": {
    "@codemirror/language": "^6.10.0",
    "@codemirror/state": "^6.4.0",
    "@codemirror/view": "^6.26.0",
    "@types/node": "^20.11.0",
    "builtin-modules": "^3.3.0",
    "esbuild": "^0.20.0",
    "obsidian": "latest",
    "prismjs": "^1.29.0",
    "@types/prismjs": "^1.26.3",
    "tslib": "^2.6.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES2020",
    "allowJs": true,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "isolatedModules": true,
    "strictNullChecks": true,
    "strict": true,
    "lib": ["DOM", "ES2020"],
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 4: Create `esbuild.config.mjs`**

```js
import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins
  ],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  minify: prod
});

if (prod) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
```

- [ ] **Step 5: Create `manifest.json`**

```json
{
  "id": "templ-syntax-highlighting",
  "name": "TEMPL Syntax Highlighting",
  "version": "1.0.0",
  "minAppVersion": "1.4.0",
  "description": "Syntax highlighting for Go's TEMPL language in code blocks.",
  "author": "JohnPostlethwait",
  "authorUrl": "https://github.com/JohnPostlethwait",
  "isDesktopOnly": false
}
```

- [ ] **Step 6: Create `versions.json`**

```json
{
  "1.0.0": "1.4.0"
}
```

- [ ] **Step 7: Create `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 JohnPostlethwait

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: installs without error; `node_modules/` populated.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json esbuild.config.mjs manifest.json versions.json LICENSE .gitignore
git commit -m "chore: scaffold Obsidian plugin project"
```

---

## Task 2: Prism grammar — write failing tests

**Files:**
- Create: `tests/grammar.test.ts`

- [ ] **Step 1: Write the failing test file**

```ts
import { describe, it, expect } from "vitest";
import Prism from "prismjs";
import "prismjs/components/prism-go.js";
import "prismjs/components/prism-markup.js";
import { templGrammar, registerTemplGrammar } from "../src/templ-prism";

registerTemplGrammar(Prism);

function tokenTypes(code: string): string[] {
  const tokens = Prism.tokenize(code, templGrammar);
  const types: string[] = [];
  const walk = (t: any) => {
    if (typeof t === "string") return;
    if (Array.isArray(t)) {
      t.forEach(walk);
      return;
    }
    if (t.type) types.push(t.type);
    if (t.content) walk(t.content);
  };
  walk(tokens);
  return types;
}

describe("templ grammar", () => {
  it("tokenizes the templ keyword as a keyword", () => {
    expect(tokenTypes("templ Hello() {}\n")).toContain("keyword");
  });

  it("captures a component definition name as a function", () => {
    const types = tokenTypes("templ Hello() {}\n");
    expect(types).toContain("function");
  });

  it("captures an @Component call as a function", () => {
    expect(tokenTypes("@Nav.Header()")).toContain("function");
  });

  it("tokenizes double-quoted strings", () => {
    expect(tokenTypes('var x = "hi"')).toContain("string");
  });

  it("tokenizes line comments", () => {
    expect(tokenTypes("// a comment\n")).toContain("comment");
  });

  it("tokenizes block comments", () => {
    expect(tokenTypes("/* block */")).toContain("comment");
  });

  it("tokenizes numbers", () => {
    expect(tokenTypes("var x = 42")).toContain("number");
  });

  it("tokenizes interpolation punctuation", () => {
    expect(tokenTypes("templ X() { { name } }")).toContain("interpolation");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../src/templ-prism'" (or similar module-resolution error).

---

## Task 3: Prism grammar — implement

**Files:**
- Create: `src/templ-prism.ts`

- [ ] **Step 1: Create `src/templ-prism.ts` with the grammar**

```ts
import type PrismNs from "prismjs";

type PrismLike = typeof PrismNs;

export const templGrammar: PrismNs.Grammar = {
  comment: [
    { pattern: /\/\/.*/, greedy: true },
    { pattern: /\/\*[\s\S]*?\*\//, greedy: true }
  ],
  string: [
    { pattern: /"(?:\\.|[^"\\\n])*"/, greedy: true },
    { pattern: /`[^`]*`/, greedy: true }
  ],
  "component-definition": {
    pattern: /\btempl\s+[A-Z][A-Za-z0-9_]*/,
    inside: {
      keyword: /\btempl\b/,
      function: /[A-Z][A-Za-z0-9_]*/
    }
  },
  "component-call": {
    pattern: /@[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/,
    alias: "function"
  },
  interpolation: {
    pattern: /\{[^{}\n]*\}/,
    inside: {
      "interpolation-punctuation": {
        pattern: /^\{|\}$/,
        alias: "punctuation"
      },
      rest: undefined as unknown as PrismNs.Grammar
    }
  },
  keyword: /\b(?:templ|script|css|if|else|for|switch|case|default|return|package|import|var|range|func|type|struct|interface)\b/,
  boolean: /\b(?:true|false|nil)\b/,
  number: /\b\d+(?:\.\d+)?\b/,
  operator: /[+\-*/%=<>!&|^~?:]+/,
  punctuation: /[{}[\]();,.]/
};

export function registerTemplGrammar(prism?: PrismLike): void {
  const P: PrismLike | undefined =
    prism ?? (typeof window !== "undefined" ? (window as unknown as { Prism?: PrismLike }).Prism : undefined);
  if (!P) {
    console.warn("[templ-syntax] Prism not found; reading-mode highlighting disabled.");
    return;
  }
  const interp = templGrammar.interpolation as PrismNs.TokenObject;
  if (interp && interp.inside && P.languages.go) {
    interp.inside.rest = P.languages.go;
  }
  P.languages.templ = templGrammar;
}

export function unregisterTemplGrammar(prism?: PrismLike): void {
  const P: PrismLike | undefined =
    prism ?? (typeof window !== "undefined" ? (window as unknown as { Prism?: PrismLike }).Prism : undefined);
  if (!P || !P.languages) return;
  delete (P.languages as Record<string, unknown>).templ;
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`
Expected: all 8 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/templ-prism.ts tests/grammar.test.ts
git commit -m "feat: add TEMPL Prism grammar with unit tests"
```

---

## Task 4: CodeMirror 6 highlighter

**Files:**
- Create: `src/templ-cm6.ts`

- [ ] **Step 1: Create `src/templ-cm6.ts`**

```ts
import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import type PrismNs from "prismjs";
import { templGrammar } from "./templ-prism";

const FENCE_RE = /^```templ\s*$/;
const FENCE_END_RE = /^```\s*$/;

function getPrism(): typeof PrismNs | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Prism?: typeof PrismNs }).Prism;
}

function classForType(type: string): string {
  return `token ${type}`;
}

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const Prism = getPrism();
  if (!Prism) return builder.finish();

  const doc = view.state.doc;
  let inFence = false;
  let fenceContentStart = -1;
  let fenceContentEnd = -1;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    if (!inFence) {
      if (FENCE_RE.test(line.text)) {
        inFence = true;
        fenceContentStart = line.to + 1;
        fenceContentEnd = fenceContentStart;
      }
    } else {
      if (FENCE_END_RE.test(line.text)) {
        const content = doc.sliceString(fenceContentStart, fenceContentEnd);
        emitTokens(builder, Prism, content, fenceContentStart);
        inFence = false;
        fenceContentStart = -1;
        fenceContentEnd = -1;
      } else {
        fenceContentEnd = line.to + 1;
      }
    }
  }

  return builder.finish();
}

function emitTokens(
  builder: RangeSetBuilder<Decoration>,
  Prism: typeof PrismNs,
  content: string,
  baseOffset: number
): void {
  const tokens = Prism.tokenize(content, templGrammar);
  let pos = baseOffset;
  const ranges: Array<{ from: number; to: number; cls: string }> = [];

  const walk = (token: string | PrismNs.Token, inheritedType?: string): void => {
    if (typeof token === "string") {
      pos += token.length;
      return;
    }
    const type = token.type || inheritedType;
    const start = pos;
    if (Array.isArray(token.content)) {
      for (const child of token.content) walk(child, type);
    } else if (typeof token.content === "string") {
      pos += token.content.length;
    } else {
      walk(token.content as PrismNs.Token, type);
    }
    const end = pos;
    if (type && end > start) {
      ranges.push({ from: start, to: end, cls: classForType(type) });
    }
  };

  for (const t of tokens) walk(t);

  ranges.sort((a, b) => (a.from - b.from) || (a.to - b.to));
  for (const r of ranges) {
    builder.add(r.from, r.to, Decoration.mark({ class: r.cls }));
  }
}

export const templHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);
```

Note: the walker tracks `pos` only on leaf string content; for tokens whose content is a nested array, the bracketing `start`/`end` captures the union range of children and we emit a single mark for the parent type. This yields consistent coloring for parent tokens like `component-definition` while child ranges get added via their own walker recursion.

- [ ] **Step 2: Commit**

```bash
git add src/templ-cm6.ts
git commit -m "feat: add CodeMirror 6 highlighter for templ fenced blocks"
```

---

## Task 5: Plugin entry

**Files:**
- Create: `src/main.ts`

- [ ] **Step 1: Create `src/main.ts`**

```ts
import { Plugin } from "obsidian";
import { registerTemplGrammar, unregisterTemplGrammar } from "./templ-prism";
import { templHighlighter } from "./templ-cm6";

export default class TemplSyntaxPlugin extends Plugin {
  async onload(): Promise<void> {
    registerTemplGrammar();
    this.registerEditorExtension(templHighlighter);
  }

  onunload(): void {
    unregisterTemplGrammar();
  }
}
```

- [ ] **Step 2: Verify typecheck and build**

Run: `npm run build`
Expected: exits 0; creates `main.js` at repo root.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire Prism grammar and CM6 highlighter into plugin entry"
```

---

## Task 6: Styles

**Files:**
- Create: `styles.css`

- [ ] **Step 1: Create `styles.css`**

```css
.cm-s-obsidian .token.comment,
.markdown-rendered .language-templ .token.comment {
  color: var(--code-comment, #6a9955);
  font-style: italic;
}

.cm-s-obsidian .token.keyword,
.markdown-rendered .language-templ .token.keyword {
  color: var(--code-keyword, #c586c0);
  font-weight: 600;
}

.cm-s-obsidian .token.string,
.markdown-rendered .language-templ .token.string {
  color: var(--code-string, #ce9178);
}

.cm-s-obsidian .token.number,
.markdown-rendered .language-templ .token.number {
  color: var(--code-value, #b5cea8);
}

.cm-s-obsidian .token.function,
.markdown-rendered .language-templ .token.function {
  color: var(--code-function, #dcdcaa);
}

.cm-s-obsidian .token.operator,
.markdown-rendered .language-templ .token.operator {
  color: var(--code-operator, #d4d4d4);
}

.cm-s-obsidian .token.punctuation,
.markdown-rendered .language-templ .token.punctuation {
  color: var(--code-punctuation, #808080);
}

.cm-s-obsidian .token.boolean,
.markdown-rendered .language-templ .token.boolean {
  color: var(--code-important, #569cd6);
}

.cm-s-obsidian .token.interpolation-punctuation,
.markdown-rendered .language-templ .token.interpolation-punctuation {
  color: var(--code-tag, #569cd6);
  font-weight: 600;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "style: add token color CSS for reading and edit modes"
```

---

## Task 7: Manual test vault

**Files:**
- Create: `test-vault/samples.md`

- [ ] **Step 1: Create `test-vault/samples.md`**

````markdown
# TEMPL samples

## Component definition

```templ
package views

import "fmt"

// Greet says hello.
templ Greet(name string) {
    <div class="greeting">
        <h1>Hello, { name }!</h1>
        if name == "world" {
            <p>Welcome.</p>
        }
    </div>
}
```

## Component call

```templ
templ Page() {
    @Nav.Header()
    <main>{ fmt.Sprintf("count=%d", 3) }</main>
}
```

## Script and css blocks

```templ
script onClick(msg string) {
    alert(msg);
}

css primary() {
    color: #336;
}
```

## Control flow

```templ
templ List(items []string) {
    for _, it := range items {
        <li>{ it }</li>
    }
    switch len(items) {
        case 0:
            <p>empty</p>
        default:
            <p>some</p>
    }
}
```
````

- [ ] **Step 2: Commit**

```bash
git add test-vault/samples.md
git commit -m "test: add manual-test TEMPL sample vault file"
```

---

## Task 8: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

````markdown
# TEMPL Syntax Highlighting for Obsidian

Syntax highlighting for Go's [TEMPL](https://templ.guide) language inside Obsidian code blocks.
Works in both reading mode and live/edit mode.

## Usage

Write fenced code blocks with `templ` as the language:

````
```templ
templ Hello(name string) {
    <h1>Hello, { name }!</h1>
}
```
````

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
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage and install instructions"
```

---

## Task 9: Smoke-test the built plugin

- [ ] **Step 1: Build production artifact**

Run: `npm run build`
Expected: exits 0; `main.js` exists at repo root.

- [ ] **Step 2: Sanity-check the bundle**

Run: `node -e "const s=require('fs').readFileSync('main.js','utf8'); if(!s.includes('templGrammar')) process.exit(1); console.log('ok');"`
Expected: prints `ok`.

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: all grammar tests PASS.

- [ ] **Step 4: Install into a real vault (manual)**

Copy `main.js`, `manifest.json`, `styles.css` into `<your-vault>/.obsidian/plugins/templ-syntax-highlighting/`. Enable the plugin in Settings → Community plugins. Open `test-vault/samples.md` contents in a note and verify coloring in both reading and edit modes.

Expected: keywords, strings, comments, component names, and `@Call` identifiers are colored; interpolation braces are highlighted; both modes look identical.

---

## Task 10: Community directory submission prep

- [ ] **Step 1: Tag release**

```bash
git tag -a 1.0.0 -m "v1.0.0"
```

- [ ] **Step 2: Create GitHub release manually**

On https://github.com/JohnPostlethwait/obsidian-templ-plugin, draft a release for tag `1.0.0`. Attach `main.js`, `manifest.json`, `styles.css` as release assets.

- [ ] **Step 3: Submit to community plugin directory (manual)**

Fork https://github.com/obsidianmd/obsidian-releases. Append this entry to `community-plugins.json`:

```json
{
  "id": "templ-syntax-highlighting",
  "name": "TEMPL Syntax Highlighting",
  "author": "JohnPostlethwait",
  "description": "Syntax highlighting for Go's TEMPL language in code blocks.",
  "repo": "JohnPostlethwait/obsidian-templ-plugin"
}
```

Open a PR against `obsidianmd/obsidian-releases` following their submission checklist in the repo's PR template.
