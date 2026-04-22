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
    inside: {
      function: /[A-Za-z_][A-Za-z0-9_.]+/,
      punctuation: /@/
    }
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
  const interp = templGrammar.interpolation as any;
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
