/**
 * Copyright (c) 2023 Petyo Ivanov. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $getNodeByKey,
  $setSelection,
  DecoratorNode,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import React from "react";
import FrontmatterComponent from "./FrontmatterComponent";
import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { yaml } from "@codemirror/lang-yaml";
import { Compartment, StateEffect } from "@codemirror/state";

export class FrontmatterNode extends DecoratorNode {
  static getType() {
    return "frontmatter";
  }

  static clone(node) {
    return new FrontmatterNode(
      node.__yaml,
      {
        __cm: node.__cm,
        keymapConf: node.keymapConf,
        editorState: node.editorState,
      },
      node.__key
    );
  }

  constructor(code, meta = {}, key) {
    super(key);

    const { __cm, keymapConf, editorState } = meta;

    this.keymapConf = keymapConf ?? new Compartment();
    this.editorState = editorState ?? new Compartment();

    this.__cm =
      __cm ??
      this.__cm ??
      new EditorView({
        doc: code,
        extensions: [
          basicSetup,
          yaml(),
          this.keymapConf.of([]),
          this.editorState.of([]),
          EditorView.lineWrapping,
        ],
      });
  }

  createDOM(_config, editor) {
    const __dummyEffect = StateEffect.define(undefined);
    this.__cm.dispatch({
      effects: this.keymapConf.reconfigure([
        keymap.of(this.codeMirrorKeymap(editor)),
        EditorView.focusChangeEffect.of((_, focusing) => {
          if (focusing) {
            editor.update(() => {
              $setSelection(null);
            });
          }
          return __dummyEffect.of(undefined);
        }),
        // EditorView.updateListener.of((u) => this.forwardUpdate(u)),
      ]),
    });
    return document.createElement("div");
  }

  updateDOM() {
    return false;
  }
  getTextContent() {
    return this.__cm?.state.doc.toString() ?? "";
  }

  getTextContentSize() {
    return this.__cm?.state.doc.length ?? 0;
  }

  decorate() {
    return (
      <FrontmatterComponent cm={this.__cm} editorState={this.editorState} />
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

export function $createFrontmatterNode(yaml) {
  return new FrontmatterNode(yaml);
}

export function $isFrontmatterNode(node) {
  return node instanceof FrontmatterNode;
}
