// /**
//  * Copyright (c) Meta Platforms, Inc. and affiliates.
//  *
//  * This source code is licensed under the MIT license found in the
//  * LICENSE file in the root directory of this source tree.
//  *
//  */
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useLexicalEditable from "@lexical/react/useLexicalEditable";
import {
  $deleteTableColumn,
  $getElementForTableNode,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumn,
  $insertTableRow,
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  $removeTableRowAtIndex,
  getTableObserverFromTableElement,
  TableCellHeaderStates,
  TableCellNode,
} from "@lexical/table";
import { $getRoot, $getSelection, $isRangeSelection } from "lexical";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Divider, dividerClasses, styled } from "@mui/material";

const TableCellActionMenuButton = styled("div")(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  willChange: "transform",
  [`& .table-cell-action-button-container--active`]: {
    pointerEvents: "auto",
    opacity: 1,
  },
  [`& .table-cell-action-button-container--inactive`]: {
    pointerEvents: "none",
    opacity: 0,
  },
  [`& > .table-cell-action-button`]: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: "5px",
    border: 0,
    position: "absolute",
    top: "0 !important",
    right: "0 !important",
    borderRadius: "15px",
    color: "#222",
    cursor: "pointer",
    // [`& > .chevron-down`]: {
    //   width: "8px",
    //   height: "8px",
    //   display: "inline-block",
    //   backgroundColor: "transparent",
    //   backgroundSize: "contain",
    //   backgroundImage: `url(images/icons/chevron-down.svg)`
    // },
  },
}));

const DropDownContainer = styled("div")(({ theme }) => ({
  zIndex: 100,
  display: "flex",
  flexDirection: "column",
  position: "fixed",
  boxShadow: `0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5)`,
  borderRadius: "8px",
  minHeight: "40px",
  backgroundColor: "#fff",
  [`& > button.item`]: {
    margin: "0 8px",
    padding: "8px",
    color: "#050505",
    cursor: "pointer",
    lineHeight: "16px",
    fontSize: "15px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-betwee",
    alignContent: "center",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: 0,
    maxWidth: "250px",
    minWidth: "100px",
    [`& > .active`]: {
      display: "flex",
      width: "20px",
      height: "20px",
      backgroundSize: "contain",
    },
    [`&:first-of-type`]: {
      marginTop: "8px",
    },
    [`&:last-of-type`]: {
      marginBottom: "8px",
    },
    [`&:hover`]: {
      backgroundColor: "#eee",
    },
    [`& > .text`]: {
      display: "flex",
      lineHeight: "20px",
      flexGrow: "1",
      minWidth: "150px",
    },
    [`& > .icon`]: {
      display: "flex",
      width: "20px",
      height: "20px",
      userSelect: "none",
      marginRight: "12px",
      lineHeight: "16px",
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repaet",
    },
  },
  [`& > .${dividerClasses.root}`]: {
    width: "auto",
    backgroundColor: "#eee",
    margin: "4px 8px",
    height: "1px",
  },
}));

function TableActionMenu({
  onClose,
  tableCellNode: _tableCellNode,
  setIsMenuOpen,
  contextRef,
}) {
  const [editor] = useLexicalComposerContext();
  const dropDownRef = useRef(null);
  const [tableCellNode, updateTableCellNode] = useState(_tableCellNode);
  const [selectionCounts, updateSelectionCounts] = useState({
    columns: 1,
    rows: 1,
  });

  useEffect(() => {
    return editor.registerMutationListener(TableCellNode, (nodeMutations) => {
      const nodeUpdated =
        nodeMutations.get(tableCellNode.getKey()) === "updated";

      if (nodeUpdated) {
        editor.getEditorState().read(() => {
          updateTableCellNode(tableCellNode.getLatest());
        });
      }
    });
  }, [editor, tableCellNode]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isTableSelection(selection)) {
        const selectionShape = selection.getShape();

        updateSelectionCounts({
          columns: selectionShape.toX - selectionShape.fromX + 1,
          rows: selectionShape.toY - selectionShape.fromY + 1,
        });
      }
    });
  }, [editor]);

  useEffect(() => {
    const menuButtonElement = contextRef.current;
    const dropDownElement = dropDownRef.current;

    if (menuButtonElement !== null && dropDownElement !== null) {
      const menuButtonRect = menuButtonElement.getBoundingClientRect();

      dropDownElement.style.opacity = "1";
      dropDownElement.style.position = "fixed";
      dropDownElement.style.left = `${menuButtonRect.right + 5}px`;
      dropDownElement.style.top = `${menuButtonRect.top}px`;
      // fixed 요소이기에 pageXOffset, pageYOffset 더할 필요가 없어서 삭제
      // pageXOffset, pageYOffset는 현재 deprecated 상태
      // getBoundingClientRect() 자체가 뷰포트 기준 좌표를 반환하므로, 불필요하게 window offset을 추가할 필요 없음
    }
  }, [contextRef, dropDownRef]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropDownRef.current !== null &&
        contextRef.current !== null &&
        !dropDownRef.current.contains(event.target) &&
        !contextRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("click", handleClickOutside);

    return () => window.removeEventListener("click", handleClickOutside);
  }, [setIsMenuOpen, contextRef]);

  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const tableElement = editor.getElementByKey(tableNode.getKey());

        if (!tableElement) {
          throw new Error("Expected to find tableElement in DOM");
        }

        const tableSelection = getTableObserverFromTableElement(tableElement);
        if (tableSelection !== null) {
          tableSelection.$clearHighlight();
        }

        tableNode.markDirty();
        updateTableCellNode(tableCellNode.getLatest());
      }

      const rootNode = $getRoot();
      rootNode.selectStart();
    });
  }, [editor, tableCellNode]);

  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter) => {
      editor.update(() => {
        const selection = $getSelection();

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

        let tableRowIndex;

        if ($isTableSelection(selection)) {
          const selectionShape = selection.getShape();
          tableRowIndex = shouldInsertAfter
            ? selectionShape.toY
            : selectionShape.fromY;
        } else {
          tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
        }

        const grid = $getElementForTableNode(editor, tableNode);

        $insertTableRow(
          tableNode,
          tableRowIndex,
          shouldInsertAfter,
          selectionCounts.rows,
          grid
        );

        clearTableSelection();

        onClose();
      });
    },
    [editor, tableCellNode, selectionCounts.rows, clearTableSelection, onClose]
  );

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter) => {
      editor.update(() => {
        const selection = $getSelection();

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

        let tableColumnIndex;

        if ($isTableSelection(selection)) {
          const selectionShape = selection.getShape();
          tableColumnIndex = shouldInsertAfter
            ? selectionShape.toX
            : selectionShape.fromX;
        } else {
          tableColumnIndex =
            $getTableColumnIndexFromTableCellNode(tableCellNode);
        }

        const grid = $getElementForTableNode(editor, tableNode);

        $insertTableColumn(
          tableNode,
          tableColumnIndex,
          shouldInsertAfter,
          selectionCounts.columns,
          grid
        );

        clearTableSelection();

        onClose();
      });
    },
    [
      editor,
      tableCellNode,
      selectionCounts.columns,
      clearTableSelection,
      onClose,
    ]
  );

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

      $removeTableRowAtIndex(tableNode, tableRowIndex);

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      tableNode.remove();

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      const tableColumnIndex =
        $getTableColumnIndexFromTableCellNode(tableCellNode);

      $deleteTableColumn(tableNode, tableColumnIndex);

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
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

      tableRow.getChildren().forEach((tableCell) => {
        if (!$isTableCellNode(tableCell)) {
          throw new Error("Expected table cell");
        }

        tableCell.toggleHeaderStyle(TableCellHeaderStates.ROW);
      });

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleTableColumnIsHeader = useCallback(() => {
    editor.update(() => {
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

        tableCell.toggleHeaderStyle(TableCellHeaderStates.COLUMN);
      }

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <DropDownContainer
      className="dropdown"
      ref={dropDownRef}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <button className="item" onClick={() => insertTableRowAtSelection(false)}>
        <span className="text">
          Insert{" "}
          {selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`}{" "}
          above
        </span>
      </button>
      <button className="item" onClick={() => insertTableRowAtSelection(true)}>
        <span className="text">
          Insert{" "}
          {selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`}{" "}
          below
        </span>
      </button>
      <Divider />
      <button
        className="item"
        onClick={() => insertTableColumnAtSelection(false)}
      >
        <span className="text">
          Insert{" "}
          {selectionCounts.columns === 1
            ? "column"
            : `${selectionCounts.columns} columns`}{" "}
          left
        </span>
      </button>
      <button
        className="item"
        onClick={() => insertTableColumnAtSelection(true)}
      >
        <span className="text">
          Insert{" "}
          {selectionCounts.columns === 1
            ? "column"
            : `${selectionCounts.columns} columns`}{" "}
          right
        </span>
      </button>
      <Divider />
      <button className="item" onClick={() => deleteTableColumnAtSelection()}>
        <span className="text">Delete column</span>
      </button>
      <button className="item" onClick={() => deleteTableRowAtSelection()}>
        <span className="text">Delete row</span>
      </button>
      <button className="item" onClick={() => deleteTableAtSelection()}>
        <span className="text">Delete table</span>
      </button>
      <Divider />
      <button className="item" onClick={() => toggleTableRowIsHeader()}>
        <span className="text">
          {(tableCellNode.__headerState & TableCellHeaderStates.ROW) ===
          TableCellHeaderStates.ROW
            ? "Remove"
            : "Add"}{" "}
          row header
        </span>
      </button>
      <button className="item" onClick={() => toggleTableColumnIsHeader()}>
        <span className="text">
          {(tableCellNode.__headerState & TableCellHeaderStates.COLUMN) ===
          TableCellHeaderStates.COLUMN
            ? "Remove"
            : "Add"}{" "}
          column header
        </span>
      </button>
    </DropDownContainer>,
    document.body
  );
}

function TableCellActionMenuContainer({ anchorElem, cellMerge }) {
  const [editor] = useLexicalComposerContext();

  const menuButtonRef = useRef(null);
  const menuRootRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [tableCellNode, setTableMenuCellNode] = useState(null);
  const moveMenu = useCallback(() => {
    const menu = menuButtonRef.current;
    const selection = $getSelection();
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (selection === null || menu === null) {
      setTableMenuCellNode(null);
      return;
    }

    const rootElement = editor.getRootElement();

    if (
      $isRangeSelection(selection) &&
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode()
      );
      if (tableCellNodeFromSelection === null) {
        setTableMenuCellNode(null);
        return;
      }

      const tableCellParentNodeDOM = editor.getElementByKey(
        tableCellNodeFromSelection.getKey()
      );
      if (tableCellParentNodeDOM === null) {
        setTableMenuCellNode(null);
        return;
      }

      setTableMenuCellNode(tableCellNodeFromSelection);
    } else if (!activeElement) {
      setTableMenuCellNode(null);
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        moveMenu();
      });
    });
  });

  useEffect(() => {
    const menuButtonDOM = menuButtonRef.current;

    if (menuButtonDOM !== null && tableCellNode != null) {
      const tableCellNodeDOM = editor.getElementByKey(tableCellNode.getKey());

      if (tableCellNodeDOM !== null) {
        const tableCellRect = tableCellNodeDOM.getBoundingClientRect();
        const menuRect = menuButtonDOM.getBoundingClientRect();
        const anchorRect = anchorElem.getBoundingClientRect();

        menuButtonDOM.style.opacity = "1";

        menuButtonDOM.style.left = `${
          tableCellRect.right - menuRect.width - 10 - anchorRect.left
        }px`;

        menuButtonDOM.style.top = `${tableCellRect.top - anchorRect.top + 4}px`;
      } else {
        menuButtonDOM.style.opacity = "0";
      }
    }
  }, [menuButtonRef, tableCellNode, editor, anchorElem]);

  const prevTableCellDOM = useRef(tableCellNode);

  useEffect(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false);
    }

    prevTableCellDOM.current = tableCellNode;
  }, [prevTableCellDOM, tableCellNode]);
  return (
    <TableCellActionMenuButton
      className="table-cell-action-button-container"
      ref={menuButtonRef}
    >
      {tableCellNode !== null && (
        <>
          <button
            className="table-cell-action-button chevron-down"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            ref={menuRootRef}
          >
            <KeyboardArrowDownIcon
              style={{ opacity: 0.4, width: "18px", height: "16px" }}
            />
          </button>
          {isMenuOpen && (
            <TableActionMenu
              contextRef={menuRootRef}
              setIsMenuOpen={setIsMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              tableCellNode={tableCellNode}
              cellMerge={cellMerge}
            />
          )}
        </>
      )}
    </TableCellActionMenuButton>
  );
}

export default function TableActionMenuPlugin({
  anchorElem = document.body,
  cellMerge = false,
}) {
  const isEditable = useLexicalEditable();

  return createPortal(
    isEditable ? (
      <TableCellActionMenuContainer
        anchorElem={anchorElem}
        cellMerge={cellMerge}
      />
    ) : null,
    anchorElem
  );
}
