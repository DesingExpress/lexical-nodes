/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "katex/dist/katex.css";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement } from "@lexical/utils";
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from "lexical";
import { useCallback, useEffect } from "react";

import KatexEquationAlterer from "./ui/KatexEquationAlterer";
import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from "./node/EquationNode";

export const INSERT_EQUATION_COMMAND = createCommand("INSERT_EQUATION_COMMAND");

export function InsertEquationDialog({ activeEditor, onClose }) {
  const onEquationConfirm = useCallback(
    (equation, inline) => {
      activeEditor.dispatchCommand(INSERT_EQUATION_COMMAND, {
        equation,
        inline,
      });
      onClose();
    },
    [activeEditor, onClose]
  );
  return <KatexEquationAlterer onConfirm={onEquationConfirm} />;
}

export default function EquationsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([EquationNode])) {
      throw new Error(
        "EquationsPlugins: EquationsNode not registered on editor"
      );
    }

    return editor.registerCommand(
      INSERT_EQUATION_COMMAND,
      (payload) => {
        const { equation, inline } = payload;
        const equationNode = $createEquationNode(equation, inline);

        $insertNodes([equationNode]);
        if ($isRootOrShadowRoot(equationNode.getParentOrThrow())) {
          $wrapNodeInElement(equationNode, $createParagraphNode).selectEnd();
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

export const EQUATION = {
  dependencies: [EquationNode],
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null;
    }

    return `$${node.getEquation()}$`;
  },
  importRegExp: /\$([^$]+?)\$/,
  regExp: /\$([^$]+?)\$$/,
  replace: (textNode, match) => {
    const [, equation] = match;
    const equationNode = $createEquationNode(equation, true);
    textNode.replace(equationNode);
  },
  trigger: "$",
  type: "text-match",
};
