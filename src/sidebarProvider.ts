import * as vscode from "vscode";
import { ViewCardenasPanel } from "./ViewCardenasPanel";
import fetch from "node-fetch";

import { FlairProvider } from "./FlairProvider";
import { getNonce } from "./getNonce";

export class StorySidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onStoryPress": {
          console.log(data);
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
          fetch('http://localhost/www/Cardenas/src/controllers/publish.php')
          .then(response => response.json())
          .then(data => console.log(data))
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
        </link>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
        <style>
            body {
                background: transparent !important;
            }
    
            .card {
                height: 230px;
            }
    
            .card[class|=col] {
                float: none;
                display: inline-block;
                position: relative;
                background: var(--vscode-input-background);
                margin-top: 12px;
                margin-bottom: 12px;
                border: none;
                vertical-align: top;
                border-radius: 10px;
            }
    
    
            .card__image {
                height: 100px;
                width: 100%;
                -o-object-fit: cover;
                object-fit: cover;
                background: #949494;
                margin-top: 10px;
            }
    
            .card__title {
                min-height: 25px;
                // background: #7d7d7d;
                background: transparent;
                margin-top: 5px;
            }
    
            .card__version {
                position: absolute;
                right: 10px;
                bottom: 10px;
                min-height: 15px;
                min-width: 70px;
                // background: #ababab;
                background: #FFF;
                padding: 5px;
            }
            @media screen and (max-width: 600px) {
              .card[class|=col] {
                width: 90%;
                margin: 6px auto;
              }
            }
        </style>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleResetUri}" rel="stylesheet">
            <link href="${styleVSCodeUri}" rel="stylesheet">
            <link href="${styleMainUri}" rel="stylesheet">

            <script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
            <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    </head>
    
    <body>
    <div id="app">
        <div class="container" style="margin-top: 10px">
            <div class="row">
                <div class="col-12 p-0">
                    <div class="input-group">
                        <div class="input-group-btn search-panel">
                            <button type="button" class="btn btn-dark dropdown-toggle" data-toggle="dropdown">
                                <span id="search_concept">All</span> <span class="caret"></span>
                            </button>
                            <ul class="dropdown-menu" role="menu">
                                <li><a href="#" onClick="changeFilter('All')">All</a></li>
                                <li><a href="#" onClick="changeFilter('Templates')">Templates</a></li>
                                <li><a href="#" onClick="changeFilter('Algorithms')">Algorithms</a></li>
                                </li>
                                <li class="divider"></li>
                                <li><a href="#all"></a></li>
                            </ul>
                        </div>
                        <input type="hidden" name="search_param" value="all" id="search_param">
                        <input @keyup.enter="search()" type="text" class="form-control" style="padding-left: 10px" id="searchInput" placeholder="Search...">
                    </div>
                </div>
            </div>
            <section class="col-12 p-0 m-0" style="margin-top: 20px">
                <div class="row-fluid p-0 col-12 text-center">
                    <div class="col-xl-2 col-lg-2 col-md-3 col-sm-4 col-xs-5 card"
                        v-for="item in items" v-bind:key="item.id">
                        <div class="card__image" v-bind:style="'background-image: url(' + item.image +')'" style="background-repeat: no-repeat; background-size: cover"></div>
                        <div class="card__title"><span class="text-white">{{item.filename}} ({{item.language}})</span></div>
                        <div class="card__version"><b class="text-primary">{{item.create_by}}</b></div>
                        <div class="col-12 d-flex justify-content-between" style="position: absolute; top: 10;right: 10;">
                          <button class="btn btn-sm btn-ligth"><i class="text-danger glyphicon glyphicon-heart"></i><span class="text-white"> 12k</span></button>
                          <button class="btn btn-sm btn-ligth" v-on:click="selectOne(item)">View</button>
                        </div>
                    </div>
                </div>
            </section>
            </div>
        </body>
        <script nonce="${nonce}">
          var app = new Vue({
            el: '#app',
            data: {
              items: [{"id":"7","code":'asdasddsa',"filename":"Unnamed 1","image":"https://img-cdn.tnwcdn.com/image?fit=1280%2C720&url=https%3A%2F%2Fcdn0.tnwcdn.com%2Fwp-content%2Fblogs.dir%2F1%2Ffiles%2F2020%2F03%2Fcode-1076536_1920.jpg&signature=2e75357e1e9b104caa33cb3a545dcbeb","language":"html","create_by":"Juan Mastrangelo","create_at":"2020-11-16 16:37:01"}]
            },
            methods: {
              search: function() {
                document.getElementById('search_concept').disabled = true;
                var that = this;
                axios.get('http://localhost/www/Cardenas/src/controllers/publish.php')
                .then(function (response) {
                  that.items = response;
                })
                .catch(function (error) {
                  vscode.postMessage({ type: 'onError', value: error.toString() });
                }).then(() => {document.getElementById('search_concept').disabled = false})
              },
              selectOne: function(item) {
                vscode.postMessage({ type: 'onStoryPress', value: item });
              }
            }
          })

          const vscode = acquireVsCodeApi();


          function changeFilter(val) {
            document.getElementById('search_concept').innerHTML = val;
            vscode.postMessage({ type: 'refreshData' });
          }


          

      </script>
    </html>`;
  }
}