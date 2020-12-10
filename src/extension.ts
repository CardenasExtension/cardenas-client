import * as vscode from 'vscode';
import { window } from "vscode";
import { Credentials } from './credentials';

import { StorySidebarProvider } from './sidebarProvider';
import { Status } from './StatusBar';

import { multiStepInput } from './submitInput';

export async function activate(context: vscode.ExtensionContext) {
	const status = new Status();
	status.show();
	const credentials = new Credentials();
	await credentials.initialize(context);
	const octokit = await credentials.getOctokit();
	const userInfo = await octokit.users.getAuthenticated();

	// Code Preview
	const provider = new StorySidebarProvider(context.extensionUri, context, userInfo);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("cardenasPanel", provider)
	);

	// Sidebar
	const provider2 = new StorySidebarProvider(context.extensionUri, context, userInfo);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("cardenas-full", provider2)
	);

	vscode.commands.registerCommand('cardenas.authenticate', async () => {
		vscode.window.showInformationMessage(`Cardenas: Login as ${userInfo.data.login}`);
	});

	
	vscode.commands.registerCommand("cardenas.logout", async () => {
	})

	vscode.commands.registerCommand("cardenas.saveFile", async () => {
		const octokit = await credentials.getOctokit();
		const userInfo = await octokit.users.getAuthenticated();
		if (!userInfo) {
		  const choice = await vscode.window.showInformationMessage(
			`You need to login to GitHub to upload a resource, would you like to continue?`,
			"Yes",
			"Cancel"
		  );
		  if (choice === "Yes") {
			vscode.commands.executeCommand('cardenas.authenticate', async () => {
				vscode.commands.executeCommand('cardenas.saveFile');
			});
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
