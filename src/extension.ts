import * as vscode from 'vscode';
import { window, StatusBarItem, StatusBarAlignment } from "vscode";

import { StorySidebarProvider } from './sidebarProvider';
import { Status } from './StatusBar';

import { multiStepInput } from './submitInput';

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

		const options: { [key: string]: (context: vscode.ExtensionContext) => Promise<void> } = {
			multiStepInput,
		};
		const quickPick = window.createQuickPick();
		quickPick.items = Object.keys(options).map(label => ({ label }));
		quickPick.onDidChangeActive(selection => {
			console.log(selection);
			if (selection[0]) {
				options[selection[0].label](context)
					.catch(console.error);
			}
		});
		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	  });
	
}

// this method is called when your extension is deactivated
export function deactivate() {}
