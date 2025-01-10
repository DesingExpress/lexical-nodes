import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import * as React from "react";

import { registerMarkdownShortcuts } from "../markdown/MarkdownShortcuts.js";
import { TRANSFORMERS } from "../markdown/index.js";
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";

const HR = {
  dependencies: [HorizontalRuleNode],
  export: (node) => {
    return $isHorizontalRuleNode(node) ? "***" : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();

    // TODO: Get rid of isImport flag
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: "element",
};

export const MarkdownShortcutPlugin = () => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    const DEFAULT_TRANSFORMERS = [HR, ...TRANSFORMERS];

    return registerMarkdownShortcuts(editor, DEFAULT_TRANSFORMERS);
  }, [editor]);

  return null;
};
