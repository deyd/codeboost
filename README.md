# codeboost README

自作のコードファイルを作成中のコードに取り込む機能です
This feature allows you to incorporate your custom code files into your ongoing project.

- VSCode のスニペット機能は、長いコードを登録するのは面倒。変換サイトを利用しても、修正する際に毎回変換が必要。
- 自分のフォルダに自作コードを置いていてもコピペまでにちょっと面倒。こちらも、修正作業やコード検証をするときに行き戻りが発生。

## Features

- ヘッダ部やフッタ部、実際のコーディングで用いる際には削除したい部分を明示することで、動作テストのコードと転記するコードを使い分けられます。
- コードの途中にローカルテスト用のコードを（特定の）コメントで挟んで記述しておくことで、実際のファイルでは検証コードを削除することなく使用できます。

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

* なし

## Extension Settings

There are five types of deletion methods (with six deletion markers).

- **Removing variable definitions used as prerequisites or in test code**
  - The default marker is `codeboost.startMarker` `# -- main block -- #`, which signifies the start of the main block of code.
  - In other words, everything before this marker will be removed.

- **Removing sections used for output or similar purposes in test code**
  - The default marker is `# -- test block -- #`, which signifies the start of the output test block of code.
  - In other words, everything after this marker will be removed.

- **Removing sections within the main code that are used for testing purposes**
  - The default markers are `# -- From -- #` and `# -- To -- #`, which signify that the code between these markers is used for test outputs or required by the test problem.
  - In other words, the code between these markers will be removed.

- **Removing only comments while keeping the code intact**
  - The default marker is `# == `, which indicates that the comment should not be included in the final submission.

- **Removing entire lines of code**
  - The default marker is `# ** `, which indicates that both the comment and the code should be excluded.

These settings can be customized by writing codeboost.* in the settings.json file.



## Known Issues

x

## Release Notes

x
### 1.0.0

Initial release of ...
