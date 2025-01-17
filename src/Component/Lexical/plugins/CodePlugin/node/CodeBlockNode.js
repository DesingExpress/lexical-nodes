/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $applyNodeReplacement, DecoratorNode } from "lexical";

// import {
//   $createCodeHighlightNode,
//   $isCodeHighlightNode,
//   getFirstCodeNodeOfLine,
// } from "./CodeHighlightNode";
import { languages } from "@codemirror/language-data";
import { lazy, Suspense } from "react";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { Compartment } from "@codemirror/state";

const CodeBlockComponent = lazy(() => import("./CodeBlockComponent"));

const languageMap = (function () {
  const result = {};

  languages.forEach((language) => {
    language.alias.forEach((alias) => {
      result[alias] = language;
    });
  });
  return result;
})();

const languageList = languages.map((l) => l.name);

/** @noInheritDoc */
export class CodeNode extends DecoratorNode {
  static getType() {
    return "code";
  }

  static clone(node) {
    return new CodeNode(
      node.getLanguage(),
      node.getTextContent(),
      { __cm: node.__cm, languageConf: node.languageConf, ...node.__meta },
      node.__key
    );
  }

  constructor(language, code, meta = {}, key) {
    super(key);
    const { __cm, languageConf, ..._meta } = meta;
    this.languageConf = languageConf ?? new Compartment();

    this.__cm =
      __cm ??
      this.__cm ??
      new EditorView({
        doc: code,
        extensions: [
          basicSetup,
          this.languageConf.of([]),
          EditorView.lineWrapping,
        ],
      });
    this.__meta = _meta;
    this.setLanguage(language);
  }

  // View
  createDOM(config) {
    const element = document.createElement("div");
    element.className = "aasss";

    return element;
  }

  remove(preserveEmptyParent) {
    if (this.__cm) this.__cm.destroy();
    return super.remove(preserveEmptyParent);
  }

  decorate() {
    return (
      <Suspense fallback={null}>
        <CodeBlockComponent
          domEl={this.__cm.dom}
          language={this.getLanguage()}
          languageList={languageList}
          onUpdateLanguage={(v) => this.setLanguage(v)}
          meta={this.__meta}
        />
      </Suspense>
    );
  }

  // codeMirrorKeymap = ()=> {
  //   const view = this.view
  //   return [
  //     { key: 'ArrowUp', run: () => this.maybeEscape('line', -1) },
  //     { key: 'ArrowLeft', run: () => this.maybeEscape('char', -1) },
  //     { key: 'ArrowDown', run: () => this.maybeEscape('line', 1) },
  //     { key: 'ArrowRight', run: () => this.maybeEscape('char', 1) },
  //     {
  //       key: 'Mod-Enter',
  //       run: () => {
  //         if (!exitCode(view.state, view.dispatch)) return false

  //         view.focus()
  //         return true
  //       },
  //     },
  //     { key: 'Mod-z', run: () => undo(view.state, view.dispatch) },
  //     { key: 'Shift-Mod-z', run: () => redo(view.state, view.dispatch) },
  //     { key: 'Mod-y', run: () => redo(view.state, view.dispatch) },
  //     {
  //       key: 'Backspace',
  //       run: () => {
  //         const ranges = this.cm.state.selection.ranges

  //         if (ranges.length > 1) return false

  //         const selection = ranges[0]

  //         if (selection && (!selection.empty || selection.anchor > 0))
  //           return false

  //         if (this.cm.state.doc.lines >= 2) return false

  //         const state = this.view.state
  //         const pos = this.getPos() ?? 0
  //         const tr = state.tr.replaceWith(
  //           pos,
  //           pos + this.node.nodeSize,
  //           state.schema.nodes.paragraph?.createChecked({}, this.node.content)
  //         )

  //         tr.setSelection(TextSelection.near(tr.doc.resolve(pos)))

  //         this.view.dispatch(tr)
  //         this.view.focus()
  //         return true
  //       },
  //     },
  //   ]
  // }

  //  maybeEscape = (unit, dir) => {
  //   const { state } = this.cm
  //   let main = state.selection.main
  //   if (!main.empty) return false
  //   if (unit === 'line') main = state.doc.lineAt(main.head)
  //   if (dir < 0 ? main.from > 0 : main.to < state.doc.length) return false

  //   const targetPos = (this.getPos() ?? 0) + (dir < 0 ? 0 : this.node.nodeSize)
  //   const selection = TextSelection.near(
  //     this.view.state.doc.resolve(targetPos),
  //     dir
  //   )
  //   const tr = this.view.state.tr.setSelection(selection).scrollIntoView()
  //   this.view.dispatch(tr)
  //   this.view.focus()
  //   return true
  // }

  // setSelection = (anchor, head) => {
  //   if (!this.cm.dom.isConnected) return;

  //   this.cm.focus();
  //   this.updating = true;
  //   this.cm.dispatch({ selection: { anchor, head } });
  //   this.updating = false;
  // };

  // canIndent() {
  //   return false;
  // }

  // collapseAtStart() {
  //   const paragraph = $createParagraphNode();
  //   const children = this.getChildren();
  //   children.forEach((child) => paragraph.append(child));
  //   this.replace(paragraph);
  //   return true;
  // }

  setLanguage(value) {
    if (typeof value !== "string") return false;
    const _value = value.toLowerCase();
    const language = languageMap[_value];

    if (!language) return false;

    (!!language.support
      ? Promise.resolve(language.support)
      : language.load()
    ).then((lang) => {
      lang["$$name$$"] = language.name;
      return this.__cm.dispatch({
        effects: this.languageConf.reconfigure(lang),
      });
    });
    return false;
  }

  getLanguage() {
    return this.languageConf.get(this.__cm.state)["$$name$$"];
  }

  getTextContent() {
    return this.__cm?.state.doc.toString() ?? "";
  }

  getTextContentSize() {
    return this.__cm?.state.doc.length ?? 0;
  }

  getMeta() {
    return Object.entries(this.__meta)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
  }
}

export function $createCodeNode(language, code, meta) {
  return $applyNodeReplacement(new CodeNode(language, code, meta));
}

export function $isCodeNode(node) {
  return node instanceof CodeNode;
}
