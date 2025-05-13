export const useEditorConfigContext = () => ({
    // Editor focus handling
    blurEditor: (editorContext) => { },
    childrenEditors: undefined,
    createdInlineBlock: undefined,
    editor: undefined,
    editorConfig: { admin: { hideGutter: false } },
    editorContainerRef: undefined,
    fieldProps: undefined,
    focusedEditor: undefined,
    // Editor focus handling
    focusEditor: (editorContext) => { },
    parentEditor: undefined,
    registerChild: (uuid, editorContext) => { },
    setCreatedInlineBlock: undefined,
    unregisterChild: (uuid) => { },
    uuid: "",
});
