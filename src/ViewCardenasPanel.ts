import * as vscode from "vscode";
import { FlairProvider } from "./FlairProvider";

export class ViewCardenasPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: ViewCardenasPanel | undefined;

    public static readonly viewType = "viewStory";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _story: any;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, story: any) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        /* if (ViewStoryPanel.currentPanel) {
          ViewStoryPanel.currentPanel._panel.reveal(column);
          ViewStoryPanel.currentPanel._story = story;
          ViewStoryPanel.currentPanel._update();
          return;
        } */

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            ViewCardenasPanel.viewType,
            "View Story",
            column || vscode.ViewColumn.One,
            {
                // Enable javascript in the webview
                enableScripts: true,

                // And restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "media"),
                    vscode.Uri.joinPath(extensionUri, "out/compiled"),
                ],
            }
        );

        ViewCardenasPanel.currentPanel = new ViewCardenasPanel(
            panel,
            extensionUri,
            story
        );
    }

    public static revive(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        story: any
    ) {
        ViewCardenasPanel.currentPanel = new ViewCardenasPanel(
            panel,
            extensionUri,
            story
        );
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        story: string
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._story = story;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // // Handle messages from the webview
        // this._panel.webview.onDidReceiveMessage(
        //   (message) => {
        //     switch (message.command) {
        //       case "alert":
        //         vscode.window.showErrorMessage(message.text);
        //         return;
        //     }
        //   },
        //   null,
        //   this._disposables
        // );
    }

    public dispose() {
        ViewCardenasPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this._panel.webview;

        this._panel.webview.html = this._getHtmlForWebview(webview);
        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "close": {
                    vscode.commands.executeCommand("workbench.action.closeActiveEditor");
                    break;
                }
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
                case "tokens": {
                    /* await Util.context.globalState.update(
                        accessTokenKey,
                        data.accessToken
                    );
                    await Util.context.globalState.update(
                        refreshTokenKey,
                        data.refreshToken
                    ); */
                    break;
                }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out", "compiled/view-story.js")
        );

        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(
            this._extensionUri,
            "media",
            "reset.css"
        );
        const stylesPathMainPath = vscode.Uri.joinPath(
            this._extensionUri,
            "media",
            "vscode.css"
        );

        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
        const cssUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out", "compiled/view-story.css")
        );

        // Use a nonce to only allow specific scripts to be run
        // const nonce = getNonce();
        const story = this._story;

        this._panel.title = story.creatorUsername;

        if (story.flair in FlairProvider.flairUriMap) {
            const both = FlairProvider.flairUriMap[story.flair];
            this._panel.iconPath = {
                light: both,
                dark: both,
            };
        } else {
            this._panel.iconPath = undefined;
        }

        let currentUserId = "";
        try {
            /* const payload: any = jwt.decode(Util.getAccessToken());
            currentUserId = payload.userId; */
        } catch { }

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
            <body>
            adsdas
                <button class="button load-more hidden">Load More</button>
			</body>
			</html>`;
    }
}
