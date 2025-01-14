// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
// import { $isHeadingNode, HeadingNode } from "@lexical/rich-text";
// import { $getNextRightPreorderNode } from "@lexical/utils";
// import { $getNodeByKey, $getRoot, $isElementNode, TextNode } from "lexical";
// import React, { useEffect, useState } from "react";

// function toEntry(heading) {
//   return [heading.getKey(), heading.getTextContent(), heading.getTag()];
// }

// function $insertHeadingIntoTableOfContents(
//   prevHeading,
//   newHeading,
//   currentTableOfContents
// ) {
//   if (newHeading === null) {
//     return currentTableOfContents;
//   }
//   const newEntry = toEntry(newHeading);
//   let newTableOfContents = [];
//   if (prevHeading === null) {
//     // check if key already exists
//     if (
//       currentTableOfContents.length > 0 &&
//       currentTableOfContents[0][0] === newHeading.__key
//     ) {
//       return currentTableOfContents;
//     }
//     newTableOfContents = [newEntry, ...currentTableOfContents];
//   } else {
//     for (let i = 0; i < currentTableOfContents.length; i++) {
//       const key = currentTableOfContents[i][0];
//       newTableOfContents.push(currentTableOfContents[i]);
//       if (key === prevHeading.getKey() && key !== newHeading.getKey()) {
//         // check if key already exists
//         if (
//           i + 1 < currentTableOfContents.length &&
//           currentTableOfContents[i + 1][0] === newHeading.__key
//         ) {
//           return currentTableOfContents;
//         }
//         newTableOfContents.push(newEntry);
//       }
//     }
//   }
//   return newTableOfContents;
// }

// function $deleteHeadingFromTableOfContents(key, currentTableOfContents) {
//   const newTableOfContents = [];
//   for (const heading of currentTableOfContents) {
//     if (heading[0] !== key) {
//       newTableOfContents.push(heading);
//     }
//   }
//   return newTableOfContents;
// }

// function $updateHeadingInTableOfContents(heading, currentTableOfContents) {
//   const newTableOfContents = [];
//   for (const oldHeading of currentTableOfContents) {
//     if (oldHeading[0] === heading.getKey()) {
//       newTableOfContents.push(toEntry(heading));
//     } else {
//       newTableOfContents.push(oldHeading);
//     }
//   }
//   return newTableOfContents;
// }

// /**
//  * Returns the updated table of contents, placing the given `heading` before the given `prevHeading`. If `prevHeading`
//  * is undefined, `heading` is placed at the start of table of contents
//  */
// function $updateHeadingPosition(prevHeading, heading, currentTableOfContents) {
//   const newTableOfContents = [];
//   const newEntry = toEntry(heading);

//   if (!prevHeading) {
//     newTableOfContents.push(newEntry);
//   }
//   for (const oldHeading of currentTableOfContents) {
//     if (oldHeading[0] === heading.getKey()) {
//       continue;
//     }
//     newTableOfContents.push(oldHeading);
//     if (prevHeading && oldHeading[0] === prevHeading.getKey()) {
//       newTableOfContents.push(newEntry);
//     }
//   }

//   return newTableOfContents;
// }

// function $getPreviousHeading(node) {
//   let prevHeading = $getNextRightPreorderNode(node);
//   while (prevHeading !== null && !$isHeadingNode(prevHeading)) {
//     prevHeading = $getNextRightPreorderNode(prevHeading);
//   }
//   return prevHeading;
// }

// export function TableContentsPlugin({ children }) {
//   const [tableOfContents, setTableOfContents] = useState([]);
//   const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     // Set table of contents initial state
//     let currentTableOfContents = [];
//     editor.getEditorState().read(() => {
//       const updateCurrentTableOfContents = (node) => {
//         for (const child of node.getChildren()) {
//           if ($isHeadingNode(child)) {
//             currentTableOfContents.push([
//               child.getKey(),
//               child.getTextContent(),
//               child.getTag(),
//             ]);
//           } else if ($isElementNode(child)) {
//             updateCurrentTableOfContents(child);
//           }
//         }
//       };

//       updateCurrentTableOfContents($getRoot());
//       setTableOfContents(currentTableOfContents);
//     });

//     const removeRootUpdateListener = editor.registerUpdateListener(
//       ({ editorState, dirtyElements }) => {
//         editorState.read(() => {
//           const updateChildHeadings = (node) => {
//             for (const child of node.getChildren()) {
//               if ($isHeadingNode(child)) {
//                 const prevHeading = $getPreviousHeading(child);
//                 currentTableOfContents = $updateHeadingPosition(
//                   prevHeading,
//                   child,
//                   currentTableOfContents
//                 );
//                 setTableOfContents(currentTableOfContents);
//               } else if ($isElementNode(child)) {
//                 updateChildHeadings(child);
//               }
//             }
//           };

//           // If a node is changes, all child heading positions need to be updated
//           $getRoot()
//             .getChildren()
//             .forEach((node) => {
//               if ($isElementNode(node) && dirtyElements.get(node.__key)) {
//                 updateChildHeadings(node);
//               }
//             });
//         });
//       }
//     );

//     // Listen to updates to heading mutations and update state
//     const removeHeaderMutationListener = editor.registerMutationListener(
//       HeadingNode,
//       (mutatedNodes) => {
//         editor.getEditorState().read(() => {
//           for (const [nodeKey, mutation] of mutatedNodes) {
//             if (mutation === "created") {
//               const newHeading = $getNodeByKey(nodeKey);
//               if (newHeading !== null) {
//                 const prevHeading = $getPreviousHeading(newHeading);
//                 currentTableOfContents = $insertHeadingIntoTableOfContents(
//                   prevHeading,
//                   newHeading,
//                   currentTableOfContents
//                 );
//               }
//             } else if (mutation === "destroyed") {
//               currentTableOfContents = $deleteHeadingFromTableOfContents(
//                 nodeKey,
//                 currentTableOfContents
//               );
//             } else if (mutation === "updated") {
//               const newHeading = $getNodeByKey(nodeKey);
//               if (newHeading !== null) {
//                 const prevHeading = $getPreviousHeading(newHeading);
//                 currentTableOfContents = $updateHeadingPosition(
//                   prevHeading,
//                   newHeading,
//                   currentTableOfContents
//                 );
//               }
//             }
//           }
//           setTableOfContents(currentTableOfContents);
//         });
//       },
//       // Initialization is handled separately
//       { skipInitialization: true }
//     );

//     // Listen to text node mutation updates
//     const removeTextNodeMutationListener = editor.registerMutationListener(
//       TextNode,
//       (mutatedNodes) => {
//         editor.getEditorState().read(() => {
//           for (const [nodeKey, mutation] of mutatedNodes) {
//             if (mutation === "updated") {
//               const currNode = $getNodeByKey(nodeKey);
//               if (currNode !== null) {
//                 const parentNode = currNode.getParentOrThrow();
//                 if ($isHeadingNode(parentNode)) {
//                   currentTableOfContents = $updateHeadingInTableOfContents(
//                     parentNode,
//                     currentTableOfContents
//                   );
//                   setTableOfContents(currentTableOfContents);
//                 }
//               }
//             }
//           }
//         });
//       },
//       // Initialization is handled separately
//       { skipInitialization: true }
//     );

//     return () => {
//       removeHeaderMutationListener();
//       removeTextNodeMutationListener();
//       removeRootUpdateListener();
//     };
//   }, [editor]);

//   return children(tableOfContents, editor);
// }

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import "./index.css";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TableOfContentsPlugin as LexicalTableOfContentsPlugin } from "@lexical/react/LexicalTableOfContentsPlugin";
import { useEffect, useRef, useState } from "react";
import * as React from "react";

const MARGIN_ABOVE_EDITOR = 624;
const HEADING_WIDTH = 9;

function indent(tagName) {
  if (tagName === "h2") {
    return "heading2";
  } else if (tagName === "h3") {
    return "heading3";
  }
}

function isHeadingAtTheTopOfThePage(element) {
  const elementYPosition = element?.getClientRects()[0].y;
  return (
    elementYPosition >= MARGIN_ABOVE_EDITOR &&
    elementYPosition <= MARGIN_ABOVE_EDITOR + HEADING_WIDTH
  );
}
function isHeadingAboveViewport(element) {
  const elementYPosition = element?.getClientRects()[0].y;
  return elementYPosition < MARGIN_ABOVE_EDITOR;
}
function isHeadingBelowTheTopOfThePage(element) {
  const elementYPosition = element?.getClientRects()[0].y;
  return elementYPosition >= MARGIN_ABOVE_EDITOR + HEADING_WIDTH;
}

function TableOfContentsList({ tableOfContents }) {
  const [selectedKey, setSelectedKey] = useState("");
  const selectedIndex = useRef(0);
  const [editor] = useLexicalComposerContext();

  function scrollToNode(key, currIndex) {
    editor.getEditorState().read(() => {
      const domElement = editor.getElementByKey(key);
      if (domElement !== null) {
        domElement.scrollIntoView();
        setSelectedKey(key);
        selectedIndex.current = currIndex;
      }
    });
  }

  useEffect(() => {
    function scrollCallback() {
      if (
        tableOfContents.length !== 0 &&
        selectedIndex.current < tableOfContents.length - 1
      ) {
        let currentHeading = editor.getElementByKey(
          tableOfContents[selectedIndex.current][0]
        );
        if (currentHeading !== null) {
          if (isHeadingBelowTheTopOfThePage(currentHeading)) {
            //On natural scroll, user is scrolling up
            while (
              currentHeading !== null &&
              isHeadingBelowTheTopOfThePage(currentHeading) &&
              selectedIndex.current > 0
            ) {
              const prevHeading = editor.getElementByKey(
                tableOfContents[selectedIndex.current - 1][0]
              );
              if (
                prevHeading !== null &&
                (isHeadingAboveViewport(prevHeading) ||
                  isHeadingBelowTheTopOfThePage(prevHeading))
              ) {
                selectedIndex.current--;
              }
              currentHeading = prevHeading;
            }
            const prevHeadingKey = tableOfContents[selectedIndex.current][0];
            setSelectedKey(prevHeadingKey);
          } else if (isHeadingAboveViewport(currentHeading)) {
            //On natural scroll, user is scrolling down
            while (
              currentHeading !== null &&
              isHeadingAboveViewport(currentHeading) &&
              selectedIndex.current < tableOfContents.length - 1
            ) {
              const nextHeading = editor.getElementByKey(
                tableOfContents[selectedIndex.current + 1][0]
              );
              if (
                nextHeading !== null &&
                (isHeadingAtTheTopOfThePage(nextHeading) ||
                  isHeadingAboveViewport(nextHeading))
              ) {
                selectedIndex.current++;
              }
              currentHeading = nextHeading;
            }
            const nextHeadingKey = tableOfContents[selectedIndex.current][0];
            setSelectedKey(nextHeadingKey);
          }
        }
      } else {
        selectedIndex.current = 0;
      }
    }
    let timerId;

    function debounceFunction(func, delay) {
      clearTimeout(timerId);
      timerId = setTimeout(func, delay);
    }

    function onScroll() {
      debounceFunction(scrollCallback, 10);
    }

    document.addEventListener("scroll", onScroll);
    return () => document.removeEventListener("scroll", onScroll);
  }, [tableOfContents, editor]);

  return (
    <div className="table-of-contents">
      <ul className="headings">
        {tableOfContents.map(([key, text, tag], index) => {
          if (index === 0) {
            return (
              <div className="normal-heading-wrapper" key={key}>
                <div
                  className="first-heading"
                  onClick={() => scrollToNode(key, index)}
                  role="button"
                  tabIndex={0}
                >
                  {("" + text).length > 20
                    ? text.substring(0, 20) + "..."
                    : text}
                </div>
                <br />
              </div>
            );
          } else {
            return (
              <div
                className={`normal-heading-wrapper ${
                  selectedKey === key ? "selected-heading-wrapper" : ""
                }`}
                key={key}
              >
                <div
                  onClick={() => scrollToNode(key, index)}
                  role="button"
                  className={indent(tag)}
                  tabIndex={0}
                >
                  <li
                    className={`normal-heading ${
                      selectedKey === key ? "selected-heading" : ""
                    }
                    `}
                  >
                    {("" + text).length > 27
                      ? text.substring(0, 27) + "..."
                      : text}
                  </li>
                </div>
              </div>
            );
          }
        })}
      </ul>
    </div>
  );
}

export default function TableOfContentsPlugin() {
  return (
    <LexicalTableOfContentsPlugin>
      {(tableOfContents) => {
        return <TableOfContentsList tableOfContents={tableOfContents} />;
      }}
    </LexicalTableOfContentsPlugin>
  );
}
