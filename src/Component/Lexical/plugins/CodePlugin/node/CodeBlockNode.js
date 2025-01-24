/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $applyNodeReplacement,
  $createLineBreakNode,
  $getNodeByKey,
  $getPreviousSelection,
  $getSelection,
  $setSelection,
  DecoratorNode,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";

// import {
//   $createCodeHighlightNode,
//   $isCodeHighlightNode,
//   getFirstCodeNodeOfLine,
// } from "./CodeHighlightNode";
import { languages } from "@codemirror/language-data";
import { lazy, Suspense } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { Compartment, StateEffect } from "@codemirror/state";

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
      {
        __cm: node.__cm,
        languageConf: node.languageConf,
        keymapConf: node.keymapConf,
        editorState: node.editorState,
        ...node.__meta,
      },
      node.__key
    );
  }

  constructor(language, code, meta = {}, key) {
    super(key);
    const { __cm, languageConf, keymapConf, editorState, ..._meta } = meta;

    this.languageConf = languageConf ?? new Compartment();
    this.keymapConf = keymapConf ?? new Compartment();
    this.editorState = editorState ?? new Compartment();

    this.__cm =
      __cm ??
      this.__cm ??
      new EditorView({
        doc: code,
        extensions: [
          basicSetup,
          this.languageConf.of([]),
          this.keymapConf.of([]),
          this.editorState.of([]),
          EditorView.lineWrapping,
        ],
      });
    this.__meta = _meta;
    this.setLanguage(language);
  }

  // View
  createDOM(_, editor) {
    const __dummyEffect = StateEffect.define(undefined);
    const element = document.createElement("div");
    element.className = "aasss";
    this.__cm.dispatch({
      effects: this.keymapConf.reconfigure([
        keymap.of(this.codeMirrorKeymap(editor)),
        EditorView.focusChangeEffect.of((_, focusing) => {
          if (focusing) {
            console.log("aaa");
            editor.update(() => {
              $setSelection(null);
            });
          }
          return __dummyEffect.of(undefined);
        }),
        EditorView.updateListener.of((u) => this.forwardUpdate(u)),
      ]),
    });
    return element;
  }

  updateDOM(prevNode) {
    return false;
  }

  remove(preserveEmptyParent) {
    if (this.__cm) this.__cm.destroy();
    return super.remove(preserveEmptyParent);
  }

  decorate() {
    return (
      <Suspense fallback={null}>
        <CodeBlockComponent
          cm={this.__cm}
          language={this.getLanguage()}
          languageList={languageList}
          keymap={this.keymapConf}
          editorState={this.editorState}
          onUpdateLanguage={(v) => this.setLanguage(v)}
          meta={this.__meta}
          test={this}
        />
      </Suspense>
    );
  }

  codeMirrorKeymap = (editor) => {
    // const view = this.view;
    return [
      {
        key: "ArrowUp",
        run: () => {
          let res = false;
          editor.update(() => {
            res = this.maybeEscape("line", -1);
            return false;
          });
          return res;
        },
      },
      {
        key: "ArrowLeft",
        run: () => false,
        // editor.getEditorState().read(() => this.maybeEscape("char", -1)),
      },
      {
        key: "ArrowDown",
        run: () => {
          let res = false;
          editor.update(() => {
            res = this.maybeEscape("line", 1);
            return false;
          });
          return res;
        },
      },
      {
        key: "ArrowRight",
        run: () => false,
        // editor.getEditorState().read(() => this.maybeEscape("char", 1)),
      },
      // {
      //   key: 'Mod-Enter',
      //   run: () => {
      //     if (!exitCode(view.state, view.dispatch)) return false

      //     view.focus()
      //     return true
      //   },
      // },
      {
        key: "Mod-z",
        run: () => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
          return false;
        },
      },
      {
        key: "Shift-Mod-z",
        run: () => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
          return false;
        },
      },
      {
        key: "Mod-y",
        run: () => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
          return false;
        },
      },
      // {
      //   key: 'Backspace',
      //   run: () => {
      //     const ranges = this.cm.state.selection.ranges

      //     if (ranges.length > 1) return false

      //     const selection = ranges[0]

      //     if (selection && (!selection.empty || selection.anchor > 0))
      //       return false

      //     if (this.cm.state.doc.lines >= 2) return false

      //     const state = this.view.state
      //     const pos = this.getPos() ?? 0
      //     const tr = state.tr.replaceWith(
      //       pos,
      //       pos + this.node.nodeSize,
      //       state.schema.nodes.paragraph?.createChecked({}, this.node.content)
      //     )

      //     tr.setSelection(TextSelection.near(tr.doc.resolve(pos)))

      //     this.view.dispatch(tr)
      //     this.view.focus()
      //     return true
      //   },
      // },
    ];
  };

  maybeEscape(unit, dir) {
    const { state } = this.__cm;
    let main = state.selection.main;
    if (!main.empty) return false;

    if (unit === "line") main = state.doc.lineAt(main.head);
    if (dir < 0 ? main.from > 0 : main.to < state.doc.length) return false;

    if (dir < 0) {
      this.__cm.contentDOM.blur();
      const prev = $getNodeByKey(this.__key).selectPrevious().clone();
      $setSelection(prev.clone());
    }

    if (dir > 0) {
      this.__cm.contentDOM.blur();
      const prev = $getNodeByKey(this.__key).selectNext().clone();
      $setSelection(prev.clone());
    }
    return true;
  }

  forwardUpdate(update) {
    // if (!this.__cm.hasFocus) return;
    // let offset = 1;
    // const { main } = update.state.selection;
    // const selFrom = offset + main.from;
    // const selTo = offset + main.to;
    // console.log(selFrom, selTo);
    // // if (update.docChanged ) {
    // //   const tr = this.view.state.tr
    // //   update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
    // //     if (text.length)
    // //       tr.replaceWith(
    // //         offset + fromA,
    // //         offset + toA,
    // //         this.view.state.schema.text(text.toString())
    // //       )
    // //     else tr.delete(offset + fromA, offset + toA)
    // //     offset += toB - fromB - (toA - fromA)
    // //   })
    // //   tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo))
    // //   this.view.dispatch(tr)
    // // }
  }

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

  isInline() {
    return true;
  }
  isIsolated() {
    return false;
  }
  isKeyboardSelectable() {
    return true;
  }
}

export function $createCodeNode(language, code, meta) {
  return $applyNodeReplacement(new CodeNode(language, code, meta));
}

export function $isCodeNode(node) {
  return node instanceof CodeNode;
}
