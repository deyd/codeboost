// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { access } from 'fs';
import * as vscode from 'vscode';

async function retrieveFilenames(directory_path: string) {
    // ファイル名のリストを取得する

    const directory = vscode.Uri.file(directory_path);
    const fileinfos = await vscode.workspace.fs.readDirectory(directory);
    const filenames: string[] = [];
    fileinfos.forEach(name_and_type => { filenames.push(name_and_type[0]); });

    return filenames;
}

function removeUntilMarker(text: string, marker: string): string {
    // 正規表現で、文字列の先頭から指定した単語が出てきた行の文末までをマッチさせる
    const regex = new RegExp(`^[\\s\\S]*?${marker}[\\s\\S].*\\r?\\n`, 'm');
    return text.replace(regex, '');
}

function removeFromMarker(text: string, marker: string): string {
    // 正規表現で、指定した単語が出てきた行の行頭から文字列の最後までをマッチさせる
    const regex = new RegExp(`^.*${marker}[\\s\\S]*$`, 'm');
    return text.replace(regex, '');
}

function removeBetweenMarkers(text: string, fromMarker: string, toMarker: string): string {
    // 正規表現で、fromMarkerが出てきた行の行頭からtoMarkerが出てきた行の最後までをマッチさせる
    const regex = new RegExp(`^.*${fromMarker}[\\s\\S]*?${toMarker}.*\\r?\\n`, 'gm');
    return text.replace(regex, '');
}

function removeFromMarkerToEndOfLine(text: string, marker: string): string {
    // 正規表現で、markerから行末（改行文字含む）までをマッチさせる
    // Python などではインデントが崩れるため、改行文字列は削除しない
    console.log(marker);
    const regex = new RegExp(`\s*${marker}.*`, 'g');
    return text.replace(regex, '');
}

function removeLinesWithMarker(text: string, marker: string): string {
    // 正規表現で指定したキーワードが含まれる行を削除
    const regex = new RegExp(`^.*${marker}.*$`, 'gm');
    // return text.replace(regex, '').replace(/^\s*[\r\n]/gm, '');
    return text.replace(regex, '');
}

function insert(text: string) {
    // text を現在のカーソル位置に挿入する
    console.log("insert code");
    const editor = vscode.window.activeTextEditor;  // 使用中のエディタオブジェクト取得

    // エディタ書き込み
    if (editor) {

        let anchor = editor.selection.anchor;  // 現在のアンカー位置を取得

        editor.edit(editBuilder => {
            editBuilder.insert(anchor, text);
        });
    }

    console.log("inserted.");

}


async function insertSnippet() {

    const configuration = vscode.workspace.getConfiguration("codeboost");

    let directory_path: string = "./";
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        directory_path = vscode.workspace.workspaceFolders[0].uri.path;
    }
    directory_path = configuration.get<string>("folderPath") || directory_path;

    // マーカー設定
    const header_marker: string = configuration.get<string>("mainMarker") || "# -- main block -- #";
    const footer_marker: string = configuration.get<string>("testMarker") || "# -- test block -- #";
    const from_marker: string = configuration.get<string>("fromMarker") || "# -- From -- #";
    const to_marker: string = configuration.get<string>("toMarker") || "# -- To -- #";;
    const comment_marker: string = configuration.get<string>("commentMarker") || "# == ";
    const line_marker: string = configuration.get<string>("lineMarker") || "# ** ";

    // vscode.window.showInformationMessage(directory_path);

    const filenames = await retrieveFilenames(directory_path);  // 変換対象のファイルをリスト化する

    const item = await vscode.window.showQuickPick(filenames, { placeHolder: 'Please Select an item', canPickMany: false });  // ファイルの選択をする

    if (item === undefined) {
        vscode.window.showWarningMessage("No item selected");
        // vscode.window.showWarningMessage(directory_path + " not found.");
        return;
    }

    const filepath = directory_path + '//' + item;

    // ファイルを読み込む
    const blob = await vscode.workspace.fs.readFile(vscode.Uri.file(filepath));
    // テキストへ変換
    let text = Buffer.from(blob).toString();  // デフォルトはutf-8

    text = removeUntilMarker(text, header_marker);
    text = removeFromMarker(text, footer_marker);

    // 途中のテストコードも取り除く
    text = removeBetweenMarkers(text, from_marker, to_marker);

    text = removeFromMarkerToEndOfLine(text, comment_marker);  // 削除コメント
    console.log(text);
    text = removeLinesWithMarker(text, line_marker);  // 行ごと削除
    console.log(text);

    insert(text);

}

export function activate(context: vscode.ExtensionContext) {

    const disposable = vscode.commands.registerCommand('codeboost.insertSnippet', insertSnippet);  // 登録

    context.subscriptions.push(disposable);  // リソース解放（の準備）
}

// This method is called when your extension is deactivated
export function deactivate() { }
