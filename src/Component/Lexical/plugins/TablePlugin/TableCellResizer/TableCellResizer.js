/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { styled } from "@mui/material";
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  COMMAND_PRIORITY_HIGH,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  // getDOMCellFromTarget,
} from "@lexical/table";
import useLexicalEditable from "@lexical/react/useLexicalEditable";
import { calculateZoomLevel } from "@lexical/utils";

const StyledTableCellResizer = styled("div")(({ theme }) => ({
  position: "absolute",
  zIndex: 999,
  pointerEvents: "auto",
}));

// 기존 getDOMCellFromTarget가 인자로 받아오는 target, 즉 <td> <th> 요소를 제대로 찾지못하여 새로 작성
function getDOMCellFromTarget(target) {
  let element = target;
  while (element && element !== document.body) {
    if (element.tagName === "TD" || element.tagName === "TH") {
      return { elem: element };
    }
    element = element.parentElement;
  }
  return null;
}

const MIN_ROW_HEIGHT = 33;
const MIN_COLUMN_WIDTH = 50;

function TableCellResizer({ editor }) {
  const targetRef = useRef(null);
  const resizerRef = useRef(null);
  const tableRectRef = useRef(null);

  const mouseStartPosRef = useRef(null);
  const [mouseCurrentPos, updateMouseCurrentPos] = useState(null);

  const [activeCell, updateActiveCell] = useState(null);
  const [isSelectingGrid, updateIsSelectingGrid] = useState(false);
  const [draggingDirection, updateDraggingDirection] = useState(null);

  // const [tableRect, setTableRect] = useState(null);
  // const [, forceUpdate] = useState(0);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (payload) => {
        const selection = $getSelection();
        const isGridSelection = $isTableSelection(selection);
        if (isSelectingGrid !== isGridSelection) {
          updateIsSelectingGrid(isGridSelection);
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  });

  const resetState = useCallback(() => {
    updateActiveCell(null);
    targetRef.current = null;
    updateDraggingDirection(null);
    mouseStartPosRef.current = null;
    tableRectRef.current = null;
  }, []);

  useEffect(() => {
    const onMouseMove = (event) => {
      requestAnimationFrame(() => {
        const target = event.target;

        if (draggingDirection) {
          updateMouseCurrentPos({
            x: event.clientX,
            y: event.clientY,
          });
          return;
        }

        if (resizerRef.current && resizerRef.current.contains(target)) {
          return;
        }
        if (targetRef.current !== target) {
          targetRef.current = target;
          const cell = getDOMCellFromTarget(target);
          if (cell) {
            editor.update(() => {
              const tableCellNode = $getNearestNodeFromDOMNode(cell.elem);
              if (!tableCellNode) {
                throw new Error("TableCellResizer: Table cell node not found.");
              }

              const tableNode =
                $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
              const tableElement = editor.getElementByKey(tableNode.getKey());

              if (!tableElement) {
                throw new Error("TableCellResizer: Table element not found.");
              }

              targetRef.current = target;
              tableRectRef.current = tableElement.getBoundingClientRect();
              // setTableRect(tableElement.getBoundingClientRect());
              updateActiveCell(cell);
            });
          } else {
            // console.warn("TableCellResizer: No cell found for target", target);
            //   resetState();
          }
        }
      }, []);
    };

    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [activeCell, draggingDirection, editor]);

  const isHeightChanging = (direction) => {
    if (direction === "bottom") return true;
    return false;
  };

  const updateRowHeight = useCallback(
    (newHeight) => {
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }

      editor.update(() => {
        const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
        if (!$isTableCellNode(tableCellNode)) {
          throw new Error("TableCellResizer: Table cell node not found.");
        }

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

        const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

        const tableRows = tableNode.getChildren();

        if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
          throw new Error("Expected table cell to be inside of table row.");
        }

        const tableRow = tableRows[tableRowIndex];

        if (!$isTableRowNode(tableRow)) {
          throw new Error("Expected table row");
        }

        tableRow.setHeight(newHeight);
      });
    },
    [activeCell, editor]
  );

  const updateColumnWidth = useCallback(
    (newWidth) => {
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }
      editor.update(() => {
        const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
        if (!$isTableCellNode(tableCellNode)) {
          throw new Error("TableCellResizer: Table cell node not found.");
        }
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

        const tableColumnIndex =
          $getTableColumnIndexFromTableCellNode(tableCellNode);

        const tableRows = tableNode.getChildren();

        for (let r = 0; r < tableRows.length; r++) {
          const tableRow = tableRows[r];

          if (!$isTableRowNode(tableRow)) {
            throw new Error("Expected table row");
          }

          const tableCells = tableRow.getChildren();

          if (tableColumnIndex >= tableCells.length || tableColumnIndex < 0) {
            throw new Error("Expected table cell to be inside of table row.");
          }

          const tableCell = tableCells[tableColumnIndex];

          if (!$isTableCellNode(tableCell)) {
            throw new Error("Expected table cell");
          }

          tableCell.setWidth(newWidth);
        }
      });
    },
    [activeCell, editor]
  );

  const toggleResize = useCallback(
    (direction) => (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }

      if (draggingDirection === direction && mouseStartPosRef.current) {
        const { x, y } = mouseStartPosRef.current;

        if (!activeCell) {
          return;
        }

        const zoom = calculateZoomLevel(activeCell.elem);
        const { height, width } = activeCell.elem.getBoundingClientRect();
        const adjustedWidth = width / zoom;
        const adjustedHeight = height / zoom;

        if (isHeightChanging(direction)) {
          const heightChange = Math.abs((event.clientY - y) / zoom);
          const isShrinking = direction === "bottom" && y > event.clientY;

          updateRowHeight(
            Math.max(
              isShrinking
                ? adjustedHeight - heightChange
                : heightChange + adjustedHeight,
              MIN_ROW_HEIGHT
            )
          );
        } else {
          const widthChange = (event.clientX - x) / zoom;
          const isShrinking = direction === "right" && x > event.clientX;

          // updateColumnWidth(
          //   Math.max(
          //     isShrinking
          //       ? adjustedWidth - widthChange
          //       : widthChange + adjustedWidth,
          //     MIN_COLUMN_WIDTH
          //   )
          // );
          updateColumnWidth(
            Math.max(
              isShrinking
                ? adjustedWidth - Math.abs(widthChange)
                : adjustedWidth + widthChange,
              MIN_COLUMN_WIDTH
            )
          );
        }

        resetState();
      } else {
        mouseStartPosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
        updateMouseCurrentPos(mouseStartPosRef.current);
        updateDraggingDirection(direction);
      }
    },
    [
      activeCell,
      draggingDirection,
      resetState,
      updateColumnWidth,
      updateRowHeight,
    ]
  );

  const getResizers = useCallback(() => {
    if (!activeCell) return {};

    // if (activeCell) {
    const { height, width, top, left } =
      activeCell.elem.getBoundingClientRect();
    const zoom = calculateZoomLevel(activeCell.elem);
    const zoneWidth = 10; // Pixel width of the zone where you can drag the edge

    const styles = {
      bottom: {
        backgroundColor: "none",
        cursor: "row-resize",
        width: `${width / zoom}px`,
        height: `${zoneWidth}px`,
        left: `${left / zoom}px`,
        top: `${(top + height - zoneWidth / 2) / zoom}px`,
      },
      right: {
        backgroundColor: "none",
        cursor: "col-resize",
        width: `${zoneWidth}px`,
        height: `${height / zoom}px`,
        left: `${(left + width - zoneWidth / 2) / zoom}px`,
        top: `${top / zoom}px`,
      },
    };

    const tableRect = tableRectRef.current;

    if (draggingDirection && mouseCurrentPos) {
      if (isHeightChanging(draggingDirection)) {
        styles[draggingDirection].left = `${tableRect.left}px`;
        styles[draggingDirection].top = `${mouseCurrentPos.y / zoom}px`;
        styles[draggingDirection].width = `${tableRect.width}px`;
        styles[draggingDirection].height = "3px";
      } else {
        styles[draggingDirection].top = `${tableRect.top}px`;
        styles[draggingDirection].left = `${mouseCurrentPos.x / zoom}px`;
        styles[draggingDirection].height = `${tableRect.height}px`;
        styles[draggingDirection].width = "3px";
      }
      styles[draggingDirection].backgroundColor = "#adf";
    }

    return styles;
  }, [activeCell, draggingDirection, mouseCurrentPos]);

  useEffect(() => {
    console.log("resizerRef: ", resizerRef.current);
  }, [resizerRef]);

  // useEffect(() => {
  //   if (tableRectRef.current) {
  //     forceUpdate((prev) => prev + 1);
  //   }
  // }, [tableRectRef.current]);

  const resizerStyles = getResizers();
  return (
    <div ref={resizerRef}>
      {activeCell !== null && !isSelectingGrid && (
        <>
          <StyledTableCellResizer
            className="TableCellResizer__resizer TableCellResizer__ui"
            style={resizerStyles.right || undefined}
            onMouseDown={toggleResize("right")}
            onMouseUp={toggleResize("right")}
          />
          <StyledTableCellResizer
            className="TableCellResizer__resizer TableCellResizer__ui"
            style={resizerStyles.bottom || undefined}
            onMouseDown={toggleResize("bottom")}
            onMouseUp={toggleResize("bottom")}
          />
        </>
      )}
    </div>
  );
}

export default function TableCellResizerPlugin() {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();

  return useMemo(
    () =>
      isEditable
        ? createPortal(<TableCellResizer editor={editor} />, document.body)
        : null,
    [editor, isEditable]
  );
}
