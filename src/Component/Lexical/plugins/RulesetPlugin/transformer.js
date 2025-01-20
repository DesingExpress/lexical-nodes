import { parse } from "../../utils/metaParser";
import {
  $createRulesetNode,
  $isRulesetNode,
  RulesetNode,
} from "./node/RulesetNode";

const RULESET_START_REGEX = /^[ \t]*```rule(?:[ \t]+(.*))?/;
const RULESET_END_REGEX = /[ \t]*```$/;

export const RULESET = {
  dependencies: [RulesetNode],
  export: (node) => {
    if (!$isRulesetNode(node)) {
      return null;
    }
    const textContent = node.getTextContent();
    return (
      "```rule" +
      ` ${node.getMeta() || ""}` +
      (textContent ? "\n" + textContent : "") +
      "\n" +
      "```"
    );
  },
  regExpEnd: {
    optional: true,
    regExp: RULESET_END_REGEX,
  },
  regExpStart: RULESET_START_REGEX,
  replace: (
    rootNode,
    children,
    startMatch,
    endMatch,
    linesInBetween,
    isImport
  ) => {
    let code;

    if (!children && linesInBetween) {
      if (linesInBetween.length === 1) {
        // Single-line code blocks
        if (endMatch) {
          // End match on same line. Example: ```markdown hello```. markdown should not be considered the language here.
          code = linesInBetween[0];
        } else {
          // No end match. We should assume the language is next to the backticks and that code will be typed on the next line in the future
          code = linesInBetween[0].startsWith(" ")
            ? linesInBetween[0].slice(1)
            : linesInBetween[0];
        }
      } else {
        // Treat multi-line code blocks as if they always have an end match

        if (linesInBetween[0].trim().length === 0) {
          // Filter out all start and end lines that are length 0 until we find the first line with content
          while (linesInBetween.length > 0 && !linesInBetween[0].length) {
            linesInBetween.shift();
          }
        } else {
          // The first line already has content => Remove the first space of the line if it exists
          linesInBetween[0] = linesInBetween[0].startsWith(" ")
            ? linesInBetween[0].slice(1)
            : linesInBetween[0];
        }

        // Filter out all end lines that are length 0 until we find the last line with content
        while (
          linesInBetween.length > 0 &&
          !linesInBetween[linesInBetween.length - 1].length
        ) {
          linesInBetween.pop();
        }

        code = linesInBetween.join("\n");
      }

      const codeBlockNode = $createRulesetNode(code, parse(startMatch[1]));

      rootNode.append(codeBlockNode);
    } else if (children) {
      const node = $createRulesetNode(undefined, parse(startMatch[1]));

      rootNode.replace(node);
    }
  },
  type: "multiline-element",
};
