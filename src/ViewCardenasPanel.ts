import * as vscode from "vscode";
import { getNonce } from "./getNonce";

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
        if (ViewCardenasPanel.currentPanel) {
            ViewCardenasPanel.currentPanel._panel.reveal(column);
            ViewCardenasPanel.currentPanel._story = story;
            ViewCardenasPanel.currentPanel._update();
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            ViewCardenasPanel.viewType,
            "CARDENAS",
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
        const story = this._story;

        this._panel.title = story.filename;

        try {
            /* const payload: any = jwt.decode(Util.getAccessToken());
            currentUserId = payload.userId; */
        } catch { }
        
        const nonce = getNonce();

        const viewStyleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "viewStyle.css")
        );
        const viewScriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "viewScript.js")
        );

        
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"></link>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.6/clipboard.min.js"></script>

                <link href="${viewStyleUri}" rel="stylesheet" type="text/css" media="screen">
                <script src="${viewScriptUri}"></script>

                
                <script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/fetch/3.5.0/fetch.min.js"></script>
			</head>
            <body style="margin: 0!important;padding:0!important;">
                <div id="app" class="col-12 p-3">
                
                <h2 class="title mb-4">
                    ${this._story.filename}
                    <small>by ${this._story.create_by} using ${this._story.language}</small>
                </h2>
                <section class='code-editor' style="margin-top: 0px;">
                    <div class='embed-nav'>
                    <ul class="m-0">
                        <li style="list-style: none;">
                        <a href='#html-box' class='active'>
                            ${this._story.language}
                        </a>
                        <i class="fa fa-clipboard fullscreen copyButton" v-on:click="copied()" data-clipboard-target="#foo"></i>
                        <span v-if="coping" class="copyText">Copied</span>
                    </ul>
                    <div class='logo-wrap'>
                        <a href='#' target='_blank' title='Edit on CodePen'>
                        Edit on codepen
                        </a>
                    </div>
                    </div>
                    <pre class='line-numbers'>
                        <code class='language-html' id="foo">
${this._story.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                        </code>
                    </pre>
                </section>
                <!-- <div class="col-12 d-flex justify-content-center">
                    <button class="btn btn-sm btn-danger" v-on:click="delete(item)">
                        <i class="fa fa-trash"></i> Delete snippet
                    </button>
                </div> -->
                </div>


                <script nonce="${nonce}">
                    var app = new Vue({
                        el: '#app',
                        data: {
                            coping: false
                        },
                        methods: {
                            copied: function() {
                                this.coping = true;
                            }
                        },
                        mounted() {
                            vscode.postMessage({ type: 'onError', value: 'entre' });
                        }
                    })
                    new ClipboardJS('.copyButton');
                    const vscode = acquireVsCodeApi();
                </script>
            </body>
        </html>`;
    }
}
