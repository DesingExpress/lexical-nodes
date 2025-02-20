/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// import {
//   $isCodeNode,
//   CODE_LANGUAGE_FRIENDLY_NAME_MAP,
//   CODE_LANGUAGE_MAP,
//   getLanguageFriendlyName,
// } from "@lexical/code";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $isListNode, ListNode } from "@lexical/list";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { $isHeadingNode } from "@lexical/rich-text";
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
} from "@lexical/selection";
import {
  $createTableNodeWithDimensions,
  $isTableNode,
  $isTableSelection,
  INSERT_TABLE_COMMAND,
} from "@lexical/table";
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
  IS_APPLE,
  mergeRegister,
} from "@lexical/utils";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import {
  blockTypeToBlockName,
  useToolbarState,
} from "../../context/ToolbarContext";
import useModal from "../../hooks/useModal";
// import catTypingGif from "../../images/cat-typing.gif";
// import { $createStickyNode } from "../../nodes/StickyNode";
// import DropDown, { MenuItem } from "../../ui/DropDown";
// import DropdownColorPicker from "../../ui/DropdownColorPicker";
import { getSelectedNode } from "../../utils/getSelectedNode";
import { sanitizeUrl } from "../../utils/url";
// import { EmbedConfigs } from "../AutoEmbedPlugin";
// import { INSERT_COLLAPSIBLE_COMMAND } from "../CollapsiblePlugin";
import { InsertEquationDialog } from "../EquationsPlugin";
// import { INSERT_EXCALIDRAW_COMMAND } from "../ExcalidrawPlugin";
import { INSERT_IMAGE_COMMAND, InsertImageDialog } from "../ImagesPlugin";
import { InsertInlineImageDialog } from "../InlineImagePlugin";
// import InsertLayoutDialog from "../LayoutPlugin/InsertLayoutDialog";
// import { INSERT_PAGE_BREAK } from "../PageBreakPlugin";
// import { InsertPollDialog } from "../PollPlugin";
import { SHORTCUTS } from "../ShortcutsPlugin/shortcuts";
// import { InsertTableDialog } from "../TablePlugin/TablePlugin";
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from "./utils";

import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import {
  Button,
  buttonClasses,
  Divider,
  Menu,
  menuClasses,
  MenuItem,
  menuItemClasses,
  styled,
} from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import CodeIcon from "@mui/icons-material/Code";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import AddIcon from "@mui/icons-material/Add";
import RawOnIcon from "@mui/icons-material/RawOn";
import RawOffIcon from "@mui/icons-material/RawOff";
import { ReactComponent as LowercaseIcon } from "../../../images/icons/type-lowercase.svg";
import { ReactComponent as H1Icon } from "../../../images/icons/type-h1.svg";
import { ReactComponent as ParagraphIcon } from "../../../images/icons/text-paragraph.svg";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatIndentDecreaseIcon from "@mui/icons-material/FormatIndentDecrease";
import FormatIndentIncreaseIcon from "@mui/icons-material/FormatIndentIncrease";
import SubjectIcon from "@mui/icons-material/Subject";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import ChecklistIcon from "@mui/icons-material/Checklist";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import HMobiledataIcon from "@mui/icons-material/HMobiledata";
import BorderHorizontalIcon from "@mui/icons-material/BorderHorizontal";
import ImageIcon from "@mui/icons-material/Image";
import IsoIcon from "@mui/icons-material/Iso";
import TitleIcon from "@mui/icons-material/Title";

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "#/@lexical/markdown/index.js";
import { $getFrontmatter } from "../../utils/getMetaData";
import { MUT_TRANSFORMERS } from "../MarkdownShortcut";
import { $createCodeNode, $isCodeNode } from "../CodePlugin/node/CodeBlockNode";
import FontSize from "./FontSize";

const StyledDiv = styled("div")(({ theme }) => ({
  [`& > .${buttonClasses.root}`]: {
    minWidth: "unset",
    color: "#000",
    [`& > svg`]: {
      width: "18px",
      height: "18px",
    },
  },
}));

const menuStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const FONT_FAMILY_OPTIONS = [
  ["Arial", "Arial"],
  ["Courier New", "Courier New"],
  ["Georgia", "Georgia"],
  ["Times New Roman", "Times New Roman"],
  ["Trebuchet MS", "Trebuchet MS"],
  ["Verdana", "Verdana"],
];

const FONT_SIZE_OPTIONS = [
  ["10px", "10px"],
  ["11px", "11px"],
  ["12px", "12px"],
  ["13px", "13px"],
  ["14px", "14px"],
  ["15px", "15px"],
  ["16px", "16px"],
  ["17px", "17px"],
  ["18px", "18px"],
  ["19px", "19px"],
  ["20px", "20px"],
];

const ELEMENT_FORMAT_OPTIONS = {
  center: {
    icon: "center-align",
    iconRTL: "center-align",
    name: "Center Align",
  },
  end: {
    icon: "right-align",
    iconRTL: "left-align",
    name: "End Align",
  },
  justify: {
    icon: "justify-align",
    iconRTL: "justify-align",
    name: "Justify Align",
  },
  left: {
    icon: "left-align",
    iconRTL: "left-align",
    name: "Left Align",
  },
  right: {
    icon: "right-align",
    iconRTL: "right-align",
    name: "Right Align",
  },
  start: {
    icon: "left-align",
    iconRTL: "right-align",
    name: "Start Align",
  },
};

function dropDownActiveClass(active) {
  if (active) {
    return "active dropdown-item-active";
  } else {
    return "";
  }
}

/**
 * @TODO MUI에 Heading1, 2, 3 Icon 존재하지 않아 임시로 동일아이콘 사용, 추후 변경 필요
 */
function BlockFormatDropDown({
  editor,
  blockType,
  rootType,
  disabled = false,
}) {
  const [isOpen, setOpen] = useState(false);
  const icon = useMemo(() => {
    switch (blockType) {
      case "paragraph":
        return <ParagraphIcon />;

      default:
        return <H1Icon />;
    }
  }, [blockType]);

  function handleClick(e) {
    setOpen(e.currentTarget);
  }
  return (
    <StyledDiv>
      <Button
        onClick={handleClick}
        disabled={disabled}
        buttonAriaLabel="Formatting options for text style"
      >
        {icon}
      </Button>
      <Menu open={!!isOpen} anchorEl={isOpen} onClose={() => setOpen(false)}>
        <MenuItem
          className={
            "item wide " + dropDownActiveClass(blockType === "paragraph")
          }
          onClick={() => formatParagraph(editor)}
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon paragraph" /> */}
            <SubjectIcon className="icon" style={{ marginRight: "8px" }} />
            <span className="text">Normal</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.NORMAL}</span> */}
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "h1")}
          onClick={() => formatHeading(editor, blockType, "h1")}
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon h1" /> */}
            <HMobiledataIcon className="icon" style={{ marginRight: "8px" }} />
            <span className="text">Heading 1</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.HEADING1}</span> */}
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "h2")}
          onClick={() => formatHeading(editor, blockType, "h2")}
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon h2" /> */}
            <HMobiledataIcon className="icon" style={{ marginRight: "8px" }} />
            <span className="text">Heading 2</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.HEADING2}</span> */}
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "h3")}
          onClick={() => formatHeading(editor, blockType, "h3")}
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon h3" /> */}
            <HMobiledataIcon className="icon" style={{ marginRight: "8px" }} />
            <span className="text">Heading 3</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.HEADING3}</span> */}
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "bullet")}
          onClick={() => formatBulletList(editor, blockType)}
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon bullet-list" /> */}
            <FormatListBulletedIcon
              className="icon"
              style={{ marginRight: "8px" }}
            />
            <span className="text">Bullet List</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.BULLET_LIST}</span> */}
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "number")}
          onClick={() => formatNumberedList(editor, blockType)}
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon numbered-list" /> */}
            <FormatListNumberedIcon
              className="icon"
              style={{ marginRight: "8px" }}
            />
            <span className="text">Numbered List</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.NUMBERED_LIST}</span> */}
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "check")}
          onClick={() => formatCheckList(editor, blockType)}
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon check-list" /> */}
            <ChecklistIcon className="icon" style={{ marginRight: "8px" }} />
            <span className="text">Check List</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.CHECK_LIST}</span> */}
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "quote")}
          onClick={() => formatQuote(editor, blockType)}
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon quote" /> */}
            <FormatQuoteIcon className="icon" style={{ marginRight: "8px" }} />
            <span className="text">Quote</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.QUOTE}</span> */}
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "code")}
          onClick={() => formatCode(editor, blockType)}
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon code" /> */}
            <CodeIcon className="icon" style={{ marginRight: "8px" }} />
            <span className="text">Code Block</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.CODE_BLOCK}</span> */}
        </MenuItem>
      </Menu>
    </StyledDiv>
  );
}

/**
 * @TODO
 * Table Cell 선택후 선택한 정렬에 맞게 Markdown에서 Colons(:)이 생성되도록 구현 필요
 */
function ElementFormatDropdown({ editor, value, isRTL, disabled = false }) {
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || "left"];
  const [isOpen, setOpen] = useState(false);
  const icon = useMemo(() => {
    switch (value) {
      case "left":
        return <FormatAlignLeftIcon />;

      default:
        return <FormatAlignLeftIcon />;
    }
  }, [value]);

  function handleClick(e) {
    setOpen(e.currentTarget);
  }

  return (
    <StyledDiv>
      <Button
        onClick={handleClick}
        disabled={disabled}
        buttonAriaLabel="Formatting options for text style"
      >
        {icon}
      </Button>
      <Menu
        open={!!isOpen}
        onClose={() => setOpen(false)}
        anchorEl={isOpen}
        disabled={disabled}
        buttonLabel={formatOption.name}
        buttonIconClassName={`icon ${
          isRTL ? formatOption.iconRTL : formatOption.icon
        }`}
        className="toolbar-item spaced alignment"
        aria-label="Formatting options for text alignment"
      >
        <MenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
          }}
          className="item wide"
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon left-align" /> */}
            <FormatAlignLeftIcon
              className="icon"
              style={{ marginRight: "8px" }}
            />
            <span className="text">Left Align</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.LEFT_ALIGN}</span> */}
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
          }}
          className="item wide"
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon center-align" /> */}
            <FormatAlignCenterIcon
              className="icon"
              style={{ marginRight: "8px" }}
            />
            <span className="text">Center Align</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.CENTER_ALIGN}</span> */}
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
          }}
          className="item wide"
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon right-align" /> */}
            <FormatAlignRightIcon
              className="icon"
              style={{ marginRight: "8px" }}
            />
            <span className="text">Right Align</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.RIGHT_ALIGN}</span> */}
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
          }}
          className="item wide"
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className="icon justify-align" /> */}
            <FormatAlignJustifyIcon
              className="icon"
              style={{ marginRight: "8px" }}
            />
            <span className="text">Justify Align</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.JUSTIFY_ALIGN}</span> */}
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "start");
          }}
          className="item wide"
        >
          {/* <i
            className={`icon ${
              isRTL
                ? ELEMENT_FORMAT_OPTIONS.start.iconRTL
                : ELEMENT_FORMAT_OPTIONS.start.icon
            }`}
          /> */}
          <FormatAlignLeftIcon
            className="icon"
            style={{ marginRight: "8px" }}
          />
          <span className="text">Start Align</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "end");
          }}
          className="item wide"
        >
          {/* <i
            className={`icon ${
              isRTL
                ? ELEMENT_FORMAT_OPTIONS.end.iconRTL
                : ELEMENT_FORMAT_OPTIONS.end.icon
            }`}
          /> */}
          <FormatAlignRightIcon
            className="icon"
            style={{ marginRight: "8px" }}
          />
          <span className="text">End Align</span>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
          }}
          className="item wide"
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className={"icon " + (isRTL ? "indent" : "outdent")} /> */}
            {isRTL ? (
              <FormatIndentIncreaseIcon
                className="icon"
                style={{ marginRight: "8px" }}
              />
            ) : (
              <FormatIndentDecreaseIcon
                className="icon"
                style={{ marginRight: "8px" }}
              />
            )}
            <span className="text">Outdent</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.OUTDENT}</span> */}
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          }}
          className="item wide"
        >
          <div className="icon-text-container" style={menuStyle}>
            {/* <i className={"icon " + (isRTL ? "outdent" : "indent")} /> */}
            {isRTL ? (
              <FormatIndentDecreaseIcon
                className="icon"
                style={{ marginRight: "8px" }}
              />
            ) : (
              <FormatIndentIncreaseIcon
                className="icon"
                style={{ marginRight: "8px" }}
              />
            )}
            <span className="text">Indent</span>
          </div>
          {/* <span className="shortcut">{SHORTCUTS.INDENT}</span> */}
        </MenuItem>
      </Menu>
    </StyledDiv>
  );
}

function InsertDropdown({ disabled, editor, showModal }) {
  const [isOpen, setOpen] = useState(false);
  function handleClick(e) {
    setOpen(e.currentTarget);
  }
  return (
    <StyledDiv>
      <Button onClick={handleClick} disabled={disabled}>
        <AddIcon />
      </Button>
      <Menu open={!!isOpen} anchorEl={isOpen} onClose={() => setOpen(false)}>
        <MenuItem
          onClick={() => {
            editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
          }}
          className="item"
        >
          {/* <i className="icon horizontal-rule" /> */}
          <BorderHorizontalIcon
            className="icon"
            style={{ marginRight: "8px" }}
          />
          <span className="text">Horizontal Rule</span>
        </MenuItem>
        {/* <MenuItem
                  onClick={() => {
                    activeEditor.dispatchCommand(INSERT_PAGE_BREAK, undefined);
                  }}
                  className="item"
                >
                  <i className="icon page-break" />
                  <span className="text">Page Break</span>
                </MenuItem> */}
        <MenuItem
          onClick={() => {
            showModal("Insert Image", (onClose) => (
              <InsertImageDialog activeEditor={editor} onClose={onClose} />
            ));
          }}
          className="item"
        >
          {/* <i className="icon image" /> */}
          <ImageIcon className="icon" style={{ marginRight: "8px" }} />
          <span className="text">Image</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            showModal("Insert Inline Image", (onClose) => (
              <InsertInlineImageDialog
                activeEditor={editor}
                onClose={onClose}
              />
            ));
          }}
          className="item"
        >
          {/* <i className="icon image" /> */}
          <ImageIcon className="icon" style={{ marginRight: "8px" }} />
          <span className="text">Inline Image</span>
        </MenuItem>
        {/* <MenuItem
                  onClick={() => {
                    activeEditor.dispatchCommand(
                      INSERT_EXCALIDRAW_COMMAND,
                      undefined
                    );
                  }}
                  className="item"
                >
                  <i className="icon diagram-2" />
                  <span className="text">Excalidraw</span>
                </MenuItem> */}
        {/* <MenuItem
                  onClick={() => {
                    showModal("Insert Table", (onClose) => (
                      <InsertTableDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item"
                >
                  <i className="icon table" />
                  <span className="text">Table</span>
                </MenuItem> */}

        <MenuItem
          onClick={() => {
            showModal("Insert Equation", (onClose) => (
              <InsertEquationDialog activeEditor={editor} onClose={onClose} />
            ));
          }}
          className="item"
        >
          {/* <i className="icon equation" /> */}
          <IsoIcon className="icon" style={{ marginRight: "8px" }} />
          <span className="text">Equation</span>
        </MenuItem>
        {/* <MenuItem
                  onClick={() => {
                    editor.dispatchCommand(
                      INSERT_COLLAPSIBLE_COMMAND,
                      undefined
                    );
                  }}
                  className="item"
                >
                  <i className="icon caret-right" />
                  <span className="text">Collapsible container</span>
                </MenuItem> */}
        {/* {EmbedConfigs.map((embedConfig) => (
                  <MenuItem
                    key={embedConfig.type}
                    onClick={() => {
                      activeEditor.dispatchCommand(
                        INSERT_EMBED_COMMAND,
                        embedConfig.type
                      );
                    }}
                    className="item"
                  >
                    {embedConfig.icon}
                    <span className="text">{embedConfig.contentName}</span>
                  </MenuItem>
                ))} */}
      </Menu>
    </StyledDiv>
  );
}

function FontDropDown({ editor, value, style, disabled = false }) {
  const [isOpen, setOpen] = useState(false);

  function handleClickOpen(e) {
    setOpen(e.currentTarget);
  }

  const handleClick = useCallback(
    (option) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style]
  );

  const buttonAriaLabel =
    style === "font-family"
      ? "Formatting options for font family"
      : "Formatting options for font size";

  return (
    <StyledDiv>
      <Button
        onClick={handleClickOpen}
        disabled={disabled}
        buttonAriaLabel={buttonAriaLabel}
      >
        <TitleIcon />
      </Button>
      <Menu
        open={!!isOpen}
        anchorEl={isOpen}
        onClose={() => setOpen(false)}
        buttonClassName={"toolbar-item " + style}
        buttonLabel={value}
        buttonIconClassName={
          style === "font-family" ? "icon block-type font-family" : ""
        }
      >
        {(style === "font-family"
          ? FONT_FAMILY_OPTIONS
          : FONT_SIZE_OPTIONS
        ).map(([option, text]) => (
          <MenuItem
            className={`item ${dropDownActiveClass(value === option)} ${
              style === "font-size" ? "fontsize-item" : ""
            }`}
            onClick={() => handleClick(option)}
            key={option}
          >
            <span className="text">{text}</span>
          </MenuItem>
        ))}
      </Menu>
    </StyledDiv>
  );
}

export function FillColumns() {
  const columns = prompt("Enter the number of columns:", "");

  if (columns !== null) {
    return columns;
  } else {
    return String(0);
  }
}

export default function ToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode,
  shouldPreserveNewLinesInMarkdown,
}) {
  const [selectedElementKey, setSelectedElementKey] = useState(null);
  const [modal, showModal] = useModal();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const { toolbarState, updateToolbarState } = useToolbarState();
  const [isRaw, setRaw] = useState(false);

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState(
          "isImageCaption",
          !!rootElement?.parentElement?.classList.contains(
            "image-caption-container"
          )
        );
      } else {
        updateToolbarState("isImageCaption", false);
      }

      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      updateToolbarState("isRTL", $isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState("isLink", isLink);

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        updateToolbarState("rootType", "table");
      } else {
        updateToolbarState("rootType", "root");
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList
            ? parentList.getListType()
            : element.getListType();

          updateToolbarState("blockType", type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (type in blockTypeToBlockName) {
            updateToolbarState("blockType", type);
          }
          // if ($isCodeNode(element)) {
          //   const language = element.getLanguage();
          //   updateToolbarState(
          //     "codeLanguage",
          //     language ? CODE_LANGUAGE_MAP[language] || language : ""
          //   );
          //   return;
          // }
        }
      }
      // Handle buttons
      updateToolbarState(
        "fontColor",
        $getSelectionStyleValueForProperty(selection, "color", "#000")
      );
      updateToolbarState(
        "bgColor",
        $getSelectionStyleValueForProperty(
          selection,
          "background-color",
          "#fff"
        )
      );
      updateToolbarState(
        "fontFamily",
        $getSelectionStyleValueForProperty(selection, "font-family", "Arial")
      );
      let matchingParent;
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline()
        );
      }

      // If matchingParent is a valid node, pass it's format type
      updateToolbarState(
        "elementFormat",
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
          ? node.getFormatType()
          : parent?.getFormatType() || "left"
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      // Update text format
      updateToolbarState("isBold", selection.hasFormat("bold"));
      updateToolbarState("isItalic", selection.hasFormat("italic"));
      updateToolbarState("isUnderline", selection.hasFormat("underline"));
      updateToolbarState(
        "isStrikethrough",
        selection.hasFormat("strikethrough")
      );
      updateToolbarState("isSubscript", selection.hasFormat("subscript"));
      updateToolbarState("isSuperscript", selection.hasFormat("superscript"));
      updateToolbarState("isCode", selection.hasFormat("code"));
      updateToolbarState(
        "fontSize",
        $getSelectionStyleValueForProperty(selection, "font-size", "15px")
      );
      updateToolbarState("isLowercase", selection.hasFormat("lowercase"));
      updateToolbarState("isUppercase", selection.hasFormat("uppercase"));
      updateToolbarState("isCapitalize", selection.hasFormat("capitalize"));
    }
  }, [activeEditor, editor, updateToolbarState]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(() => {
      $updateToolbar();
    });
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      activeEditor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          updateToolbarState("canUndo", payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      activeEditor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          updateToolbarState("canRedo", payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [$updateToolbar, activeEditor, editor, updateToolbarState]);

  const insertLink = useCallback(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(
        TOGGLE_LINK_COMMAND,
        sanitizeUrl("https://")
      );
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);

  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;

  /**
   * @TODO
   * Markdown으로 작성 후 Colons(:)의 방향에 따라 Table Align 기능 구현 필요
   * ex) |:---| Left Align / |:---:| Center Align / |---:| Right Align
   */
  function lx2md() {
    setRaw(true);

    editor.update(() => {
      const markdown = $convertToMarkdownString(
        MUT_TRANSFORMERS.current,
        undefined, //node
        shouldPreserveNewLinesInMarkdown
      );
      toolbarState.setCMText(markdown);
    });
  }

  function md2lx() {
    setRaw(false);
    const md = toolbarState.getCMText();

    editor.update(() => {
      $convertFromMarkdownString(
        md,
        MUT_TRANSFORMERS.current,
        undefined, //node
        shouldPreserveNewLinesInMarkdown
      );
    });
  }

  // function handleCreateTable() {
  //   const rows = prompt("Enter the number of rows:", "");
  //   const columns = prompt("Enter the number of columns:", "");

  //   if (
  //     isNaN(Number(columns)) ||
  //     columns === null ||
  //     rows === null ||
  //     columns === "" ||
  //     rows === "" ||
  //     isNaN(Number(rows))
  //   ) {
  //     return;
  //   }
  //   editor.dispatchCommand(INSERT_TABLE_COMMAND, {
  //     columns: columns,
  //     rows: rows,
  //   });
  // }

  return (
    <div className="toolbar">
      <button
        disabled={!toolbarState.canUndo || !isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        title={IS_APPLE ? "Undo (⌘Z)" : "Undo (Ctrl+Z)"}
        type="button"
        className="toolbar-item spaced"
        aria-label="Undo"
      >
        <UndoIcon fontSize="inherit" className="format" />
      </button>
      <button
        disabled={!toolbarState.canRedo || !isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        title={IS_APPLE ? "Redo (⇧⌘Z)" : "Redo (Ctrl+Y)"}
        type="button"
        className="toolbar-item"
        aria-label="Redo"
      >
        <RedoIcon fontSize="inherit" className="format" />
      </button>
      <Divider orientation="vertical" />
      {toolbarState.blockType in blockTypeToBlockName &&
        activeEditor === editor && (
          <>
            <BlockFormatDropDown
              disabled={!isEditable}
              blockType={toolbarState.blockType}
              rootType={toolbarState.rootType}
              editor={activeEditor}
            />
          </>
        )}
      <Divider orientation="vertical" />
      {toolbarState.blockType === "code" ? (
        // <Menu
        //   disabled={!isEditable}
        //   buttonClassName="toolbar-item code-language"
        //   buttonLabel={getLanguageFriendlyName(toolbarState.codeLanguage)}
        //   buttonAriaLabel="Select language"
        // >
        //   {CODE_LANGUAGE_OPTIONS.map(([value, name]) => {
        //     return (
        //       <MenuItem
        //         className={`item ${dropDownActiveClass(
        //           value === toolbarState.codeLanguage
        //         )}`}
        //         onClick={() => onCodeLanguageSelect(value)}
        //         key={value}
        //       >
        //         <span className="text">{name}</span>
        //       </MenuItem>
        //     );
        //   })}
        // </Menu>
        <div>not supported</div>
      ) : (
        <>
          <FontDropDown
            disabled={!isEditable}
            style={"font-family"}
            value={toolbarState.fontFamily}
            editor={activeEditor}
          />
          <Divider orientation="vertical" />
          <FontSize
            selectionFontSize={toolbarState.fontSize.slice(0, -2)}
            editor={activeEditor}
            disabled={!isEditable}
          />
          <Divider orientation="vertical" />
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={
              "toolbar-item spaced " + (toolbarState.isBold ? "active" : "")
            }
            title={`Bold (${SHORTCUTS.BOLD})`}
            type="button"
            aria-label={`Format text as bold. Shortcut: ${SHORTCUTS.BOLD}`}
          >
            <FormatBoldIcon fontSize="inherit" className="format" />
          </button>
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            className={
              "toolbar-item spaced " + (toolbarState.isItalic ? "active" : "")
            }
            title={`Italic (${SHORTCUTS.ITALIC})`}
            type="button"
            aria-label={`Format text as italics. Shortcut: ${SHORTCUTS.ITALIC}`}
          >
            <FormatItalicIcon fontSize="inherit" className="format" />
          </button>
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            }}
            className={
              "toolbar-item spaced " +
              (toolbarState.isUnderline ? "active" : "")
            }
            title={`Underline (${SHORTCUTS.UNDERLINE})`}
            type="button"
            aria-label={`Format text to underlined. Shortcut: ${SHORTCUTS.UNDERLINE}`}
          >
            <FormatUnderlinedIcon fontSize="inherit" className="format" />
          </button>
          {canViewerSeeInsertCodeButton && (
            <button
              disabled={!isEditable}
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
              }}
              className={
                "toolbar-item spaced " + (toolbarState.isCode ? "active" : "")
              }
              title={`Insert code block (${SHORTCUTS.INSERT_CODE_BLOCK})`}
              type="button"
              aria-label="Insert code block"
            >
              <CodeIcon fontSize="inherit" className="format" />
            </button>
          )}
          <button
            disabled={!isEditable}
            onClick={insertLink}
            className={
              "toolbar-item spaced " + (toolbarState.isLink ? "active" : "")
            }
            aria-label="Insert link"
            title={`Insert link (${SHORTCUTS.INSERT_LINK})`}
            type="button"
          >
            <InsertLinkIcon fontSize="inherit" className="format" />
          </button>
          <Menu
            disabled={!isEditable}
            buttonClassName="toolbar-item spaced"
            buttonLabel=""
            buttonAriaLabel="Formatting options for additional text styles"
            buttonIconClassName="icon dropdown-more"
          >
            <MenuItem
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "lowercase");
              }}
              className={
                "item wide " + dropDownActiveClass(toolbarState.isLowercase)
              }
              title="Lowercase"
              aria-label="Format text to lowercase"
            >
              <div className="icon-text-container">
                <LowercaseIcon />
              </div>
              <span className="shortcut">{SHORTCUTS.LOWERCASE}</span>
            </MenuItem>
            <MenuItem
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "uppercase");
              }}
              className={
                "item wide " + dropDownActiveClass(toolbarState.isUppercase)
              }
              title="Uppercase"
              aria-label="Format text to uppercase"
            >
              <div className="icon-text-container">
                <i className="icon uppercase" />
                <span className="text">Uppercase</span>
              </div>
              <span className="shortcut">{SHORTCUTS.UPPERCASE}</span>
            </MenuItem>
            <MenuItem
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "capitalize");
              }}
              className={
                "item wide " + dropDownActiveClass(toolbarState.isCapitalize)
              }
              title="Capitalize"
              aria-label="Format text to capitalize"
            >
              <div className="icon-text-container">
                <i className="icon capitalize" />
                <span className="text">Capitalize</span>
              </div>
              <span className="shortcut">{SHORTCUTS.CAPITALIZE}</span>
            </MenuItem>
            <MenuItem
              onClick={() => {
                activeEditor.dispatchCommand(
                  FORMAT_TEXT_COMMAND,
                  "strikethrough"
                );
              }}
              className={
                "item wide " + dropDownActiveClass(toolbarState.isStrikethrough)
              }
              title="Strikethrough"
              aria-label="Format text with a strikethrough"
            >
              <div className="icon-text-container">
                <i className="icon strikethrough" />
                <span className="text">Strikethrough</span>
              </div>
              <span className="shortcut">{SHORTCUTS.STRIKETHROUGH}</span>
            </MenuItem>
            <MenuItem
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
              }}
              className={
                "item wide " + dropDownActiveClass(toolbarState.isSubscript)
              }
              title="Subscript"
              aria-label="Format text with a subscript"
            >
              <div className="icon-text-container">
                <i className="icon subscript" />
                <span className="text">Subscript</span>
              </div>
              <span className="shortcut">{SHORTCUTS.SUBSCRIPT}</span>
            </MenuItem>
            <MenuItem
              onClick={() => {
                activeEditor.dispatchCommand(
                  FORMAT_TEXT_COMMAND,
                  "superscript"
                );
              }}
              className={
                "item wide " + dropDownActiveClass(toolbarState.isSuperscript)
              }
              title="Superscript"
              aria-label="Format text with a superscript"
            >
              <div className="icon-text-container">
                <i className="icon superscript" />
                <span className="text">Superscript</span>
              </div>
              <span className="shortcut">{SHORTCUTS.SUPERSCRIPT}</span>
            </MenuItem>
            <MenuItem
              onClick={() => clearFormatting(activeEditor)}
              className="item wide"
              title="Clear text formatting"
              aria-label="Clear all text formatting"
            >
              <div className="icon-text-container">
                <i className="icon clear" />
                <span className="text">Clear Formatting</span>
              </div>
              <span className="shortcut">{SHORTCUTS.CLEAR_FORMATTING}</span>
            </MenuItem>
          </Menu>
          {canViewerSeeInsertDropdown && (
            <>
              <InsertDropdown
                disabled={!isEditable}
                editor={activeEditor}
                showModal={showModal}
              />
            </>
          )}
          <ElementFormatDropdown
            disabled={!isEditable}
            value={toolbarState.elementFormat}
            editor={activeEditor}
            isRTL={toolbarState.isRTL}
          />
        </>
      )}
      <Divider orientation="vertical" />
      <button
        disabled={!isEditable}
        onClick={isRaw ? md2lx : lx2md}
        className="toolbar-item spaced"
        aria-label="toggle edit on"
        title={`raw false`}
        type="button"
      >
        {isRaw ? (
          <RawOnIcon fontSize="inherit" className="format" />
        ) : (
          <RawOffIcon fontSize="inherit" className="format" />
        )}
      </button>
      {modal}
    </div>
  );
}
