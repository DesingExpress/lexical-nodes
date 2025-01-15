/**
 * Copyright (c) 2023 Petyo Ivanov. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DecoratorNode } from "lexical";
import React from "react";
import FrontmatterComponent from "./FrontmatterComponent";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { yaml, yamlFrontmatter } from "@codemirror/lang-yaml";
import { markdown } from "@codemirror/lang-markdown";

export class FrontmatterNode extends DecoratorNode {
  static getType() {
    return "frontmatter";
  }

  static clone(node) {
    return new FrontmatterNode(node.__yaml, node.__cm, node.__key);
  }

  constructor(code, codemirror, key) {
    super(key);
    this.__cm =
      codemirror ??
      this.__cm ??
      new EditorView({
        doc: code,
        extensions: [basicSetup, yaml(), EditorView.lineWrapping],
      });
  }

  createDOM(_config) {
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
    return <FrontmatterComponent domEl={this.__cm.dom} />;
  }
}

export function $createFrontmatterNode(yaml) {
  return new FrontmatterNode(yaml);
}

export function $isFrontmatterNode(node) {
  return node instanceof FrontmatterNode;
}
