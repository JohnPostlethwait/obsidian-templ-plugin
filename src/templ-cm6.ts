import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import type PrismNs from "prismjs";
import { templGrammar } from "./templ-prism";

const FENCE_RE = /^\s*```templ\s*$/;
const FENCE_END_RE = /^\s*```\s*$/;

const WRAPPER_TYPES = new Set([
  "html-tag",
  "component-definition",
  "component-call",
  "interpolation"
]);

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
    if (type && end > start && !WRAPPER_TYPES.has(type)) {
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
