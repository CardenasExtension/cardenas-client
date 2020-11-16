import { window, StatusBarItem, StatusBarAlignment } from "vscode";


export class Status {
  private item: StatusBarItem;
  timeout?: NodeJS.Timer;
  counting = false;

  constructor() {
    this.item = window.createStatusBarItem(StatusBarAlignment.Right);
  }

  show() {
    this.item.show();
    this.item.command = "cardenas.saveFile";
    this.item.text = "Upload code using CARDENAS";
  }
}