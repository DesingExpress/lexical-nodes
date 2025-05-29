import {
  Accordion,
  AccordionDetails,
  accordionDetailsClasses,
  AccordionSummary,
  accordionSummaryClasses,
  styled,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { grey } from "@mui/material/colors";
import { useEffect, useLayoutEffect, useRef } from "react";
import { EditorState as codemirrorState } from "@codemirror/state";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";

const StyledFrontmatterWrapper = styled(Accordion)(({ theme }) => ({
  [`& .${accordionSummaryClasses.root}`]: {
    minHeight: "unset !important",
    backgroundColor: grey[200],
    [`& > .${accordionSummaryClasses.content}`]: {
      margin: 0,
    },
  },
  [`& .${accordionDetailsClasses.root}`]: {
    backgroundColor: grey[200],
    padding: theme.spacing(0, 1),
    [`& .cm-gutters`]: { display: "none" },
  },
}));

export default function FrontmatterComponent({ cm, editorState }) {
  const ref = useRef();
  const isEditable = useLexicalEditable();

  useLayoutEffect(() => {
    ref.current.appendChild(cm.dom);
  }, []);

  useEffect(() => {
    cm.dispatch({
      effects: editorState.reconfigure(
        codemirrorState.readOnly.of(!isEditable)
      ),
    });
  }, [isEditable]);

  return (
    <StyledFrontmatterWrapper component="span">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="caption">METADATA</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <div ref={ref} />
      </AccordionDetails>
    </StyledFrontmatterWrapper>
  );
}
