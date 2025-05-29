import {
  Autocomplete,
  autocompleteClasses,
  ButtonBase,
  buttonBaseClasses,
  IconButton,
  inputBaseClasses,
  outlinedInputClasses,
  Paper,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/EditOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { grey } from "@mui/material/colors";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { EditorState as codemirrorState } from "@codemirror/state";

const StyledCodeBlock = styled(Paper)(({ theme }) => ({
  overflow: "hidden",
  backgroundColor: grey[100],
  [`& > .code-title`]: {
    backgroundColor: grey[300],
    padding: theme.spacing(0, 1),
    borderRadius: "4px 4px 0 0",
    [`& > form.editmode`]: {
      width: "100%",
      display: "inline-flex",
      [`& > .${buttonBaseClasses.root}`]: {
        width: 45,
        height: 45,
      },
    },
  },
  [`& > .code-language-wrapper`]: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    overflow: "hidden",
    [`& .${autocompleteClasses.root}`]: {
      borderRadius: "0 0 4px 4px",
      backgroundColor: grey[200],
      [`& .${outlinedInputClasses.notchedOutline}`]: {
        border: "unset",
      },
      [`& .${inputBaseClasses.root}`]: {
        ...theme.typography.caption,
        paddingRight: "32px !important",
      },
    },
  },
}));

export default function CodeBlockComponent({
  cm,
  language,
  languageList,
  keymap: keymapConf,
  onUpdateLanguage,
  meta,
  test,
  editorState,
  ...props
}) {
  const ref = useRef();
  const [isEidtMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(meta.title);
  const isEditable = useLexicalEditable();

  // const isEditable = useLexicalEditable();

  function handleClickEditMode() {
    setEditMode(true);
  }
  function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    const title = new FormData(e.target).get("title");
    meta.title = title;
    setTitle(title);
    setEditMode(false);
  }
  function handleChange(_, v) {
    onUpdateLanguage(v);
  }
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
    <StyledCodeBlock elevation={0}>
      <Paper className="code-title" elevation={0}>
        {isEidtMode ? (
          <form className="editmode" onSubmit={handleSubmit}>
            <TextField
              variant="standard"
              label="title"
              name="title"
              fullWidth
              size="small"
              placeholder="Untitled"
              defaultValue={title}
            />
            <ButtonBase type="submit">
              <CheckOutlinedIcon />
            </ButtonBase>
          </form>
        ) : (
          <Fragment>
            <Typography variant="caption">{title ?? "Untitled"}</Typography>
            {isEditable && (
              <IconButton size="small" onClick={handleClickEditMode}>
                <EditIcon fontSize="inherit" />
              </IconButton>
            )}
          </Fragment>
        )}
      </Paper>
      {isEditable && (
        <div className="code-language-wrapper">
          <Autocomplete
            size="small"
            disablePortal
            options={languageList}
            defaultValue={language}
            onChange={handleChange}
            sx={{ maxWidth: "100%", width: 200 }}
            renderInput={(params) => <TextField {...params} />}
            clearIcon={false}
          />
        </div>
      )}
      <div ref={ref} />
    </StyledCodeBlock>
  );
}
