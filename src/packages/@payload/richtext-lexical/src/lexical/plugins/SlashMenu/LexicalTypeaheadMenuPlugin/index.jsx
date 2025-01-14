"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext.js";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  createCommand,
} from "lexical";
import { useCallback, useEffect, useState } from "react";
import { LexicalMenu, useMenuAnchorRef } from "./LexicalMenu.jsx";
export const PUNCTUATION =
  "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
function getTextUpToAnchor(selection) {
  const anchor = selection.anchor;
  if (anchor.type !== "text") {
    return null;
  }
  const anchorNode = anchor.getNode();
  if (!anchorNode.isSimpleText()) {
    return null;
  }
  const anchorOffset = anchor.offset;
  return anchorNode.getTextContent().slice(0, anchorOffset);
}
function tryToPositionRange(leadOffset, range, editorWindow) {
  const domSelection = editorWindow.getSelection();
  if (domSelection === null || !domSelection.isCollapsed) {
    return false;
  }
  const anchorNode = domSelection.anchorNode;
  const startOffset = leadOffset;
  const endOffset = domSelection.anchorOffset;
  if (anchorNode == null || endOffset == null) {
    return false;
  }
  try {
    range.setStart(anchorNode, startOffset);
    // if endOffset is 0, positioning the range for when you click the plus button to open the slash menu will fial
    range.setEnd(anchorNode, endOffset > 1 ? endOffset : 1);
  } catch (error) {
    return false;
  }
  return true;
}
function getQueryTextForSearch(editor) {
  let text;
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }
    text = getTextUpToAnchor(selection);
  });
  return text;
}
function isSelectionOnEntityBoundary(editor, offset) {
  if (offset !== 0) {
    return false;
  }
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();
      const prevSibling = anchorNode.getPreviousSibling();
      return $isTextNode(prevSibling) && prevSibling.isTextEntity();
    }
    return false;
  });
}
function startTransition(callback) {
  if (React.startTransition) {
    React.startTransition(callback);
  } else {
    callback();
  }
}
export { useDynamicPositioning } from "./LexicalMenu.jsx";
export const ENABLE_SLASH_MENU_COMMAND = createCommand(
  "ENABLE_SLASH_MENU_COMMAND"
);
export function LexicalTypeaheadMenuPlugin({
  anchorClassName,
  anchorElem,
  groups,
  menuRenderFn,
  onClose,
  onOpen,
  onQueryChange,
  triggerFn,
}) {
  const [editor] = useLexicalComposerContext();
  const [resolution, setResolution] = useState(null);
  const anchorElementRef = useMenuAnchorRef(
    anchorElem,
    resolution,
    setResolution,
    anchorClassName
  );
  const closeTypeahead = useCallback(() => {
    setResolution(null);
    if (onClose != null && resolution !== null) {
      onClose();
    }
  }, [onClose, resolution]);
  const openTypeahead = useCallback(
    (res) => {
      setResolution(res);
      if (onOpen != null && resolution === null) {
        onOpen(res);
      }
    },
    [onOpen, resolution]
  );
  // This is mainly used for the AddBlockHandlePlugin, so that the slash menu can be opened from there
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        ENABLE_SLASH_MENU_COMMAND,
        ({ node }) => {
          editor.getEditorState().read(() => {
            var _a;
            const match = {
              leadOffset: 0,
              matchingString: "",
              replaceableString: "",
            };
            if (!isSelectionOnEntityBoundary(editor, match.leadOffset)) {
              if (node !== null) {
                const editorWindow =
                  (_a = editor._window) !== null && _a !== void 0 ? _a : window;
                const range = editorWindow.document.createRange();
                const isRangePositioned = tryToPositionRange(
                  match.leadOffset,
                  range,
                  editorWindow
                );
                if (isRangePositioned !== null) {
                  startTransition(() =>
                    openTypeahead({
                      getRect: () => {
                        return range.getBoundingClientRect();
                      },
                      match,
                    })
                  );
                }
                return;
              }
            }
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, openTypeahead]);
  useEffect(() => {
    const updateListener = () => {
      editor.getEditorState().read(() => {
        var _a;
        const editorWindow =
          (_a = editor._window) !== null && _a !== void 0 ? _a : window;
        const range = editorWindow.document.createRange();
        const selection = $getSelection();
        const text = getQueryTextForSearch(editor);
        if (
          !$isRangeSelection(selection) ||
          !selection.isCollapsed() ||
          text === undefined ||
          range === null
        ) {
          closeTypeahead();
          return;
        }
        const match = triggerFn({ editor, query: text });
        onQueryChange(match ? match.matchingString : null);
        if (
          match !== null &&
          !isSelectionOnEntityBoundary(editor, match.leadOffset)
        ) {
          const isRangePositioned = tryToPositionRange(
            match.leadOffset,
            range,
            editorWindow
          );
          if (isRangePositioned !== null) {
            startTransition(() =>
              openTypeahead({
                getRect: () => {
                  return range.getBoundingClientRect();
                },
                match,
              })
            );
            return;
          }
        }
        closeTypeahead();
      });
    };
    const removeUpdateListener = editor.registerUpdateListener(updateListener);
    return () => {
      removeUpdateListener();
    };
  }, [
    editor,
    triggerFn,
    onQueryChange,
    resolution,
    closeTypeahead,
    openTypeahead,
  ]);
  return anchorElementRef.current === null ||
    resolution === null ||
    editor === null ? null : (
    <LexicalMenu
      anchorElementRef={anchorElementRef}
      close={closeTypeahead}
      editor={editor}
      groups={groups}
      menuRenderFn={menuRenderFn}
      resolution={resolution}
      shouldSplitNodeWithQuery
    />
  );
}
