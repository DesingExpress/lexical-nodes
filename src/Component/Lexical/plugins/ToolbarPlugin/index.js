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
  FORMAT_TEXT_COMMAND,
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
import { Button, Menu, MenuItem } from "@mui/material";
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

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "#/@lexical/markdown/index.js";
import { $getFrontmatter } from "../../utils/getMetaData";
import { MUT_TRANSFORMERS } from "../MarkdownShortcut";
import { $createCodeNode, $isCodeNode } from "../CodePlugin/node/CodeBlockNode";

function dropDownActiveClass(active) {
  if (active) {
    return "active dropdown-item-active";
  } else {
    return "";
  }
}

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
    <Fragment>
      <Button
        sx={{ minWidth: "unset", color: "#000" }}
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
          <div className="icon-text-container">
            <i className="icon paragraph" />
            <span className="text">Normal</span>
          </div>
          <span className="shortcut">{SHORTCUTS.NORMAL}</span>
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "h1")}
          onClick={() => formatHeading(editor, blockType, "h1")}
        >
          <div className="icon-text-container">
            <i className="icon h1" />
            <span className="text">Heading 1</span>
          </div>
          <span className="shortcut">{SHORTCUTS.HEADING1}</span>
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "h2")}
          onClick={() => formatHeading(editor, blockType, "h2")}
        >
          <div className="icon-text-container">
            <i className="icon h2" />
            <span className="text">Heading 2</span>
          </div>
          <span className="shortcut">{SHORTCUTS.HEADING2}</span>
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "h3")}
          onClick={() => formatHeading(editor, blockType, "h3")}
        >
          <div className="icon-text-container">
            <i className="icon h3" />
            <span className="text">Heading 3</span>
          </div>
          <span className="shortcut">{SHORTCUTS.HEADING3}</span>
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "bullet")}
          onClick={() => formatBulletList(editor, blockType)}
        >
          <div className="icon-text-container">
            <i className="icon bullet-list" />
            <span className="text">Bullet List</span>
          </div>
          <span className="shortcut">{SHORTCUTS.BULLET_LIST}</span>
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "number")}
          onClick={() => formatNumberedList(editor, blockType)}
        >
          <div className="icon-text-container">
            <i className="icon numbered-list" />
            <span className="text">Numbered List</span>
          </div>
          <span className="shortcut">{SHORTCUTS.NUMBERED_LIST}</span>
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "check")}
          onClick={() => formatCheckList(editor, blockType)}
        >
          <div className="icon-text-container">
            <i className="icon check-list" />
            <span className="text">Check List</span>
          </div>
          <span className="shortcut">{SHORTCUTS.CHECK_LIST}</span>
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "quote")}
          onClick={() => formatQuote(editor, blockType)}
        >
          <div className="icon-text-container">
            <i className="icon quote" />
            <span className="text">Quote</span>
          </div>
          <span className="shortcut">{SHORTCUTS.QUOTE}</span>
        </MenuItem>
        <MenuItem
          className={"item wide " + dropDownActiveClass(blockType === "code")}
          onClick={() => formatCode(editor, blockType)}
        >
          <div className="icon-text-container">
            <i className="icon code" />
            <span className="text">Code Block</span>
          </div>
          <span className="shortcut">{SHORTCUTS.CODE_BLOCK}</span>
        </MenuItem>
      </Menu>
    </Fragment>
  );
}

function InsertDropdown({ disabled, editor, showModal }) {
  const [isOpen, setOpen] = useState(false);
  function handleClick(e) {
    setOpen(e.currentTarget);
  }
  return (
    <Fragment>
      <Button
        sx={{ minWidth: "unset", color: "#000" }}
        onClick={handleClick}
        disabled={disabled}
      >
        <AddIcon />
      </Button>
      <Menu open={!!isOpen} anchorEl={isOpen} onClose={() => setOpen(false)}>
        <MenuItem
          onClick={() => {
            console.log(editor);
            editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
          }}
          className="item"
        >
          <i className="icon horizontal-rule" />
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
          <i className="icon image" />
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
          <i className="icon image" />
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
          <i className="icon equation" />
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
    </Fragment>
  );
}

function Divider() {
  return <div className="divider" />;
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

  const applyStyleText = useCallback(
    (styles, skipHistoryStack) => {
      activeEditor.update(
        () => {
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, styles);
          }
        },
        skipHistoryStack ? { tag: "historic" } : {}
      );
    },
    [activeEditor]
  );

  const onFontColorSelect = useCallback(
    (value, skipHistoryStack) => {
      applyStyleText({ color: value }, skipHistoryStack);
    },
    [applyStyleText]
  );

  const onBgColorSelect = useCallback(
    (value, skipHistoryStack) => {
      applyStyleText({ "background-color": value }, skipHistoryStack);
    },
    [applyStyleText]
  );

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

  const onCodeLanguageSelect = useCallback(
    (value) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          // if ($isCodeNode(node)) {
          //   node.setLanguage(value);
          // }
        }
      });
    },
    [activeEditor, selectedElementKey]
  );
  const insertGifOnClick = (payload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
  };

  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;

  function lx2md() {
    setRaw(true);
    editor.read(() => {
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
      const md = toolbarState.getCMText();
      console.log(md);
      $convertFromMarkdownString(
        md,
        MUT_TRANSFORMERS.current,
        undefined, //node
        shouldPreserveNewLinesInMarkdown
      );
    });
  }

  function handleCreateTable() {
    const rows = prompt("Enter the number of rows:", "");
    const columns = prompt("Enter the number of columns:", "");

    if (
      isNaN(Number(columns)) ||
      columns === null ||
      rows === null ||
      columns === "" ||
      rows === "" ||
      isNaN(Number(rows))
    ) {
      return;
    }
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: columns,
      rows: rows,
    });
  }

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
      <Divider />
      {toolbarState.blockType in blockTypeToBlockName &&
        activeEditor === editor && (
          <>
            <BlockFormatDropDown
              disabled={!isEditable}
              blockType={toolbarState.blockType}
              rootType={toolbarState.rootType}
              editor={activeEditor}
            />
            <Divider />
          </>
        )}
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
              <Divider />
            </>
          )}
        </>
      )}
      <Divider />
      <button
        disabled={!isEditable}
        onClick={isRaw ? md2lx : lx2md}
        className={"toolbar-item spaced "}
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
      {/* <button
        disabled={!isEditable}
        onClick={md2lx}
        className={"toolbar-item spaced "}
        aria-label="toggle edit off"
        title={`raw true`}
        type="button"
      >
        <EditIcon fontSize="inherit" className="format" />
      </button>
      <button onClick={handleCreateTable} className="toolbar-item spaced">
        <span className="text">Insert Table</span>
      </button> */}
      {modal}
    </div>
  );
}
