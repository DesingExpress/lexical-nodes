/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement } from "@lexical/utils";
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from "lexical";
import { useEffect, useState } from "react";

import { $createExcalidrawNode, ExcalidrawNode } from "./node/index";
import ExcalidrawModal from "./ui/ExcalidrawModal";

export const INSERT_EXCALIDRAW_COMMAND = createCommand(
  "INSERT_EXCALIDRAW_COMMAND"
);

export default function ExcalidrawPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!editor.hasNodes([ExcalidrawNode])) {
      throw new Error(
        "ExcalidrawPlugin: ExcalidrawNode not registered on editor"
      );
    }

    return editor.registerCommand(
      INSERT_EXCALIDRAW_COMMAND,
      () => {
        setModalOpen(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  const onClose = () => {
    setModalOpen(false);
  };

  const onDelete = () => {
    setModalOpen(false);
  };

  const onSave = (elements, appState, files) => {
    editor.update(() => {
      const excalidrawNode = $createExcalidrawNode();
      excalidrawNode.setData(
        JSON.stringify({
          appState,
          elements,
          files,
        })
      );
      $insertNodes([excalidrawNode]);
      if ($isRootOrShadowRoot(excalidrawNode.getParentOrThrow())) {
        $wrapNodeInElement(excalidrawNode, $createParagraphNode).selectEnd();
      }
    });
    setModalOpen(false);
  };

  return isModalOpen ? (
    <ExcalidrawModal
      initialElements={[]}
      initialAppState={{}}
      initialFiles={{}}
      isShown={isModalOpen}
      onDelete={onDelete}
      onClose={onClose}
      onSave={onSave}
      closeOnClickOutside={false}
    />
  ) : null;
}
