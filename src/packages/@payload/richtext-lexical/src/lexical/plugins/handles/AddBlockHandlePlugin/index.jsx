"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext.js";
import { $createParagraphNode } from "lexical";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
// import { useEditorConfigContext } from '../../../config/client/EditorConfigProvider.js'
import { useEditorConfigContext } from "../../../../../../../../Component/Lexical/proxy.js";
import { isHTMLElement } from "../../../utils/guard.js";
import { Point } from "../../../utils/point.js";
import { ENABLE_SLASH_MENU_COMMAND } from "../../SlashMenu/LexicalTypeaheadMenuPlugin/index.jsx";
import { calculateDistanceFromScrollerElem } from "../utils/calculateDistanceFromScrollerElem.js";
import { getNodeCloseToPoint } from "../utils/getNodeCloseToPoint.js";
import { getTopLevelNodeKeys } from "../utils/getTopLevelNodeKeys.js";
import { isOnHandleElement } from "../utils/isOnHandleElement.js";
import { setHandlePosition } from "../utils/setHandlePosition.js";
import "./index.scss";
const ADD_BLOCK_MENU_CLASSNAME = "add-block-menu";
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
function useAddBlockHandle(editor, anchorElem, isEditable) {
    var _a;
    const scrollerElem = anchorElem.parentElement;
    const { editorConfig } = useEditorConfigContext();
    const blockHandleHorizontalOffset = ((_a = editorConfig === null || editorConfig === void 0 ? void 0 : editorConfig.admin) === null || _a === void 0 ? void 0 : _a.hideGutter)
        ? -24
        : 12;
    const menuRef = useRef(null);
    const [hoveredElement, setHoveredElement] = useState(null);
    useEffect(() => {
        function onDocumentMouseMove(event) {
            const target = event.target;
            if (!isHTMLElement(target)) {
                return;
            }
            const distanceFromScrollerElem = calculateDistanceFromScrollerElem(scrollerElem, event.pageX, event.pageY, target);
            if (distanceFromScrollerElem === -1) {
                setHoveredElement(null);
                return;
            }
            if (isOnHandleElement(target, ADD_BLOCK_MENU_CLASSNAME)) {
                return;
            }
            const topLevelNodeKeys = getTopLevelNodeKeys(editor);
            const { blockElem: _emptyBlockElem, blockNode, foundAtIndex, } = getNodeCloseToPoint({
                anchorElem,
                cache_threshold: 0,
                editor,
                horizontalOffset: -distanceFromScrollerElem,
                point: new Point(event.x, event.y),
                returnEmptyParagraphs: true,
                startIndex: getCurrentIndex(topLevelNodeKeys.length),
                useEdgeAsDefault: false,
            });
            prevIndex = foundAtIndex;
            if (!_emptyBlockElem) {
                return;
            }
            if (blockNode &&
                ((hoveredElement === null || hoveredElement === void 0 ? void 0 : hoveredElement.node) !== blockNode ||
                    (hoveredElement === null || hoveredElement === void 0 ? void 0 : hoveredElement.elem) !== _emptyBlockElem)) {
                setHoveredElement({
                    elem: _emptyBlockElem,
                    node: blockNode,
                });
            }
        }
        // Since the draggableBlockElem is outside the actual editor, we need to listen to the document
        // to be able to detect when the mouse is outside the editor and respect a buffer around
        // the scrollerElem to avoid the draggableBlockElem disappearing too early.
        document === null || document === void 0 ? void 0 : document.addEventListener("mousemove", onDocumentMouseMove);
        return () => {
            document === null || document === void 0 ? void 0 : document.removeEventListener("mousemove", onDocumentMouseMove);
        };
    }, [scrollerElem, anchorElem, editor, hoveredElement]);
    useEffect(() => {
        if (menuRef.current && (hoveredElement === null || hoveredElement === void 0 ? void 0 : hoveredElement.node)) {
            setHandlePosition(hoveredElement === null || hoveredElement === void 0 ? void 0 : hoveredElement.elem, menuRef.current, anchorElem, blockHandleHorizontalOffset);
        }
    }, [anchorElem, hoveredElement, blockHandleHorizontalOffset]);
    const handleAddClick = useCallback((event) => {
        let hoveredElementToUse = hoveredElement;
        if (!(hoveredElementToUse === null || hoveredElementToUse === void 0 ? void 0 : hoveredElementToUse.node)) {
            return;
        }
        // 1. Update hoveredElement.node to a new paragraph node if the hoveredElement.node is not a paragraph node
        editor.update(() => {
            // Check if blockNode is an empty text node
            let isEmptyParagraph = true;
            if ((hoveredElementToUse === null || hoveredElementToUse === void 0 ? void 0 : hoveredElementToUse.node.getType()) !== "paragraph" ||
                hoveredElementToUse.node.getTextContent() !== "") {
                isEmptyParagraph = false;
            }
            if (!isEmptyParagraph) {
                const newParagraph = $createParagraphNode();
                hoveredElementToUse === null || hoveredElementToUse === void 0 ? void 0 : hoveredElementToUse.node.insertAfter(newParagraph);
                setTimeout(() => {
                    hoveredElementToUse = {
                        elem: editor.getElementByKey(newParagraph.getKey()),
                        node: newParagraph,
                    };
                    setHoveredElement(hoveredElementToUse);
                }, 0);
            }
        });
        // 2. Focus on the new paragraph node
        setTimeout(() => {
            editor.update(() => {
                editor.focus();
                if ((hoveredElementToUse === null || hoveredElementToUse === void 0 ? void 0 : hoveredElementToUse.node) &&
                    "select" in hoveredElementToUse.node &&
                    typeof hoveredElementToUse.node.select === "function") {
                    hoveredElementToUse.node.select();
                }
            });
        }, 1);
        // Make sure this is called AFTER the focusing has been processed by the browser
        // Otherwise, this won't work
        setTimeout(() => {
            editor.dispatchCommand(ENABLE_SLASH_MENU_COMMAND, {
                node: hoveredElementToUse === null || hoveredElementToUse === void 0 ? void 0 : hoveredElementToUse.node,
            });
        }, 2);
        event.stopPropagation();
        event.preventDefault();
    }, [editor, hoveredElement]);
    return createPortal(<React.Fragment>
      <button aria-label="Add block" className="icon add-block-menu" onClick={(event) => {
            handleAddClick(event);
        }} ref={menuRef} type="button">
        <div className={isEditable ? "icon" : ""}/>
      </button>
    </React.Fragment>, anchorElem);
}
export function AddBlockHandlePlugin({ anchorElem = document.body, }) {
    const [editor] = useLexicalComposerContext();
    return useAddBlockHandle(editor, anchorElem, editor._editable);
}
