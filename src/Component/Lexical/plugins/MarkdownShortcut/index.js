import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { registerMarkdownShortcuts } from "#/@lexical/markdown/MarkdownShortcuts.js";
import {
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  TRANSFORMERS,
} from "#/@lexical/markdown/index.js";

import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";
import { createRef, useEffect } from "react";
import { TABLE } from "../TablePlugin/transformer";

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

export const DEFAULT_TRANSFORMERS = [
  TABLE,
  HR,
  ...TRANSFORMERS,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];

export const MarkdownShortcutPlugin = ({
  plugins = [],
  transformers = DEFAULT_TRANSFORMERS,
}) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerMarkdownShortcuts(editor, plugins);
  }, [editor, plugins]);

  return null;
};

// Mutation
export const MUT_TRANSFORMERS = createRef();
