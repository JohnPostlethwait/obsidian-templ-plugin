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
  "html-tag": {
    pattern: /<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s+(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^>"'])*)?\/?>/,
    greedy: true,
    inside: {
      "tag-name": {
        pattern: /<\/?[a-zA-Z][a-zA-Z0-9-]*/,
        inside: {
          punctuation: /<\/?/,
          tag: /[a-zA-Z][a-zA-Z0-9-]*/
        }
      },
      "attr-name": /\b[a-zA-Z_][a-zA-Z0-9_-]*(?=\s*=)/,
      "attr-value": {
        pattern: /=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/,
        inside: {
          punctuation: /^=/,
          string: /"[^"]*"|'[^']*'/,
          interpolation: {
            pattern: /\{[^}]*\}/,
            inside: {
              "interpolation-punctuation": {
                pattern: /^\{|\}$/,
                alias: "punctuation"
              },
              variable: /\b[a-zA-Z_]\w*\b/
            }
          }
        }
      },
      "tag-punctuation": {
        pattern: /\/?>/,
        alias: "punctuation"
      }
    }
  },
  interpolation: {
    pattern: /\{[^{}\n]*\}/,
    greedy: true,
    inside: {
      "interpolation-punctuation": {
        pattern: /^\{|\}$/,
        alias: "punctuation"
      },
      string: /"(?:\\.|[^"\\])*"/,
      keyword: /\b(?:func|return|if|else|for|range|nil)\b/,
      boolean: /\b(?:true|false)\b/,
      number: /\b\d+(?:\.\d+)?\b/,
      function: /\b[a-zA-Z_]\w*(?=\s*\()/,
      variable: /\b[a-zA-Z_]\w*\b/,
      operator: /[+\-*/%=<>!&|^~?:]+/,
      punctuation: /[(),.]/
    }
  },
  parameter: {
    pattern: /([(,]\s*)[a-z_]\w*(?=\s+[a-zA-Z_*\[])/,
    lookbehind: true,
    alias: "variable"
  },
  keyword: /\b(?:templ|script|css|if|else|for|switch|case|default|return|package|import|var|range|func|type|struct|interface)\b/,
  builtin: /\b(?:string|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|uintptr|byte|rune|bool|float32|float64|complex64|complex128|any|error|map|chan)\b/,
  boolean: /\b(?:true|false|nil)\b/,
  number: /\b\d+(?:\.\d+)?\b/,
  function: /\b[a-zA-Z_]\w*(?=\s*\()/,
  variable: /\b[a-zA-Z_]\w*\b/,
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
  P.languages.templ = templGrammar;
}

export function unregisterTemplGrammar(prism?: PrismLike): void {
  const P: PrismLike | undefined =
    prism ?? (typeof window !== "undefined" ? (window as unknown as { Prism?: PrismLike }).Prism : undefined);
  if (!P || !P.languages) return;
  delete (P.languages as Record<string, unknown>).templ;
}
