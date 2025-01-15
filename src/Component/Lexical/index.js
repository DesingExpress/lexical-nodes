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

import { MarkdownShortcutPlugin } from "#/@payload/richtext-lexical/src/lexical/plugins/MarkdownShortcutPlugin";

import { Fragment, useMemo, useState } from "react";
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

function Editor() {
  const {
    settings: { isRichText },
  } = useSettings();
  const { historyState } = useSharedHistoryContext();

  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };
  return (
    <Fragment>
      <div className="editor-shell">
        <ToolbarPlugin
          editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          setIsLinkEditMode={setIsLinkEditMode}
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
              <ListPlugin />
              <MarkdownShortcutPlugin plugins={[EQUATION, CODE, FRONTMATTER]} />
              <EquationsPlugin />
              <HorizontalRulePlugin />

              {floatingAnchorElem && (
                <>
                  <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                  {/* <CodeActionMenuPlugin anchorElem={floatingAnchorElem} /> */}
                  {/* <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                /> */}
                  {/* <TableCellActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge={true}
                /> */}
                  {/* <TableHoverActionsPlugin anchorElem={floatingAnchorElem} /> */}
                  <FloatingTextFormatToolbarPlugin
                    anchorElem={floatingAnchorElem}
                    setIsLinkEditMode={setIsLinkEditMode}
                  />
                </>
              )}
              <InlineImagePlugin />
              <ImagesPlugin />
              {/* <SlashMenuPlugin anchorElem={floatingAnchorElem} /> */}
            </div>
          ) : (
            <>
              <PlainTextPlugin
                contentEditable={
                  <ContentEditable
                    className={"ContentEditable__root"}
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
        </div>
      </div>
      <TestRawEditor />
    </Fragment>
  );
}

export default function Lexical() {
  const editorConfig = useMemo(
    () => ({
      html: {
        export: exportMap,
        import: constructImportMap(),
      },
      namespace: "React.js Demo",
      nodes: [...defaultNodes],
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
          <SharedHistoryContext>
            <ToolbarContext>
              <div
                style={{
                  overflow: "hidden auto",
                  height: "100%",
                  width: "100%",
                }}
              >
                <Editor />
              </div>
            </ToolbarContext>
          </SharedHistoryContext>
        </LexicalComposer>
      </SettingsContext>
    </ThemeProvider>
  );
}

const theme = createTheme({ palette: { mode: "light" } });
