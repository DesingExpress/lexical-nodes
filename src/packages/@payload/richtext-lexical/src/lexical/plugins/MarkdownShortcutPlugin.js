// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

// // import { registerMarkdownShortcuts } from "../markdown/MarkdownShortcuts.js";
// import { registerMarkdownShortcuts } from "#/@lexical/markdown/MarkdownShortcuts.js";
// // import { TRANSFORMERS } from "../markdown/index.js";
// import {
//   ELEMENT_TRANSFORMERS,
//   TEXT_FORMAT_TRANSFORMERS,
//   TEXT_MATCH_TRANSFORMERS,
// } from "#/@lexical/markdown/index.js";

// import {
//   $createHorizontalRuleNode,
//   $isHorizontalRuleNode,
//   HorizontalRuleNode,
// } from "@lexical/react/LexicalHorizontalRuleNode";
// import { createRef, useEffect } from "react";

// const HR = {
//   dependencies: [HorizontalRuleNode],
//   export: (node) => {
//     return $isHorizontalRuleNode(node) ? "***" : null;
//   },
//   regExp: /^(---|\*\*\*|___)\s?$/,
//   replace: (parentNode, _1, _2, isImport) => {
//     const line = $createHorizontalRuleNode();

//     // TODO: Get rid of isImport flag
//     if (isImport || parentNode.getNextSibling() != null) {
//       parentNode.replace(line);
//     } else {
//       parentNode.insertBefore(line);
//     }

//     line.selectNext();
//   },
//   type: "element",
// };

// const DEFAULT_TRANSFORMERS = [
//   HR,
//   ...ELEMENT_TRANSFORMERS,
//   // ...MULTILINE_ELEMENT_TRANSFORMERS,
//   ...TEXT_FORMAT_TRANSFORMERS,
//   ...TEXT_MATCH_TRANSFORMERS,
// ];

// export const MarkdownShortcutPlugin = ({ plugins = [] }) => {
//   const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     MUT_TRANSFORMERS.current = [...DEFAULT_TRANSFORMERS, ...plugins];

//     return registerMarkdownShortcuts(editor, MUT_TRANSFORMERS.current);
//   }, [editor, plugins]);

//   return null;
// };

// // Mutation
// export const MUT_TRANSFORMERS = createRef();
