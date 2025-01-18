/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $applyNodeReplacement, DecoratorNode } from "lexical";

import { lazy, Suspense } from "react";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { languages } from "@codemirror/language-data";
import { Compartment } from "@codemirror/state";

const RulesetComponent = lazy(() => import("./RulesetComponent"));

/** @noInheritDoc */
export class RulesetNode extends DecoratorNode {
  static getType() {
    return "ruleset";
  }

  static clone(node) {
    return new RulesetNode(
      node.getTextContent(),
      { __cm: node.__cm, ...node.__meta },
      node.__key
    );
  }

  constructor(code, meta = {}, key) {
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
    this.setLanguage();
  }

  // View
  createDOM(config) {
    const element = document.createElement("div");
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
        <RulesetComponent domEl={this.__cm.dom} meta={this.__meta} />
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
}

export function $createRulesetNode(code, meta) {
  return $applyNodeReplacement(new RulesetNode(code, meta));
}

export function $isRulesetNode(node) {
  return node instanceof RulesetNode;
}
