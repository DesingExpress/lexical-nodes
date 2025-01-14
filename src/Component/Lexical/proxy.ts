export const useEditorConfigContext = () => ({
  // Editor focus handling
  blurEditor: (editorContext: any) => {},
  childrenEditors: undefined,
  createdInlineBlock: undefined,
  editor: undefined,
  editorConfig: { admin: { hideGutter: false } },

  editorContainerRef: undefined,
  fieldProps: undefined,
  focusedEditor: undefined,
  // Editor focus handling
  focusEditor: (editorContext: any) => {},
  parentEditor: undefined,
  registerChild: (uuid: any, editorContext: any) => {},
  setCreatedInlineBlock: undefined,
  unregisterChild: (uuid: any) => {},
  uuid: "",
});
