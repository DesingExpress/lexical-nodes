"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import * as React from "react";
import { registerMarkdownShortcuts } from "src/packages/@lexical/markdown";
// import { registerMarkdownShortcuts } from '../../../packages/@lexical/markdown/MarkdownShortcuts.js'
// import { useEditorConfigContext } from '../../config/client/EditorConfigProvider.js'
export const MarkdownShortcutPlugin = () => {
    // const { editorConfig } = useEditorConfigContext()
    const [editor] = useLexicalComposerContext();
    React.useEffect(() => {
        return registerMarkdownShortcuts(editor, []);
    }, [editor]); //,editorConfig.features.markdownTransformers])
    return null;
};
