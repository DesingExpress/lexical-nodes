import { useLayoutEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { basicSetup } from "codemirror";
import { useToolbarState } from "./context/ToolbarContext";

export default function TestRawEditor() {
  const ref = useRef();
  const { updateToolbarState } = useToolbarState();
  useLayoutEffect(() => {
    const _cm = new EditorView({
      extensions: [
        keymap.of(defaultKeymap.concat(indentWithTab, markdownKeymap)),
        basicSetup,
        markdown(),
        EditorView.lineWrapping,
      ],
    });
    updateToolbarState("getCMText", () => {
      return _cm.state.doc.toString();
    });
    updateToolbarState("setCMText", (v) => {
      return _cm.dispatch({
        changes: { from: 0, to: _cm.state.doc.length, insert: v },
      });
    });

    ref.current.appendChild(_cm.dom);
  }, []);
  return <div className="editor-raw" ref={ref} />;
}
