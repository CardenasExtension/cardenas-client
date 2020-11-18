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
          fetch('https://cardenasvscode.000webhostapp.com/controllers/publish.php')
          .then(response => response.json())
          .then(data => console.log(data))
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleSideBar = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "sidebarStyle.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
        
        <link href="${styleSideBar}" rel="stylesheet" type="text/css" media="screen" />
        

        <script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/fetch/3.5.0/fetch.min.js"></script>
    </head>
    
    <body>
    <div id="app">
        <div class="container" style="margin-top: 10px">
            <div class="row">
                <div class="col-12 p-0">
                    <div class="input-group">
                        <div class="input-group-btn search-panel dropdown">
                            <button type="button" class="btn btn-dark dropdown-toggle" data-toggle="dropdown">
                                <span id="search_concept">All</span> <span class="caret"></span>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onClick="changeFilter('All')">All</a></li>
                                <li><a class="dropdown-item" href="#" onClick="changeFilter('Templates')">Templates</a></li>
                                <li><a class="dropdown-item" href="#" onClick="changeFilter('Algorithms')">Algorithms</a></li>
                            </ul>
                        </div>
                        <input type="hidden" name="search_param" value="all" id="search_param">
                        <input @keyup.enter="search()" type="text" class="form-control" style="padding-left: 10px" id="searchInput" placeholder="Search...">
                    </div>
                </div>
            </div>
          </div>
            
            <div class="row mt-3">
              <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 my-2" v-for="item in items" v-bind:key="item.id">
                <div class="col-12 p-0 window">
                  <div class="window-header">
                    <div class="action-buttons"></div>
                    <button class="btn btn-sm btn-ligth language" v-on:click="selectOne(item)">View</button>
                  </div>
                  <div class="window-body">
                      <textarea class="code-input">
// {{item.filename}}
// using {{item.language}}
// likes 12k
// By {{item.create_by}}
                      </textarea>
                      <pre class="code-output"><code class="language-javascript"></code></pre>
                  </div>
                </div>
              </div>
            </div>
        </body>
        <script nonce="${nonce}">
          var app = new Vue({
            el: '#app',
            data: {
              items: []
            },
            methods: {
              search: function() {
                document.getElementById('search_concept').disabled = true;
                
                fetch("https://cardenasvscode.000webhostapp.com/controllers/publish.php", {method: 'GET'})
                .then(response => response.text())
                .then(result => {
                  document.getElementById('search_concept').disabled = false;
                  this.items = JSON.parse(result);
                })
                .catch(error => {
                  vscode.postMessage({ type: 'onError', value: error.message });
                  document.getElementById('search_concept').disabled = false;
                });


              },
              selectOne: function(item) {
                vscode.postMessage({ type: 'onStoryPress', value: item });
              }
            },
            mounted() {
              this.search();
            }
          })

          const vscode = acquireVsCodeApi();


          function changeFilter(val) {
            document.getElementById('search_concept').innerHTML = val;

            fetch("https://cardenasvscode.000webhostapp.com/controllers/publish.php", {method: 'GET'})
            .then(response => response.text())
            .then(result => {
              document.getElementById('search_concept').disabled = false;
              this.items = JSON.parse(result);
            })
            .catch(error => {
              vscode.postMessage({ type: 'onError', value: error.message });
              document.getElementById('search_concept').disabled = false;
            });
          }


          

      </script>
    </html>`;
  }
}