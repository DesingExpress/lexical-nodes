import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { basicSetup } from "codemirror";
import { useToolbarState } from "./context/ToolbarContext";
import clsx from "clsx";
import { styled } from "@mui/material";

const StyledDiv = styled("div")(({ theme }) => ({
  position: "absolute",
  inset: theme.spacing(4.5, 0, 0, 0),
  display: "none",
  color: "#000",
  [`&.visible`]: {
    display: "block",
    overflow: "hidden auto",
    zIndex: 1,
    backgroundColor: "#fff",
  },
}));
export default function TestRawEditor() {
  const ref = useRef();
  const { updateToolbarState } = useToolbarState();
  const [isRaw, setRaw] = useState(false);

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
      setRaw(false);
      return _cm.state.doc.toString();
    });
    updateToolbarState("setCMText", (v) => {
      setRaw(true);
      return _cm.dispatch({
        changes: { from: 0, to: _cm.state.doc.length, insert: v },
      });
    });

    ref.current.appendChild(_cm.dom);
  }, []);

  return <StyledDiv className={clsx(isRaw && "visible")} ref={ref} />;
}
