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
