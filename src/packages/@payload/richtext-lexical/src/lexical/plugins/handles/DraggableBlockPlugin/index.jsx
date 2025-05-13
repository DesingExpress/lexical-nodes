"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext.js";
import { eventFiles } from "@lexical/rich-text";
import { $getNearestNodeFromDOMNode, $getNodeByKey } from "lexical";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditorConfigContext } from "../../../../../../../../Component/Lexical/proxy.js";
// import { useEditorConfigContext } from '../../../config/client/EditorConfigProvider.js'
import { isHTMLElement } from "../../../utils/guard.js";
import { Point } from "../../../utils/point.js";
import { calculateDistanceFromScrollerElem } from "../utils/calculateDistanceFromScrollerElem.js";
import { getNodeCloseToPoint } from "../utils/getNodeCloseToPoint.js";
import { getTopLevelNodeKeys } from "../utils/getTopLevelNodeKeys.js";
import { isOnHandleElement } from "../utils/isOnHandleElement.js";
import { setHandlePosition } from "../utils/setHandlePosition.js";
import { getBoundingClientRectWithoutTransform } from "./getBoundingRectWithoutTransform.js";
import "./index.scss";
import { setTargetLine } from "./setTargetLine.js";
const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";
const DRAG_DATA_FORMAT = "application/x-lexical-drag-block";
let prevIndex = Infinity;
function getCurrentIndex(keysLength) {
  if (keysLength === 0) {
    return Infinity;
  }
  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex;
  }
  return Math.floor(keysLength / 2);
}
function setDragImage(dataTransfer, draggableBlockElem) {
  const { transform } = draggableBlockElem.style;
  // Remove dragImage borders
  dataTransfer.setDragImage(draggableBlockElem, 0, 0);
  setTimeout(() => {
    draggableBlockElem.style.transform = transform;
  });
}
function hideTargetLine(targetLineElem, lastTargetBlockElem) {
  if (targetLineElem) {
    targetLineElem.style.opacity = "0";
  }
  if (lastTargetBlockElem) {
    lastTargetBlockElem.style.opacity = "";
    // Delete marginBottom and marginTop values we set
    lastTargetBlockElem.style.marginBottom = "";
    lastTargetBlockElem.style.marginTop = "";
    //lastTargetBlock.style.border = 'none'
  }
}
function useDraggableBlockMenu(editor, anchorElem, isEditable) {
  var _a, _b;
  const scrollerElem = anchorElem.parentElement;
  const menuRef = useRef(null);
  const targetLineRef = useRef(null);
  const debugHighlightRef = useRef(null);
  const isDraggingBlockRef = useRef(false);
  const [draggableBlockElem, setDraggableBlockElem] = useState(null);
  const [lastTargetBlock, setLastTargetBlock] = useState(null);
  const { editorConfig } = useEditorConfigContext();
  const blockHandleHorizontalOffset = (
    (_a =
      editorConfig === null || editorConfig === void 0
        ? void 0
        : editorConfig.admin) === null || _a === void 0
      ? void 0
      : _a.hideGutter
  )
    ? -44
    : -8;
  useEffect(() => {
    /**
     * Handles positioning of the drag handle
     */
    function onDocumentMouseMove(event) {
      const target = event.target;
      if (!isHTMLElement(target)) {
        return;
      }
      const distanceFromScrollerElem = calculateDistanceFromScrollerElem(
        scrollerElem,
        event.pageX,
        event.pageY,
        target
      );
      if (distanceFromScrollerElem === -1) {
        setDraggableBlockElem(null);
        return;
      }
      if (isOnHandleElement(target, DRAGGABLE_BLOCK_MENU_CLASSNAME)) {
        return;
      }
      const topLevelNodeKeys = getTopLevelNodeKeys(editor);
      const {
        blockElem: _draggableBlockElem,
        foundAtIndex,
        isFoundNodeEmptyParagraph,
      } = getNodeCloseToPoint({
        anchorElem,
        cache_threshold: 0,
        editor,
        horizontalOffset: -distanceFromScrollerElem,
        point: new Point(event.x, event.y),
        startIndex: getCurrentIndex(topLevelNodeKeys.length),
        useEdgeAsDefault: false,
        verbose: false,
      });
      prevIndex = foundAtIndex;
      //if (DEBUG && _draggableBlockElem) {
      //targetBlockElem.style.border = '3px solid red'
      // highlightElemOriginalPosition(debugHighlightRef, _draggableBlockElem, anchorElem)
      //}
      if (!_draggableBlockElem && !isFoundNodeEmptyParagraph) {
        return;
      }
      if (draggableBlockElem !== _draggableBlockElem) {
        setDraggableBlockElem(_draggableBlockElem);
      }
    }
    // Since the draggableBlockElem is outside the actual editor, we need to listen to the document
    // to be able to detect when the mouse is outside the editor and respect a buffer around
    // the scrollerElem to avoid the draggableBlockElem disappearing too early.
    document === null || document === void 0
      ? void 0
      : document.addEventListener("mousemove", onDocumentMouseMove);
    return () => {
      document === null || document === void 0
        ? void 0
        : document.removeEventListener("mousemove", onDocumentMouseMove);
    };
  }, [scrollerElem, anchorElem, editor, draggableBlockElem]);
  useEffect(() => {
    if (menuRef.current) {
      setHandlePosition(
        draggableBlockElem,
        menuRef.current,
        anchorElem,
        blockHandleHorizontalOffset
      );
    }
  }, [anchorElem, draggableBlockElem, blockHandleHorizontalOffset]);
  useEffect(() => {
    function onDragover(event) {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = eventFiles(event);
      if (isFileTransfer) {
        return false;
      }
      const { pageY, target } = event;
      if (!isHTMLElement(target)) {
        return false;
      }
      const distanceFromScrollerElem = calculateDistanceFromScrollerElem(
        scrollerElem,
        event.pageX,
        event.pageY,
        target,
        100,
        50
      );
      const topLevelNodeKeys = getTopLevelNodeKeys(editor);
      const {
        blockElem: targetBlockElem,
        foundAtIndex,
        isFoundNodeEmptyParagraph,
      } = getNodeCloseToPoint({
        anchorElem,
        editor,
        fuzzy: true,
        horizontalOffset: -distanceFromScrollerElem,
        point: new Point(event.x, event.y),
        startIndex: getCurrentIndex(topLevelNodeKeys.length),
        useEdgeAsDefault: true,
        verbose: true,
      });
      prevIndex = foundAtIndex;
      const targetLineElem = targetLineRef.current;
      // targetBlockElem === null shouldn't happen
      if (targetBlockElem === null || targetLineElem === null) {
        return false;
      }
      if (draggableBlockElem !== targetBlockElem) {
        const { isBelow, willStayInSamePosition } = setTargetLine(
          (
            (_a =
              editorConfig === null || editorConfig === void 0
                ? void 0
                : editorConfig.admin) === null || _a === void 0
              ? void 0
              : _a.hideGutter
          )
            ? "0px"
            : "3rem",
          blockHandleHorizontalOffset +
            ((
              (_b =
                editorConfig === null || editorConfig === void 0
                  ? void 0
                  : editorConfig.admin) === null || _b === void 0
                ? void 0
                : _b.hideGutter
            )
              ? (_e =
                  (_d =
                    (_c =
                      menuRef === null || menuRef === void 0
                        ? void 0
                        : menuRef.current) === null || _c === void 0
                      ? void 0
                      : _c.getBoundingClientRect()) === null || _d === void 0
                    ? void 0
                    : _d.width) !== null && _e !== void 0
                ? _e
                : 0
              : -((_h =
                  (_g =
                    (_f =
                      menuRef === null || menuRef === void 0
                        ? void 0
                        : menuRef.current) === null || _f === void 0
                      ? void 0
                      : _f.getBoundingClientRect()) === null || _g === void 0
                    ? void 0
                    : _g.width) !== null && _h !== void 0
                  ? _h
                  : 0)),
          targetLineElem,
          targetBlockElem,
          lastTargetBlock,
          pageY,
          anchorElem,
          event,
          debugHighlightRef,
          isFoundNodeEmptyParagraph
        );
        // Prevent default event to be able to trigger onDrop events
        // Calling preventDefault() adds the green plus icon to the cursor,
        // indicating that the drop is allowed.
        event.preventDefault();
        if (!willStayInSamePosition) {
          setLastTargetBlock({
            boundingBox: targetBlockElem.getBoundingClientRect(),
            elem: targetBlockElem,
            isBelow,
          });
        }
      } else if (
        lastTargetBlock === null || lastTargetBlock === void 0
          ? void 0
          : lastTargetBlock.elem
      ) {
        hideTargetLine(targetLineElem, lastTargetBlock.elem);
        setLastTargetBlock({
          boundingBox: targetBlockElem.getBoundingClientRect(),
          elem: targetBlockElem,
          isBelow: false,
        });
      }
      return true;
    }
    function onDrop(event) {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = eventFiles(event);
      if (isFileTransfer) {
        return false;
      }
      const { dataTransfer, pageY, target } = event;
      const dragData =
        (dataTransfer === null || dataTransfer === void 0
          ? void 0
          : dataTransfer.getData(DRAG_DATA_FORMAT)) || "";
      editor.update(() => {
        const draggedNode = $getNodeByKey(dragData);
        if (!draggedNode) {
          return false;
        }
        if (!isHTMLElement(target)) {
          return false;
        }
        const distanceFromScrollerElem = calculateDistanceFromScrollerElem(
          scrollerElem,
          event.pageX,
          event.pageY,
          target,
          100,
          50
        );
        const { blockElem: targetBlockElem, isFoundNodeEmptyParagraph } =
          getNodeCloseToPoint({
            anchorElem,
            editor,
            fuzzy: true,
            horizontalOffset: -distanceFromScrollerElem,
            point: new Point(event.x, event.y),
            useEdgeAsDefault: true,
          });
        if (!targetBlockElem) {
          return false;
        }
        const targetNode = $getNearestNodeFromDOMNode(targetBlockElem);
        if (!targetNode) {
          return false;
        }
        if (targetNode === draggedNode) {
          return true;
        }
        const { height: targetBlockElemHeight, top: targetBlockElemTop } =
          getBoundingClientRectWithoutTransform(targetBlockElem);
        const mouseY = pageY;
        const isBelow =
          mouseY >=
          targetBlockElemTop + targetBlockElemHeight / 2 + window.scrollY;
        if (!isFoundNodeEmptyParagraph) {
          if (isBelow) {
            // below targetBlockElem
            targetNode.insertAfter(draggedNode);
          } else {
            // above targetBlockElem
            targetNode.insertBefore(draggedNode);
          }
        } else {
          //
          targetNode.insertBefore(draggedNode);
          targetNode.remove();
        }
        /*
                if (pageY >= targetBlockElemTop + targetBlockElemHeight / 2) {
                  targetNode.insertAfter(draggedNode)
                } else {
                  targetNode.insertBefore(draggedNode)
                }*/
        if (draggableBlockElem !== null) {
          setDraggableBlockElem(null);
        }
        // find all previous elements with lexical-block-highlighter class and remove them
        const allPrevHighlighters = document.querySelectorAll(
          ".lexical-block-highlighter"
        );
        allPrevHighlighters.forEach((highlighter) => {
          highlighter.remove();
        });
        const newInsertedElem = editor.getElementByKey(draggedNode.getKey());
        setTimeout(() => {
          // add new temp html element to newInsertedElem with the same height and width and the class block-selected
          // to highlight the new inserted element
          const newInsertedElemRect =
            newInsertedElem === null || newInsertedElem === void 0
              ? void 0
              : newInsertedElem.getBoundingClientRect();
          if (!newInsertedElemRect) {
            return;
          }
          const highlightElem = document.createElement("div");
          highlightElem.className = "lexical-block-highlighter";
          highlightElem.style.backgroundColor = "var(--theme-elevation-1000";
          highlightElem.style.transition = "opacity 0.5s ease-in-out";
          highlightElem.style.zIndex = "1";
          highlightElem.style.pointerEvents = "none";
          highlightElem.style.boxSizing = "border-box";
          highlightElem.style.borderRadius = "4px";
          highlightElem.style.position = "absolute";
          document.body.appendChild(highlightElem);
          highlightElem.style.opacity = "0.1";
          highlightElem.style.height = `${newInsertedElemRect.height + 8}px`;
          highlightElem.style.width = `${newInsertedElemRect.width + 8}px`;
          highlightElem.style.top = `${
            newInsertedElemRect.top + window.scrollY - 4
          }px`;
          highlightElem.style.left = `${newInsertedElemRect.left - 4}px`;
          setTimeout(() => {
            highlightElem.style.opacity = "0";
            setTimeout(() => {
              highlightElem.remove();
            }, 500);
          }, 1000);
        }, 120);
      });
      return true;
    }
    // register onDragover event listeners:
    document.addEventListener("dragover", onDragover);
    // register onDrop event listeners:
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragover);
      document.removeEventListener("drop", onDrop);
    };
  }, [
    scrollerElem,
    blockHandleHorizontalOffset,
    anchorElem,
    editor,
    lastTargetBlock,
    draggableBlockElem,
    (_b =
      editorConfig === null || editorConfig === void 0
        ? void 0
        : editorConfig.admin) === null || _b === void 0
      ? void 0
      : _b.hideGutter,
  ]);
  function onDragStart(event) {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer || !draggableBlockElem) {
      return;
    }
    setDragImage(dataTransfer, draggableBlockElem);
    let nodeKey = "";
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem);
      if (node) {
        nodeKey = node.getKey();
      }
    });
    isDraggingBlockRef.current = true;
    dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
  }
  function onDragEnd() {
    isDraggingBlockRef.current = false;
    if (
      lastTargetBlock === null || lastTargetBlock === void 0
        ? void 0
        : lastTargetBlock.elem
    ) {
      hideTargetLine(
        targetLineRef.current,
        lastTargetBlock === null || lastTargetBlock === void 0
          ? void 0
          : lastTargetBlock.elem
      );
    }
  }
  return createPortal(
    <React.Fragment>
      <div
        className="icon draggable-block-menu"
        draggable
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        ref={menuRef}
      >
        <div className={isEditable ? "icon" : ""} />
      </div>
      <div className="draggable-block-target-line" ref={targetLineRef} />
      <div className="debug-highlight" ref={debugHighlightRef} />
    </React.Fragment>,
    anchorElem
  );
}
export function DraggableBlockPlugin({ anchorElem = document.body }) {
  const [editor] = useLexicalComposerContext();
  return useDraggableBlockMenu(editor, anchorElem, editor._editable);
}
