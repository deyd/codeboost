"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
/**
 * ファイル名のリストを取得する
 * @param directory_path
 * @returns
 */
async function retrieveFilenames(directory_path) {
    // ファイル名のリストを取得する
    // 取得
    const directory = vscode.Uri.file(directory_path);
    const fileinfos = await vscode.workspace.fs.readDirectory(directory);
    // ファイル名のみに変換
    const filenames = [];
    fileinfos.forEach(name_and_type => {
        if (name_and_type[1] === vscode.FileType.File) { // ファイルのみ（フォルダは除外）
            filenames.push(name_and_type[0]);
        }
    });
    return filenames;
}
function removeUntilMarker(text, marker) {
    // 正規表現で、文字列の先頭から指定した単語が出てきた行の文末までをマッチさせる
    const regex = new RegExp(`^[\\s\\S]*?${marker}[\\s\\S].*\\r?\\n`, 'm');
    return text.replace(regex, '');
}
function removeFromMarker(text, marker) {
    // 正規表現で、指定した単語が出てきた行の行頭から文字列の最後までをマッチさせる
    const regex = new RegExp(`^.*${marker}[\\s\\S]*$`, 'm');
    return text.replace(regex, '');
}
function removeBetweenMarkers(text, fromMarker, toMarker) {
    // 正規表現で、fromMarkerが出てきた行の行頭からtoMarkerが出てきた行の最後までをマッチさせる
    const regex = new RegExp(`^.*${fromMarker}[\\s\\S]*?${toMarker}.*\\r?\\n`, 'gm');
    return text.replace(regex, '');
}
function removeFromMarkerToEndOfLine(text, marker) {
    // 正規表現で、markerから行末（改行文字含む）までをマッチさせる
    // Python などではインデントが崩れるため、改行文字列は削除しない
    console.log(marker);
    const regex = new RegExp(`\s*${marker}.*`, 'g');
    return text.replace(regex, '');
}
function removeLinesWithMarker(text, marker) {
    // 正規表現で指定したキーワードが含まれる行を削除
    const regex = new RegExp(`^.*${marker}.*$`, 'gm');
    // return text.replace(regex, '').replace(/^\s*[\r\n]/gm, '');
    return text.replace(regex, '');
}
function insert(text) {
    // text を現在のカーソル位置に挿入する
    console.log("insert code");
    const editor = vscode.window.activeTextEditor; // 使用中のエディタオブジェクト取得
    // エディタ書き込み
    if (editor) {
        let anchor = editor.selection.anchor; // 現在のアンカー位置を取得
        editor.edit(editBuilder => {
            editBuilder.insert(anchor, text);
        });
    }
    console.log("inserted.");
}
async function insertSnippet() {
    const configuration = vscode.workspace.getConfiguration("codeboost");
    let directory_path = "./";
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        directory_path = vscode.workspace.workspaceFolders[0].uri.path;
    }
    directory_path = configuration.get("folderPath") || directory_path;
    // マーカー設定
    const header_marker = configuration.get("mainMarker") || "# -- main block -- #";
    const footer_marker = configuration.get("testMarker") || "# -- test block -- #";
    const from_marker = configuration.get("fromMarker") || "# -- From -- #";
    const to_marker = configuration.get("toMarker") || "# -- To -- #";
    ;
    const comment_marker = configuration.get("commentMarker") || "# == ";
    const line_marker = configuration.get("lineMarker") || "# ** ";
    // vscode.window.showInformationMessage(directory_path);
    const filenames = await retrieveFilenames(directory_path); // 変換対象のファイルをリスト化する
    // ファイル選択
    const item = await vscode.window.showQuickPick(filenames, { placeHolder: 'Please Select an item', canPickMany: false });
    // ファイル読み込み
    if (item === undefined) {
        vscode.window.showWarningMessage("No item selected");
        // vscode.window.showWarningMessage(directory_path + " not found.");
        return;
    }
    const filepath = directory_path + '//' + item;
    // ファイルを読み込む
    const blob = await vscode.workspace.fs.readFile(vscode.Uri.file(filepath));
    // テキストへ変換
    let text = Buffer.from(blob).toString(); // デフォルトはutf-8
    text = removeUntilMarker(text, header_marker);
    text = removeFromMarker(text, footer_marker);
    // 途中のテストコードも取り除く
    text = removeBetweenMarkers(text, from_marker, to_marker);
    text = removeFromMarkerToEndOfLine(text, comment_marker); // 削除コメント
    console.log(text);
    text = removeLinesWithMarker(text, line_marker); // 行ごと削除
    console.log(text);
    insert(text);
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('codeboost.insertSnippet', insertSnippet); // 登録
    context.subscriptions.push(disposable); // リソース解放（の準備）
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map