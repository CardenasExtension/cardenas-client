import * as vscode from "vscode";
import { ViewCardenasPanel } from "./ViewCardenasPanel";
import fetch from "node-fetch";

const fs = require('fs');

import { getNonce } from "./getNonce";
import { Credentials } from "./credentials";
import FormData = require("form-data");
import { URL } from "./constants";

export class StorySidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  userInfo: any = null;
  context: vscode.ExtensionContext;

  constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext, userInfo: any) {
    this.context = context;
    this.userInfo = userInfo;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };


    const htmlPathOnDisk = vscode.Uri.joinPath(this._extensionUri, "media", "sidebar.html")
    fs.readFile(htmlPathOnDisk.path.replace("c:/", ""), 'utf-8', (err: any, data: any) => this._getHtmlForWebview(err, data, webviewView.webview));
    

    

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onStoryPress": {
          if (!data.value) {
            return;
          }
          ViewCardenasPanel.createOrShow(this._extensionUri, data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "refreshData": {
          console.log("refreshData");
          fetch(`${URL}/templates`)
          .then(response => response.json())
          .then(data => console.log(data))
          break;
        }
        case "like": {
          var formData = new FormData();
          formData.append('idUser', this.userInfo.data.id);
          formData.append('idPost', data.value.id);
          fetch('https://cardenasvscode.000webhostapp.com/controllers/like.php', {method: 'POST', body: formData})
          .then(response => response.json())
          .then(data => vscode.window.showInformationMessage('Liked snippet'))
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(err: any, data: string,webview: vscode.Webview) {
    const styleSideBar = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "sidebarStyle.css")
    );

    if (err) {
      console.log(err);
      throw err;
    }
    data = data.replace('./sidebarStyle.css', styleSideBar.toString());
    data = data.replace('##userID##', this.userInfo.data.id);
    webview.html = data;
  }
}