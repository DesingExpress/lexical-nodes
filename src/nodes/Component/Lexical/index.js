/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "../style.css";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $isTextNode, isHTMLElement, ParagraphNode, TextNode } from "lexical";

import { parseAllowedColor, parseAllowedFontSize } from "./styleConfig";
import lexicalTheme from "./theme";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { useEffect, useState } from "react";
import OnChangePlugin from "src/Component/Lexical/plugins/OnChangePlugin";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import defaultNodes from "./nodes";
import { MarkdownShortcutPlugin } from "./plugins/test";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "src/Component/Lexical/plugins/TablePlugin/TablePlugin";
import { TableContentsPlugin } from "src/Component/Lexical/plugins/TablePlugin/TableContentsPlugin";
import ComponentPickerMenuPlugin from "src/Component/Lexical/plugins/ComponentPickerPlugin";
import AutoEmbedPlugin from "src/Component/Lexical/plugins/AutoEmbedPlugin";
import CollapsiblePlugin from "src/Component/Lexical/plugins/CollapsiblePlugin";
import ExcalidrawPlugin from "src/Component/Lexical/plugins/ExcalidrawPlugin";
import { LayoutPlugin } from "src/Component/Lexical/plugins/LayoutPlugin";
import PageBreakPlugin from "src/Component/Lexical/plugins/PageBreakPlugin";
import PollPlugin from "src/Component/Lexical/plugins/PollPlugin";
import EquationsPlugin from "src/Component/Lexical/plugins/EquationsPlugin";

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

const editorConfig = {
  html: {
    export: exportMap,
    import: constructImportMap(),
  },
  namespace: "React.js Demo",
  theme: lexicalTheme,
  nodes: [...defaultNodes],
  onError(error) {
    throw error;
  },
};

export default function Editor({ editorRef }) {
  const [isModified, setModified] = useState(false);
  const [editorState, setEditorState] = useState();
  const [titleNode, setTitleNode] = useState();

  function onChange(editorState) {
    setModified(false);

    const editorStateJSON = editorState.toJSON();
    setEditorState(JSON.stringify(editorStateJSON));

    // 현재 첫번째줄 textNode가 제목으로 추출(추후 #태그가 붙는 문자열을 제목으로 추출해야함)
    const textNodes = Array.from(editorState._nodeMap.values()).filter(
      (node) => node.__type === "text"
    );
    const titleNode = textNodes[0]?.__text ?? null;
    setTitleNode(titleNode);
  }

  console.log(titleNode);

  // 사용자의 입력이 멈추고 3초 후 isModified를 true로 설정
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setModified(true);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [editorState]);

  // isModified가 true가 되면 auto save
  useEffect(() => {
    if (isModified && titleNode !== "" && editorState !== "") {
      // Save function
    }
  }, [isModified]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="editor-placeholder">{placeholder}</div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={onChange} />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <TablePlugin />
          <TableContentsPlugin />
          <TabIndentationPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin />
          <ComponentPickerMenuPlugin />
          <AutoEmbedPlugin />
          <CollapsiblePlugin />
          <ExcalidrawPlugin />
          <LayoutPlugin />
          <PageBreakPlugin />
          <PollPlugin />
          <CollapsiblePlugin />
          <EquationsPlugin />
          <EditorRefPlugin editorRef={editorRef} />
        </div>
      </div>
    </LexicalComposer>
  );
}
