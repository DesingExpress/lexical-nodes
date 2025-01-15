import {
  $createFrontmatterNode,
  $isFrontmatterNode,
  FrontmatterNode,
} from "./node/FrontamatterNode";

const FRONTMATTER_REGEX = /^[ \t]*---$/;

export const FRONTMATTER = {
  dependencies: [FrontmatterNode],
  export: (node) => {
    if (!$isFrontmatterNode(node)) {
      return null;
    }
    const textContent = node.getTextContent();
    return "---" + (textContent ? "\n" + textContent : "") + "\n" + "---";
  },
  regExpEnd: FRONTMATTER_REGEX,
  regExpStart: FRONTMATTER_REGEX,
  replace: (
    rootNode,
    children,
    startMatch,
    endMatch,
    linesInBetween,
    isImport
  ) => {
    let frontmatterText;

    if (!children && linesInBetween) {
      if (linesInBetween.length === 1) {
        frontmatterText = "";
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

        frontmatterText = linesInBetween.join("\n");
      }

      const frontmatterNode = $createFrontmatterNode(frontmatterText);

      rootNode.append(frontmatterNode);
    } else if (children) {
      const node = $createFrontmatterNode();

      rootNode.replace(node);
    }
  },
  type: "multiline-element",
};
