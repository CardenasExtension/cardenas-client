import * as vscode from 'vscode';

export const getSettings = (group: any, keys: any) => {
    const settings = vscode.workspace.getConfiguration(group, null);
    const editor = vscode.window.activeTextEditor;
    const language = editor && editor.document && editor.document.languageId;
    const languageSettings = language && vscode.workspace.getConfiguration(null, null).get(`[${language}]`);
    return keys.reduce((acc: any, k: any) => {
        acc[k] = languageSettings && languageSettings[`${group}.${k}`];
        if (acc[k] == null) acc[k] = settings.get(k);
        return acc;
    }, {});
};