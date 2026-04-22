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

  it("tokenizes HTML tag names", () => {
    expect(tokenTypes('<div class="x">')).toContain("tag-name");
  });

  it("tokenizes HTML attribute names", () => {
    expect(tokenTypes('<a href="#">')).toContain("attr-name");
  });

  it("tokenizes Go builtin types as builtin", () => {
    expect(tokenTypes("templ F(name string) {}")).toContain("builtin");
  });

  it("captures function parameter names", () => {
    expect(tokenTypes("templ F(name string) {}")).toContain("parameter");
  });

  it("colors plain identifiers as variables", () => {
    expect(tokenTypes("items := foo")).toContain("variable");
  });

  it("colors identifiers inside interpolation as variables", () => {
    const types = tokenTypes("{ name }");
    expect(types).toContain("variable");
  });
});
