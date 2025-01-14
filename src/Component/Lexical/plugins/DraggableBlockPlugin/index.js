/* eslint-disable react/jsx-pascal-case */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useRef } from "react";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { styled } from "@mui/material";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";

const DraggableBlockMenu = styled("div")(({ theme }) => ({
  borderRadius: 4,
  padding: "2px 1px",
  cursor: "grab",
  opacity: 0,
  position: "absolute",
  left: 0,
  top: 0,
  willChange: "transform",
  [`& .icon`]: {
    width: 16,
    height: 16,
    opacity: 0.3,
    /* background-image: url(../../images/icons/draggable-block-menu.svg), */
  },
  [`&:active`]: {
    cursor: "grabbing",
  },
  [`&:hover`]: {
    backgroundColor: "#efefef",
  },
}));
const DraggableBlockTargetLine = styled("div")(({ theme }) => ({
  pointerEvents: "none",
  background: "deepskyblue",
  height: 4,
  position: "absolute",
  left: 0,
  top: 0,
  opacity: 0,
  willChange: "transform",
}));

function isOnMenu(element) {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export default function DraggableBlockPlugin({ anchorElem = document.body }) {
  const menuRef = useRef(null);
  const targetLineRef = useRef(null);

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <DraggableBlockMenu ref={menuRef}>
          <DragIndicatorIcon fontSize="12" />
        </DraggableBlockMenu>
      }
      targetLineComponent={<DraggableBlockTargetLine ref={targetLineRef} />}
      isOnMenu={isOnMenu}
    />
  );
}
