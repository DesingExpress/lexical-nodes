/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  INSERT_TABLE_COMMAND,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table";
import { Button, DialogActions, TextField } from "@mui/material";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import invariant from "../../shared/invariant";

export const CellContext = createContext({
  cellEditorConfig: null,
  cellEditorPlugins: null,
  set: () => {},
});

export function TableContext({ children }) {
  const [contextValue, setContextValue] = useState({
    cellEditorConfig: null,
    cellEditorPlugins: null,
  });
  return (
    <CellContext.Provider
      value={useMemo(
        () => ({
          cellEditorConfig: contextValue.cellEditorConfig,
          cellEditorPlugins: contextValue.cellEditorPlugins,
          set: (cellEditorConfig, cellEditorPlugins) => {
            setContextValue({ cellEditorConfig, cellEditorPlugins });
          },
        }),
        [contextValue.cellEditorConfig, contextValue.cellEditorPlugins]
      )}
    >
      {children}
    </CellContext.Provider>
  );
}

// export function InsertTableDialog({ activeEditor, onClose }) {
//   const [rows, setRows] = useState("5");
//   const [columns, setColumns] = useState("5");
//   const [isDisabled, setIsDisabled] = useState(true);

//   useEffect(() => {
//     const row = Number(rows);
//     const column = Number(columns);
//     if (row && row > 0 && row <= 500 && column && column > 0 && column <= 50) {
//       setIsDisabled(false);
//     } else {
//       setIsDisabled(true);
//     }
//   }, [rows, columns]);

//   const onClick = () => {
//     activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
//       columns,
//       rows,
//     });

//     onClose();
//   };

//   return (
//     <>
//       <TextField
//         placeholder={"# of rows (1-500)"}
//         label="Rows"
//         onChange={setRows}
//         value={rows}
//         data-test-id="table-modal-rows"
//         type="number"
//       />
//       <TextField
//         placeholder={"# of columns (1-50)"}
//         label="Columns"
//         onChange={setColumns}
//         value={columns}
//         data-test-id="table-modal-columns"
//         type="number"
//       />
//       <DialogActions data-test-id="table-model-confirm-insert">
//         <Button disabled={isDisabled} onClick={onClick}>
//           Confirm
//         </Button>
//       </DialogActions>
//     </>
//   );
// }

export function TablePlugin({ cellEditorConfig, children }) {
  const [editor] = useLexicalComposerContext();
  const cellContext = useContext(CellContext);

  useEffect(() => {
    if (!editor.hasNodes([TableNode, TableRowNode, TableCellNode])) {
      invariant(
        false,
        "TablePlugin: TableNode, TableRowNode, or TableCellNode is not registered on editor"
      );
    }
  }, [editor]);

  useEffect(() => {
    cellContext.set(cellEditorConfig, children);
  }, [cellContext, cellEditorConfig, children]);
  return null;
}
