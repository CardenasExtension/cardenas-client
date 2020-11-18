import * as vscode from 'vscode';
import { window, StatusBarItem, StatusBarAlignment } from "vscode";

import { StorySidebarProvider } from './sidebarProvider';
import { Status } from './StatusBar';
import fetch from "node-fetch";
const FormData = require('form-data');


import {getSettings} from './utils';

let filename = "untitled";
let data: Array<[number, Array<vscode.TextDocumentContentChangeEvent>]> = [];
let startingText = "";
let language = "";

export function activate(context: vscode.ExtensionContext) {
	console.log('Cardenas active');

	
	const status = new Status();
	status.show();

	// Code Preview
	const provider = new StorySidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("cardenasPanel", provider)
	);

	// Sidebar
	const provider2 = new StorySidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("cardenas-full", provider2)
	);

	vscode.commands.registerCommand("cardenas.saveFile", async () => {
		if (!true) {
		  const choice = await vscode.window.showInformationMessage(
			`You need to login to GitHub to record a story, would you like to continue?`,
			"Yes",
			"Cancel"
		  );
		  if (choice === "Yes") {
			// authenticate();
		  }
		  return;
		}
	
		if (!vscode.window.activeTextEditor) {
		  vscode.window.showInformationMessage(
			"Open a file to save (CARDENAS)"
		  );
		  return;
		}


		filename = vscode.window.activeTextEditor.document.fileName;
		startingText = vscode.window.activeTextEditor.document.getText();
		language = vscode.window.activeTextEditor.document.languageId;

		const extensionSettings = getSettings('codesnap', [
			'backgroundColor',
			'boxShadow',
			'containerPadding',
			'roundedCorners',
			'showWindowControls',
			'showWindowTitle',
			'showLineNumbers',
			'realLineNumbers',
			'transparentBackground',
			'target'
		  ]);

		  
		const editorSettings = getSettings('editor', ['fontLigatures', 'tabSize']);
		const editor = vscode.window.activeTextEditor;
		if (editor) editorSettings.tabSize = editor.options.tabSize;
		  
		const activeFileName = editor.document.uri.path.split('/').pop();

		var formData = new FormData();
		formData.append('code', startingText);
		formData.append('image', '');
		formData.append('filename', activeFileName);
		formData.append('create_by', '12');
		formData.append('language', language);
		formData.append('extensionSettings', JSON.stringify(extensionSettings));
		formData.append('editorSettings', JSON.stringify(editorSettings));

		fetch('https://cardenasvscode.000webhostapp.com/controllers/publish.php', {method: 'POST', body: formData})
		.then(response => response.json())
		.then(data => {
			vscode.window.showInformationMessage(
				activeFileName + " uploaded successfully"
			);
		}).catch(e => {
			vscode.window.showErrorMessage(
				e
			);
		})
	  });
	
}

// this method is called when your extension is deactivated
export function deactivate() {}
