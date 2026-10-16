import { useEffect, useMemo, useRef } from "react"
import { useTheme } from "next-themes";
import {basicSetup } from "codemirror"
import { EditorView, keymap } from "@codemirror/view";
import { Compartment } from "@codemirror/state";
import {oneDark} from "@codemirror/theme-one-dark";
import { customTheme } from "../extensions/theme";
import { getLanguageExtension } from "../extensions/language-extension";
import {indentWithTab} from "@codemirror/commands";
import { minimap } from "../extensions/minimap";
import {indentationMarkers} from "@replit/codemirror-indentation-markers"
import { customSetup } from "../extensions/custom-setup";
import { suggestion } from "../extensions/suggestion";
import { quickEdit } from "../extensions/quick-edit";
import { selectionTooltip } from "../extensions/selection-tooltip";


interface Props {
    fileName: string;
    initialValue?: string;
    onChange: (value: string)=>void;
}

export const CodeEditor = ({fileName, initialValue="", onChange}: Props)=>{
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    // Lets the theme switch without recreating the editor (keeps undo history)
    const themeCompartmentRef = useRef(new Compartment());

    const { resolvedTheme } = useTheme();
    // Light mode drops oneDark and falls back to defaultHighlightStyle from customSetup
    const isDark = resolvedTheme !== "light";

    const languageExtension = useMemo(()=> getLanguageExtension(fileName), [fileName])

    useEffect(()=>{

        if(!editorRef.current) return;

        const view = new EditorView({
            doc: initialValue,
            parent: editorRef.current,
            extensions: [
                themeCompartmentRef.current.of(isDark ? oneDark : []),
                customTheme,
                customSetup,
                languageExtension,
                suggestion(fileName),
                quickEdit(fileName),
                selectionTooltip(),
                keymap.of([indentWithTab]),
                minimap(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString());
                    }
                })
                // indentationMarkers(),
                // EditorView.theme({
                //     "&": { backgroundColor: "transparent" },
                //     ".cm-scroller": { backgroundColor: "transparent" },
                //     ".cm-gutters": { backgroundColor: "transparent", border: "none" },
                // }),
            ]
        });
        viewRef.current = view;

        return ()=>{
            view.destroy();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- initialValue is only used for initial document
    },[languageExtension])

    useEffect(()=>{
        viewRef.current?.dispatch({
            effects: themeCompartmentRef.current.reconfigure(isDark ? oneDark : []),
        });
    },[isDark])

    return (
        <div ref={editorRef} className="size-full bg-background" />
    );
};