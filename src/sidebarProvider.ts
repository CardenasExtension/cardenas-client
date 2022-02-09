import * as vscode from "vscode";
import { ViewCardenasPanel } from "./ViewCardenasPanel";
import fetch from "node-fetch";

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

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
        
        <link href="${styleSideBar}" rel="stylesheet" type="text/css" media="screen" />
        

        <script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/fetch/3.5.0/fetch.min.js"></script>
    </head>
    
    <body>
    <div id="app">
          <ul class="nav nav-pills mt-3 mb-1 d-flex justify-content-between" id="pills-tab" role="tablist">
            <li class="nav-item">
              <a class="nav-link active py-1" title="" id="pills-search-tab" data-toggle="pill" href="#pills-search" role="tab" aria-controls="pills-search" aria-selected="true"><small>Search</small></a>
            </li>
            <!--
            <li class="nav-item">
              <a class="nav-link py-1" title="" id="pills-liked-tab" data-toggle="pill" href="#pills-liked" role="tab" aria-controls="pills-liked" aria-selected="false"><small>Liked <i class="fa fa-refresh ml-1" v-on:click="likes()"></i></small></a>
            </li> -->
            <li class="nav-item">
              <a class="nav-link py-1" title="" id="pills-my-tab" data-toggle="pill" href="#pills-my" role="tab" aria-controls="pills-my" aria-selected="false"><small>My <i class="fa fa-refresh ml-1" v-on:click="getMyItems()"></i></small></a>
            </li>
          </ul>
          <div class="tab-content" id="pills-tabContent">
            <div class="tab-pane fade show active" id="pills-search" role="tabpanel" aria-labelledby="pills-search-tab">
            
            <div class="container mt-3">
              <div class="row">
                  <div class="col-12 p-0">
                      <div class="input-group">
                          <!--<div class="input-group-btn search-panel dropdown">
                              <button type="button" class="btn btn-sm btn-dark dropdown-toggle" data-toggle="dropdown" :disabled="loadingTab1">
                                  <span id="search_concept">
                                  {{typeSelected}}
                                  </span> <span class="caret"></span>
                              </button>
                               <ul class="dropdown-menu">
                                  <li><a class="dropdown-item" href="#" v-on:click="changeFilter('All')">All</a></li>
                                  <li><a class="dropdown-item" href="#" v-on:click="changeFilter('Template')">Template</a></li>
                                  <li><a class="dropdown-item" href="#" v-on:click="changeFilter('Algorithm')">Algorithm</a></li>
                              </ul>
                          </div> -->
                          <input type="hidden" name="search_param" value="all" id="search_param" disabled="loadingTab3">
                          <input @keyup.enter="search()" type="text" class="form-control form-control-sm" style="padding-left: 10px" id="searchInput" placeholder="Search..." :disabled="loadingTab1">
                      
                          <button type="button" class="btn btn-sm btn-dark" v-on:click="search()">
                            Search
                          </button>
                      </div>
                  </div>
              </div>
            </div>

            <div v-if="loadingTab1" class="col-12 d-flex justify-content-center mt-3">
              <div class="spinner-border spinner-border-sm text-light" role="status"></div>
            </div>
              <div class="card-deck" v-if="items" style="margin-top: 30px">
                <div class="card" v-for="item in items" v-bind:key="item.id">
                  <div class="card-body">
                    <h5 class="card-title">{{item.filename}}</h5>
                    <small class="card-text">{{item.description}}</small>
                  </div>
                  <div class="card-footer">
                    <small class="text-muted">{{item.type}}</small>
                  </div>
                  <div class="row mt-2 mr-2" style="position: absolute;top: 0;right: 0">
                    <button v-on:click="like(item)" class="btn btn-sm btn-light mr-2">❤️ ️<span v-bind:id="'id'+item.id">{{item.likes}}</span></button>
                    <button class="btn btn-sm btn-light" v-on:click="selectOne(item)">View</button>
                  </div>
                </div>
              </div>
                
              <div class="col-12" v-if="items && items.length === 0">
                <small class="text-primary">
                  No results found
                </small>
              </div>
            </div>
            <div class="tab-pane fade" id="pills-liked" role="tabpanel" aria-labelledby="pills-liked-tab">
            <!-- <div v-if="loadingTab2" class="col-12 d-flex justify-content-center">
                  <div class="spinner-border spinner-border-sm text-light" role="status"></div>
                </div>
                <div class="card-deck" v-if="itemsLiked" style="margin-top: 30px">
                  <div class="card" v-for="item in itemsLiked" v-bind:key="item.id">
                    <div class="card-body">
                      <h5 class="card-title">{{item.filename}}</h5>
                      <small class="card-text">{{item.description}}</small>
                    </div>
                    <div class="card-footer">
                      <small class="text-muted">{{item.type}}</small>
                    </div>
                    <div class="row mt-2 mr-2" style="position: absolute;top: 0;right: 0">
                      <button v-on:click="like(item)" class="btn btn-sm btn-light mr-2">❤️ ️<span v-bind:id="'id'+item.id">{{item.likes}}</span></button>
                      <button class="btn btn-sm btn-light" v-on:click="selectOne(item)">View</button>
                    </div>
                  </div>
                </div>
                  
                <div class="col-12" v-if="itemsLiked && itemsLiked.length === 0">
                  <small class="text-primary">
                    No results found
                  </small>
                </div> -->
                  
                <div class="col-12">
                  <small class="text-primary">
                    In progress
                  </small>
                </div>
            </div>
            <div class="tab-pane fade" id="pills-my" role="tabpanel" aria-labelledby="pills-my-tab">
                <div v-if="loadingTab3" class="col-12 d-flex justify-content-center">
                  <div class="spinner-border spinner-border-sm text-light" role="status"></div>
                </div>
                <div class="card-deck" v-if="myItems" style="margin-top: 30px">
                  <div class="card" v-for="item in myItems" v-bind:key="item.id">
                    <div class="card-body">
                      <h5 class="card-title">{{item.filename}}</h5>
                      <small class="card-text">{{item.description}}</small>
                    </div>
                    <!-- <div class="card-footer">
                      <small class="text-muted">{{item.create_by}}</small>
                    </div> -->
                    <div class="row mt-2 mr-2" style="position: absolute;top: 0;right: 0">
                      <button v-on:click="deleteItem(item)" class="btn btn-sm btn-danger mr-2"><i class="fa fa-trash"></i></button>
                      <button class="btn btn-sm btn-light" v-on:click="selectOne(item)">View</button>
                    </div>
                  </div>
                </div>
                  
                <div class="col-12" v-if="myItems && myItems.length === 0">
                  <small class="text-primary">
                    No results found
                  </small>
                </div>
            </div>
          </div>
        </body>
        <script nonce="${nonce}">
          var app = new Vue({
            el: '#app',
            data: {
              items: null,
              loadingTab1: false,
              loadingTab2: false,
              loadingTab3: false,
              typeSelected: 'All',
              itemsLiked: null,
              myItems: null
            },
            methods: {
              search: function() {
                this.loadingTab1 = true;
                // const searchInput = document.getElementById('searchInput').value;
                // const type = this.typeSelected === 'All' ? '' : "&type=" + this.typeSelected;
                
                fetch("https://cardenasvscode.herokuapp.com/templates?description=" + searchInput, {method: 'GET'})
                .then(response => response.text())
                .then(result => {
                  this.items = JSON.parse(result);
                  this.loadingTab1 = false;
                })
                .catch(error => {
                  vscode.postMessage({ type: 'onError', value: error.message });
                  this.loadingTab1 = false;
                });
              },
              likes: function() {
                  this.loadingTab2 = true;
                  this.itemsLiked = null;
                  fetch("https://cardenasvscode.000webhostapp.com/controllers/like.php?idUser=" + ${this.userInfo.data.id}, {method: 'GET'})
                  .then(response => response.text())
                  .then(result => {
                    this.itemsLiked = JSON.parse(result);
                    this.loadingTab2 = false;
                  })
                  .catch(error => {
                    vscode.postMessage({ type: 'onError', value: error.message });
                    this.loadingTab2 = false;
                  });
              },
              getMyItems: function() {
                  this.loadingTab3 = true;
                  this.myItems = null;
                  fetch("https://cardenasvscode.herokuapp.com/templates?idUser=" + ${this.userInfo.data.id}, {method: 'GET'})
                  .then(response => response.text())
                  .then(result => {
                    this.myItems = JSON.parse(result);
                    this.loadingTab3 = false;
                  })
                  .catch(error => {
                    vscode.postMessage({ type: 'onError', value: error.message });
                    this.loadingTab3 = false;
                  });
              },
              like: function(item) {
                var formData = new FormData();
                formData.append('idUser', ${this.userInfo.data.id});
                formData.append('idPost', item.id);
                fetch('https://cardenasvscode.herokuapp.com/likes', {method: 'POST', body: formData})
                .then(response => response.text())
                .then(result => {
                  const likes = document.getElementById('id'+item.id).innerHTML;
                  if (result === 'true') {
                    document.getElementById('id'+item.id).innerHTML = +likes + 1;
                  } else {
                    document.getElementById('id'+item.id).innerHTML = +likes - 1;
                  }
                  this.likes();
                })
                .catch(error => {
                  vscode.postMessage({ type: 'onError', value: error.message });
                });
              },
              deleteItem: function(item) {
                  fetch('https://cardenasvscode.herokuapp.com/templates/' + item._id, {method: 'DELETE'})
                  .then(response => response.text())
                  .then(result => {
                      this.search();
                      this.likes();
                      this.getMyItems();
                  })
                  .catch(error => {
                      vscode.window.showErrorMessage('Error try again later');
                  });
              },
              selectOne: function(item) {
                vscode.postMessage({ type: 'onStoryPress', value: item });
              },
              changeFilter(val) {
                this.typeSelected = val;
                this.search();
              }
            },
            mounted() {
              this.search();
              // this.likes();
              this.getMyItems();
            }
          })

          const vscode = acquireVsCodeApi();

      </script>
    </html>`;
  }
}