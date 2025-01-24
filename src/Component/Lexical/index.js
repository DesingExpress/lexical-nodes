/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "../style.css";
import "./index.css";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";

// import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { $isTextNode, isHTMLElement, ParagraphNode, TextNode } from "lexical";

import { parseAllowedColor, parseAllowedFontSize } from "./styleConfig";
import lexicalTheme from "./theme";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";

import { Fragment, useEffect, useMemo, useState } from "react";
import DraggableBlockPlugin from "./plugins/DraggableBlockPlugin";
import EquationsPlugin, { EQUATION } from "./plugins/EquationsPlugin";
import defaultNodes from "./nodes";
import InlineImagePlugin from "./plugins/InlineImagePlugin";
import ImagesPlugin from "./plugins/ImagesPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  SharedHistoryContext,
  useSharedHistoryContext,
} from "./context/SharedHistoryContext";
import { ToolbarContext } from "./context/ToolbarContext";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingTextFormatToolbarPlugin";
import TabFocusPlugin from "./plugins/TabFocusPlugin";
import { CODE } from "./plugins/CodePlugin/transformer";
import { SettingsContext, useSettings } from "./context/SettingsContext";
import TestRawEditor from "./TestRawEditor";
import { createTheme, ThemeProvider } from "@mui/material";
import { FRONTMATTER } from "./plugins/FrontmatterPlugin/transformer";
import { TableContext, TablePlugin } from "./plugins/TablePlugin/TablePlugin";
import TableCellActionMenuPlugin from "./plugins/TablePlugin/TableActionMenuPlugin";
import TableHoverActionsPlugin from "./plugins/TablePlugin/TableHoverActionsPlugin";
import TableOfContentsPlugin from "./plugins/TablePlugin/TableOfContentsPlugin";
// import CollapsiblePlugin from "./plugins/CollapsiblePlugin";
// import PollPlugin from "./plugins/PollPlugin";
// import PageBreakPlugin from "./plugins/PageBreakPlugin";
// import { LayoutPlugin } from "./plugins/LayoutPlugin";
// import ExcalidrawPlugin from "./plugins/ExcalidrawPlugin";
// import AutoEmbedPlugin from "./plugins/AutoEmbedPlugin";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import ComponentPickerMenuPlugin from "./plugins/ComponentPickerPlugin";
import TableCellResizer from "./plugins/TablePlugin/TableCellResizer";
import {
  DEFAULT_TRANSFORMERS,
  MarkdownShortcutPlugin,
  MUT_TRANSFORMERS,
} from "./plugins/MarkdownShortcut";
import combineContexts from "./utils/combineContext";
import { useLitegraphSlot } from "./context/litegraphContext";
import { $getFrontmatter } from "./utils/getMetaData";
import { $getQueris } from "./utils/getQueris";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "#/@lexical/markdown/index.js";
import { TABLE } from "./plugins/TablePlugin/transformer";
import useLexicalEditable from "@lexical/react/useLexicalEditable";
import { CAN_USE_DOM } from "@lexical/utils";

const placeholder = "Enter some rich text...";

const removeStylesExportDOM = (editor, target) => {
  const output = target.exportDOM(editor);
  if (output && isHTMLElement(output.element)) {
    // Remove all inline styles and classes if the element is an HTMLElement
    // Children are checked as well since TextNode can be nested
    // in i, b, and strong tags.
    for (const el of [
      output.element,
      ...output.element.querySelectorAll('[style],[class],[dir="ltr"]'),
    ]) {
      el.removeAttribute("class");
      el.removeAttribute("style");
      if (el.getAttribute("dir") === "ltr") {
        el.removeAttribute("dir");
      }
    }
  }
  return output;
};

const exportMap = new Map([
  [ParagraphNode, removeStylesExportDOM],
  [TextNode, removeStylesExportDOM],
]);

const getExtraStyles = (element) => {
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
  let extraStyles = "";
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== "" && fontSize !== "15px") {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== "" && backgroundColor !== "rgb(255, 255, 255)") {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== "" && color !== "rgb(0, 0, 0)") {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
};

const constructImportMap = () => {
  const importMap = {};

  // Wrap all TextNode importers with a function that also imports
  // the custom styles implemented by the playground
  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = (importNode) => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: (element) => {
          const output = importer.conversion(element);
          if (
            output === null ||
            output.forChild === undefined ||
            output.after !== undefined ||
            output.node !== null
          ) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const { forChild } = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              },
            };
          }
          return output;
        },
      };
    };
  }

  return importMap;
};

function Editor({ plugins, shortcuts, editorRef }) {
  const {
    settings: {
      isRichText,
      showTableOfContents,
      shouldPreserveNewLinesInMarkdown,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
    },
  } = useSettings();
  const { historyState } = useSharedHistoryContext();
  const isEditable = useLexicalEditable();
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState(false);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const registerCommand = useLitegraphSlot();

  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia("(max-width: 1025px)").matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);

    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  useEffect(() => {
    const unregister = registerCommand("toSave", (node) => {
      editor.read(() => {
        const markdown = $convertToMarkdownString(
          MUT_TRANSFORMERS.current,
          undefined, //node
          true
        );
        node.setOutputData(3, {
          rule_body: markdown,
          rule_meta: $getFrontmatter(),
          queryset: $getQueris(),
        });
        node.triggerSlot(2);
      });
    });
    return () => {
      unregister();
    };
  }, [registerCommand]);
  return (
    <Fragment>
      <div className="editor-shell">
        <ToolbarPlugin
          editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          setIsLinkEditMode={setIsLinkEditMode}
          shouldPreserveNewLinesInMarkdown={shouldPreserveNewLinesInMarkdown}
        />
        <div className="editor-container">
          <AutoFocusPlugin />
          <HistoryPlugin externalHistoryState={historyState} />
          {isRichText ? (
            <div className="editor-inner" tabIndex={-1}>
              <RichTextPlugin
                contentEditable={
                  <div className="editor-scroller">
                    <div className="editor" ref={onRef}>
                      <ContentEditable
                        className={"ContentEditable__root"}
                        aria-placeholder={placeholder}
                        placeholder={
                          <div className={"ContentEditable__placeholder"}>
                            {placeholder}
                          </div>
                        }
                      />
                    </div>
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <TabIndentationPlugin maxIndent={0} />
              <TabFocusPlugin />
              {/* <ComponentPickerMenuPlugin /> */}
              <ListPlugin />
              <MarkdownShortcutPlugin plugins={shortcuts} />
              <EquationsPlugin />
              <HorizontalRulePlugin />
              <TablePlugin
                hasCellMerge={tableCellMerge}
                hasCellBackgroundColor={tableCellBackgroundColor}
                hasHorizontalScroll={tableHorizontalScroll}
              />
              <TableCellResizer />
              {/* <AutoEmbedPlugin />
              <CollapsiblePlugin />
              <ExcalidrawPlugin />
              <LayoutPlugin />
              <PageBreakPlugin />
              <PollPlugin /> */}
              {floatingAnchorElem && (
                <>
                  <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                  {/* <CodeActionMenuPlugin anchorElem={floatingAnchorElem} /> */}
                  {/* <FloatingLinkEditorPlugin
                      anchorElem={floatingAnchorElem}
                      isLinkEditMode={isLinkEditMode}
                      setIsLinkEditMode={setIsLinkEditMode}
                    /> */}
                  <TableCellActionMenuPlugin
                    anchorElem={floatingAnchorElem}
                    cellMerge={true}
                  />
                  <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
                  <FloatingTextFormatToolbarPlugin
                    anchorElem={floatingAnchorElem}
                    setIsLinkEditMode={setIsLinkEditMode}
                  />
                </>
              )}
              <InlineImagePlugin />
              {/* <ImagesPlugin /> */}
              <EditorRefPlugin editorRef={editorRef} />
              {plugins.map((T) => (
                <T
                  anchorElem={floatingAnchorElem}
                  editor={editor}
                  activeEditor={activeEditor}
                  externalHistoryState={historyState}
                />
              ))}
              {/* <SlashMenuPlugin anchorElem={floatingAnchorElem} /> */}
            </div>
          ) : (
            <>
              <PlainTextPlugin
                contentEditable={
                  <ContentEditable
                    className={"ContentEditable__root plain"}
                    aria-placeholder={placeholder}
                    placeholder={
                      <div className={"ContentEditable__placeholder"}>
                        {placeholder}
                      </div>
                    }
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin externalHistoryState={historyState} />
            </>
          )}
          <div>{showTableOfContents && <TableOfContentsPlugin />}</div>
        </div>
      </div>
      <TestRawEditor />
    </Fragment>
  );
}

export default function Lexical({
  plugins: _plugins,
  isEditMode,
  value,
  onSave,
}) {
  const {
    plugins = [],
    nodes = [],
    shortcuts = [],
    contexts = [],
  } = useMemo(() => _plugins, [_plugins]);

  const _shortcuts = useMemo(() => {
    return (MUT_TRANSFORMERS.current = [
      ...DEFAULT_TRANSFORMERS,
      ...shortcuts,
      EQUATION,
      CODE,
      FRONTMATTER,
      TABLE,
    ]);
  }, [shortcuts]);

  const LexicalProvider = useMemo(
    () => combineContexts(SharedHistoryContext, ToolbarContext, ...contexts),
    [contexts]
  );
  const editorConfig = useMemo(
    () => ({
      editorState:
        function () {
          $convertFromMarkdownString(
            value,
            MUT_TRANSFORMERS.current,
            undefined,
            true
          );
        } ?? undefined,
      editable: isEditMode,
      html: {
        export: exportMap,
        import: constructImportMap(),
      },
      namespace: "React.js Demo",
      nodes: [...nodes, ...defaultNodes],
      onError(error) {
        throw error;
      },
      theme: lexicalTheme,
    }),
    []
  );
  return (
    <ThemeProvider theme={theme}>
      <SettingsContext>
        <LexicalComposer initialConfig={editorConfig}>
          <LexicalProvider>
            <TableContext>
              <ToolbarContext>
                <div
                  style={{
                    overflow: "hidden auto",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <Editor plugins={plugins} shortcuts={shortcuts} />
                </div>
              </ToolbarContext>
            </TableContext>
          </LexicalProvider>
        </LexicalComposer>
      </SettingsContext>
    </ThemeProvider>
  );
}

const theme = createTheme({ palette: { mode: "light" } });
