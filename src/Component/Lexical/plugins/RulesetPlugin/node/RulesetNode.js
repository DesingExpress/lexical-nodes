/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $applyNodeReplacement,
  $getNodeByKey,
  $setSelection,
  DecoratorNode,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";

import { lazy, Suspense } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { languages } from "@codemirror/language-data";
import { Compartment, StateEffect } from "@codemirror/state";

const RulesetComponent = lazy(() => import("./RulesetComponent"));

/** @noInheritDoc */
export class RulesetNode extends DecoratorNode {
  static getType() {
    return "ruleset";
  }

  static clone(node) {
    return new RulesetNode(
      node.getTextContent(),
      {
        __cm: node.__cm,
        keymapConf: node.keymapConf,
        editorState: node.editorState,
        ...node.__meta,
      },
      node.__key
    );
  }

  constructor(code, meta = {}, key) {
    super(key);
    const { __cm, languageConf, keymapConf, editorState, ..._meta } = meta;

    this.keymapConf = keymapConf ?? new Compartment();
    this.languageConf = languageConf ?? new Compartment();
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
    this.setLanguage();
  }

  // View
  createDOM(config, editor) {
    const __dummyEffect = StateEffect.define(undefined);
    const element = document.createElement("div");
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
        // EditorView.updateListener.of((u) => this.forwardUpdate(u)),
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
        <RulesetComponent
          cm={this.__cm}
          editorState={this.editorState}
          meta={this.__meta}
        />
      </Suspense>
    );
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

  getRawMeta() {
    return this.__meta;
  }

  setLanguage() {
    const language = languages.find((i) => i.name === "PostgreSQL");

    if (!language) return false;

    (!!language.support
      ? Promise.resolve(language.support)
      : language.load()
    ).then((lang) => {
      return this.__cm.dispatch({
        effects: this.languageConf.reconfigure(lang),
      });
    });
    return false;
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
}

export function $createRulesetNode(code, meta) {
  return $applyNodeReplacement(new RulesetNode(code, meta));
}

export function $isRulesetNode(node) {
  return node instanceof RulesetNode;
}
