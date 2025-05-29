import {
  Autocomplete,
  autocompleteClasses,
  Badge,
  Button,
  IconButton,
  ListItemText,
  Paper,
  paperClasses,
  styled,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/EditOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { grey } from "@mui/material/colors";
import { useSlot } from "../../../context/SlotContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { EditorState as codemirrorState } from "@codemirror/state";

const RULESET_TITLE_REGEX = /^(\[[^[]+\])(?:\s*)?(.*)/;
const StyledRulesetBlock = styled(Badge)(({ theme }) => ({
  display: "block",
  [`& .${paperClasses.root}`]: {
    overflow: "hidden",
    backgroundColor: grey[100],
    [`& > .ruleset-title`]: {
      backgroundColor: grey[300],
      padding: theme.spacing(0, 1),
      borderRadius: "4px 4px 0 0",

      [`& > form.editmode`]: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        padding: theme.spacing(1, 0),
        [`& .${autocompleteClasses.root}`]: {
          marginBottom: theme.spacing(1),
          // width: 45,
          // height: 45,
        },
      },
    },
  },
}));

export default function RulesetBlockComponent({
  cm,
  language,
  languageList,
  editorState,
  meta,
  ...props
}) {
  const ref = useRef();
  const [isEidtMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(meta.title);
  const [code, setCode] = useState(meta.code);
  const [isNew, setNew] = useState(false);
  const handleSlot = useSlot();
  const isEditable = useLexicalEditable();

  function handleClickEditMode() {
    setEditMode(true);
  }
  function handleClickExecution() {
    const result = cm.state.doc.toString() ?? "";
    handleSlot(3, result);
    handleSlot(2);
  }
  function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const value = new FormData(e.target).get("code-title") ?? "";
    const [, code = "", title = ""] = RULESET_TITLE_REGEX.exec(value) ?? [];
    const _code = code.trim();
    const _title = title.trim();

    if (_code === "" || _title === "") {
      return;
    }

    meta.title = _title;
    meta.code = _code;
    setTitle(_title);
    setCode(_code);

    setEditMode(false);
    setNew(true);
  }

  function handleClose() {
    setEditMode(false);
  }
  function handleChange(_, v) {}
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
    <StyledRulesetBlock badgeContent="new" color="primary" invisible={!isNew}>
      <Paper className="wrapper" elevation={0}>
        <Paper className="ruleset-title" elevation={0}>
          {isEidtMode ? (
            <form className="editmode" onSubmit={handleSubmit}>
              <Autocomplete
                fullWidth
                size="small"
                freeSolo
                disablePortal
                options={[]}
                defaultValue={`[${code ?? "code"}] ${title ?? "Untitled"}`}
                onChange={handleChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name="code-title"
                    label="[code] title"
                    variant="standard"
                  />
                )}
                clearIcon={false}
              />
              <div
                style={{ display: "inline-flex", justifyContent: "flex-end" }}
              >
                <Button variant="text" size="small" type="submit">
                  새로 만들기
                </Button>
                <Button variant="text" size="small" disabled>
                  수정
                </Button>
                <Button variant="text" size="small" onClick={handleClose}>
                  취소
                </Button>
              </div>
            </form>
          ) : (
            <div
              style={{
                display: "inline-flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <ListItemText
                primary={code ?? ""}
                secondary={title ?? "Untitled"}
                secondaryTypographyProps={{ variant: "caption" }}
              />
              <div>
                {isEditable && (
                  <IconButton size="small" onClick={handleClickEditMode}>
                    <EditIcon fontSize="inherit" />
                  </IconButton>
                )}
                <IconButton size="small" onClick={handleClickExecution}>
                  <PlayArrowOutlinedIcon fontSize="inherit" />
                </IconButton>
              </div>
            </div>
          )}
        </Paper>
        <div ref={ref} />
      </Paper>
    </StyledRulesetBlock>
  );
}

/**
 * {
 * id:Option<string>
 * name:Option<string>
 * query:string}
 */
