作成中のコードに、自作コードファイルを組み込む機能

A feature to incorporate custom code files into the code being developed.

- VSCodeにスニペット機能はありますが、長いコードを登録するのには面倒。変換サイトを使っても、修正するたびに変換作業の必要があります。
- 一方、カスタムコードを自分のフォルダに置いても、コピー＆ペーストするのは少し面倒です。また、修正やコードの検証のたびに、検証用のコードを付け加えて、修正後に消す、という作業も発生します。

- The VSCode snippet feature is cumbersome for registering long code. Even if you use a conversion site, you need to convert it every time you make corrections.
- Even if you place your custom code in your own folder, it’s a bit troublesome to copy and paste. This also causes back-and-forth when making corrections or verifying the code.

これを解決するための拡張機能です。

This extension solves the problems.

## 機能 / Features

- ヘッダ部やフッタ部、実際のコーディングで用いる際には削除したい部分を明示することで、動作テストのコードと転記するコードを使い分けられます。
- コードの途中にローカルテスト用のコードを（特定の）コメントで挟んで記述しておくことで、実際のファイルでは検証コードを削除することなく使用できます。

- By indicating the parts you want to delete when using them in actual coding, such as the header and footer sections, you can differentiate between the code for testing and the code to be transcribed.
- By embedding local test code within specific comments in the middle of the code, you can use the actual file without removing the verification code.

<img src="https://github.com/user-attachments/assets/cb905f89-e2a0-429d-bccc-1378fa1dafef" />

## Requirements

* なし / Nothing 

## 簡単な使い方 / Getting Start

### 準備 / Preperation

#### フォルダ / Folder
自分の使いたいスニペットファイルが入っているフォルダのパスを codeboost.folderPath に設定します

Set the path of the folder containing the snippet files you want to use to codeboost.folderPath.

#### スニペットファイル / Snippet Files
デフォルトでの設定です。 初期設定では、Python ファイルを前提にしています。（`#` でのコメントアウト）

This is the default setting. Initially, it assumes Python files (commented out with #).

- 引用時に削除したいヘッダ部のあと（残したい部分の前）に `# -- main block -- #` を挿入します / Insert # -- main block -- # after the header section you want to remove (before the part you want to keep).
- 引用時に削除したいフッタ部のまえ（残したい部分の後ろ）に `# -- test block -- #` を挿入します / Insert # -- test block -- # before the footer section you want to remove (after the part you want to keep).

### コードを呼び出す / Calling Code

- コードの作成中に、カーソルが挿入したい場所にある状態で、右クリックメニューから 'Insert Snippet' を呼び出します / While creating code, with the cursor at the desired insertion point, call ‘Insert Snippet’ from the right-click menu.

- 上部の入力窓から呼び出したいファイルを指定します / Specify the file you want to call from the input window at the top.

ヘッダ、フッタが削除された状態で、スニペットファイルの内容が貼り付けられます

The content of the snippet file will be pasted with the header and footer removed.

## 拡張設定 / Extension Settings

５種類の削除方法と、６種類の削除マーカがあります。
There are five types of deletion methods (with six deletion markers).

- **ヘッダ部（動作テスト用の変数定義など）の削除 Removing variable definitions used as prerequisites or in test code**
  -設定キーとファイルの初期設定マーカーは次の通りです
    - キー key : `codeboost.mainMarker`
    - 初期マーカー marker: `# -- main block -- #`
  - メインブロックの始まり位置を示します which signifies the start of the main block of code.
  - つまり、このマーカーがある行から前が削除されます In other words, everything before this marker will be removed.

- **フッタ部（動作テスト用の実行命令など）の削除 Removing sections used for output or similar purposes in test code**
    - キー key : `codeboost.testMarker`
    - 初期マーカー default marker : `# -- test block -- #`
  - メインブロックの終わり位置を示します which signifies the start of the output test block of code.
  - つまり、このマーカーのある行から後ろが削除されます In other words, everything after this marker will be removed.

- **テストで使用するコードの削除 Removing sections within the main code that are used for testing purposes**
  - キー key : `codeboost.fromMarker`, `codeboost.toMarker`
  - 初期マーカー default marker : `# -- From -- #`, `# -- To -- #`
  - メインブロック中で、本来動作には不要なコードの場所を示します which signify that the code between these markers is used for test outputs or required by the test problem.
  - つまり、このマーカーの行の間が削除されます In other words, the code between these markers will be removed.

- **行の削除 Removing entire lines of code**
  - キー key : `codeboost.lineMarker`
  - 初期マーカー default marker : `# ----`
  - その行だけ消したい場合に使います he default marker is `# == `, which indicates that both the comment and the code should be excluded.

- **コメントの削除 Removing only comments while keeping the code intact**
  - キー key : `codeboost.commentMarker`
  - 初期マーカー default marker : `# ==`
  - スニペット使用時に消したいコメント（作成時の覚書など）がある場合に使用します。同じ行にコードがある場合は、そのコードは削除されません。 which indicates that the comment should not be included in the final submission.

これらの設定は、設定にて変更して下さい。
These settings can be customized by writing codeboost.* in the settings.json file.


## Known Issues

* `*` がコメント中でも使えない（かもしれない）

