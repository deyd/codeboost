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
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const path_1 = require("path");
const vscode = __importStar(require("vscode"));
function normalizeExtension(extension) {
    const normalized = extension.toLowerCase();
    return normalized.startsWith('.') ? normalized : `.${normalized}`;
}
function getLanguageProfile(configuration, extension) {
    const languages = configuration.get('languages', {});
    const normalizedExtension = normalizeExtension(extension);
    for (const profile of Object.values(languages)) {
        if (profile &&
            Array.isArray(profile.extensions) &&
            profile.extensions.every((value) => typeof value === 'string') &&
            typeof profile.comment === 'string' &&
            profile.comment.length > 0) {
            const extensions = profile.extensions.map(normalizeExtension);
            if (extensions.includes(normalizedExtension)) {
                return { extensions, comment: profile.comment };
            }
        }
    }
    return undefined;
}
function getMarkers(configuration, extension) {
    const profile = extension ? getLanguageProfile(configuration, extension) : undefined;
    if (profile) {
        const { comment } = profile;
        return {
            main: `${comment} -- main block -- ${comment}`,
            test: `${comment} -- test block -- ${comment}`,
            from: `${comment} -- tmp From -- ${comment}`,
            to: `${comment} -- tmp To -- ${comment}`,
            line: `${comment} ---- `,
            comment: `${comment} == `
        };
    }
    return {
        main: configuration.get('mainMarker') || '# -- main block -- #',
        test: configuration.get('testMarker') || '# -- test block -- #',
        from: configuration.get('fromMarker') || '# -- tmp From -- #',
        to: configuration.get('toMarker') || '# -- tmp To -- #',
        line: configuration.get('lineMarker') || '# ---- ',
        comment: configuration.get('commentMarker') || '# == '
    };
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
async function retrieveFilenames(directory_path, extensions) {
    // ファイル名のリストを取得する
    // 取得
    const directory = vscode.Uri.file(directory_path);
    const fileinfos = await vscode.workspace.fs.readDirectory(directory);
    // ファイル名のみに変換
    const filenames = [];
    fileinfos.forEach(name_and_type => {
        if (name_and_type[1] === vscode.FileType.File) { // ファイルのみ（フォルダは除外）
            if (extensions.includes(normalizeExtension((0, path_1.extname)(name_and_type[0])))) {
                filenames.push(name_and_type[0]);
            }
        }
    });
    return filenames;
}
function removeUntilMarker(text, marker) {
    // 正規表現で、文字列の先頭から指定した単語が出てきた行の文末までをマッチさせる
    const regex = new RegExp(`^[\\s\\S]*?^[^\\r\\n]*${escapeRegExp(marker)}[^\\r\\n]*(?:\\r?\\n|$)`, 'm');
    return text.replace(regex, '');
}
function removeFromMarker(text, marker) {
    // 正規表現で、指定した単語が出てきた行の行頭から文字列の最後までをマッチさせる
    const regex = new RegExp(`^.*${escapeRegExp(marker)}[\\s\\S]*$`, 'm');
    return text.replace(regex, '');
}
function removeBetweenMarkers(text, fromMarker, toMarker) {
    // 正規表現で、fromMarkerが出てきた行の行頭からtoMarkerが出てきた行の最後までをマッチさせる
    const regex = new RegExp(`^.*${escapeRegExp(fromMarker)}[\\s\\S]*?${escapeRegExp(toMarker)}.*\\r?\\n`, 'gm');
    return text.replace(regex, '');
}
function removeFromMarkerToEndOfLine(text, marker) {
    // 正規表現で、markerから行末（改行文字含む）までをマッチさせる
    // Python などではインデントが崩れるため、改行文字列は削除しない
    // console.log("remveFromMarkerToEndOfLine");
    // console.log(marker);
    const regex = new RegExp(`[ \\t]*${escapeRegExp(marker)}.*`, 'g');
    return text.replace(regex, '');
}
function removeLinesWithMarker(text, marker) {
    // 正規表現で指定したキーワードが含まれる行を改行ごと削除
    const regex = new RegExp(`^.*${escapeRegExp(marker)}.*(?:\\r?\\n|$)`, 'gm');
    return text.replace(regex, '');
}
function insert(text, targetEditor) {
    // text を現在のカーソル位置に挿入する
    console.log("insert code");
    const editor = targetEditor || vscode.window.activeTextEditor; // 使用中のエディタオブジェクト取得
    // エディタ書き込み
    if (editor) {
        let anchor = editor.selection.anchor; // 現在のアンカー位置を取得
        // selection.active ではだめなのか？
        editor.edit(editBuilder => {
            editBuilder.insert(anchor, text);
        });
    }
    console.log("inserted.");
}
/**
 * 選択したスニペットファイルから不要な領域を取り除き、エディターに挿入します。
 */
async function insertSnippet() {
    // 作業中のエディタオブジェクトを取得
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('エディタが開かれていません');
        return;
    }
    // ファイルの拡張子を取得
    const extension = (0, path_1.extname)(editor.document.fileName).toLowerCase();
    if (!extension) {
        vscode.window.showWarningMessage('作業中のファイルの拡張子を取得できません');
        return;
    }
    // 設定の読み込み
    const configuration = vscode.workspace.getConfiguration("codeboost");
    // 作業ディレクトリの取得
    let directory_path = "./";
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        directory_path = vscode.workspace.workspaceFolders[0].uri.path;
    }
    directory_path = configuration.get("folderPath") || directory_path;
    const profile = getLanguageProfile(configuration, extension);
    const markers = getMarkers(configuration, extension);
    // vscode.window.showInformationMessage(directory_path);
    // 拡張子が一致するファイルをリスト化する
    const supportedExtensions = profile ? profile.extensions : [normalizeExtension(extension)];
    const filenames = await retrieveFilenames(directory_path, supportedExtensions);
    if (filenames.length === 0) {
        vscode.window.showInformationMessage(`対象の拡張子 (${supportedExtensions.join(', ')}) のファイルが見つかりません`);
        return;
    }
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
    // ヘッダーとフッターのマーカーを取り除く
    text = removeUntilMarker(text, markers.main);
    text = removeFromMarker(text, markers.test);
    // 途中のテストコードも取り除く : 初期設定 # -- tmp From -- #
    text = removeBetweenMarkers(text, markers.from, markers.to);
    // 途中のコード行ごと取り除きたいもの : 初期設定 # ----
    text = removeLinesWithMarker(text, markers.line); // 行ごと削除
    console.log(text);
    // コメント部分だけを取り除きたいもの : 初期設定 # ==
    text = removeFromMarkerToEndOfLine(text, markers.comment); // 削除コメント
    console.log(text);
    insert(text, editor);
}
function insertMainMarker() {
    const configuration = vscode.workspace.getConfiguration("codeboost");
    const editor = vscode.window.activeTextEditor;
    const markers = getMarkers(configuration, editor ? (0, path_1.extname)(editor.document.fileName) : undefined);
    insert(markers.main, editor);
}
function insertTestMarker() {
    const configuration = vscode.workspace.getConfiguration("codeboost");
    const editor = vscode.window.activeTextEditor;
    const markers = getMarkers(configuration, editor ? (0, path_1.extname)(editor.document.fileName) : undefined);
    insert(markers.test, editor);
}
function insertLineMarker() {
    const configuration = vscode.workspace.getConfiguration("codeboost");
    const editor = vscode.window.activeTextEditor;
    const markers = getMarkers(configuration, editor ? (0, path_1.extname)(editor.document.fileName) : undefined);
    insert(markers.line, editor);
}
function insertCommentMarker() {
    const configuration = vscode.workspace.getConfiguration("codeboost");
    const editor = vscode.window.activeTextEditor;
    const markers = getMarkers(configuration, editor ? (0, path_1.extname)(editor.document.fileName) : undefined);
    insert(markers.comment, editor);
}
function insertFromToMarker() {
    const configuration = vscode.workspace.getConfiguration("codeboost");
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('エディタが開かれていません');
        return;
    }
    const markers = getMarkers(configuration, (0, path_1.extname)(editor.document.fileName));
    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showErrorMessage('範囲が選択されていません\nSelection is empty');
        return;
    }
    editor.edit(editBuilder => {
        const startLine = selection.start.line;
        const endLine = selection.end.line;
        // 選択範囲の1行下に [END] を挿入（ズレ防止に先に挿入する）
        editBuilder.insert(new vscode.Position(endLine + 1, 0), markers.to + '\n');
        // 選択範囲の1行上に [START] を挿入
        editBuilder.insert(new vscode.Position(startLine, 0), markers.from + '\n');
    });
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('codeboost.insertSnippet', insertSnippet); // 登録
    const disposable_insertMainMarker = vscode.commands.registerCommand('codeboost.insertMainMarker', insertMainMarker); // 登録
    const disposable_insertTestMarker = vscode.commands.registerCommand('codeboost.insertTestMarker', insertTestMarker); // 登録
    const disposable_insertLineMarker = vscode.commands.registerCommand('codeboost.insertLineMarker', insertLineMarker); // 登録
    const disposable_insertCommentMarker = vscode.commands.registerCommand('codeboost.insertCommentMarker', insertCommentMarker); // 登録
    const disposable_insertFromToMarker = vscode.commands.registerCommand('codeboost.insertFromToMarker', insertFromToMarker); // 登録
    // リソース解放（の準備）
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable_insertMainMarker);
    context.subscriptions.push(disposable_insertTestMarker);
    context.subscriptions.push(disposable_insertLineMarker);
    context.subscriptions.push(disposable_insertCommentMarker);
    context.subscriptions.push(disposable_insertFromToMarker);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map