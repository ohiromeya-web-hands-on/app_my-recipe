# Codex を VS Code で使う

Codex は CLI だけでなく、公式の IDE 拡張からも使える。VS Code のサイドバーで会話しながら、開いているファイルや選択中のコードを文脈として渡せるため、CLI より短いプロンプトで依頼しやすい。

## 便利な点

| 観点 | 評価 | メモ |
|---|---:|---|
| 導入のしやすさ | 4/5 | VS Code Marketplace から拡張を入れてサインインするだけで始められる |
| コンテキストコスパ | 5/5 | 開いているファイル、選択範囲、`@file` 参照を使える |
| CLI と比べて嬉しいこと | 3/5 | エディタ上で差分確認、承認モード変更、Cloud タスクの確認ができる |

- ターミナルに流れるログを追い続けなくていい。Codex の会話は VS Code のサイドバーに出るので、対象ファイルを見ながら相談できる。
- ファイル指定が楽になる。CLI のように毎回パスを打たなくても、プロンプト内で `@example.tsx` のようにファイルを参照できる。
- チャット入力欄まわりのスイッチャーで、Codex に任せる範囲を切り替えられる。
  - `Chat`: 相談や設計だけ。ファイル編集やコマンド実行はしない。
  - `Agent`: 既定モード。作業ディレクトリ内の読み取り、編集、コマンド実行は任せられる。作業ディレクトリ外の操作やネットワークアクセスは承認が必要。
  - `Agent (Full Access)`: ネットワークアクセスを含めて承認なしで実行できる。使う場合は慎重に扱う。
- 重い作業は Codex Cloud に委譲し、VS Code から進捗確認、レビュー、ローカルへの差分適用ができる。

## 導入手順

1. VS Code の Extensions で `Codex - OpenAI's coding agent` を検索してインストールする。
   - Publisher: OpenAI
   - Extension ID: `OpenAI.chatgpt`
2. サイドバーに出る Codex アイコンを開いてサインインする。
   - ChatGPT Plus / Pro / Business / Edu / Enterprise のアカウント、または OpenAI API key を使える。
3. CLI 版を使っている場合は、IDE 拡張も Codex CLI と同じ設定を使う。サインイン状態もそのまま使えることがあるが、環境や認証状態によっては拡張側で再サインインを求められる。

## Cloud 委譲の準備

Codex Cloud を使う場合は、`chatgpt.com/codex` で GitHub アカウントを接続し、Codex が対象リポジトリで作業できる Cloud environment を用意する。準備後は IDE 拡張から環境を選び、`Run in the cloud` でタスクを投げられる。

Cloud には `main` から開始する方法と、ローカル変更を起点にする方法がある。新規アイデアは `main` 起点、途中作業の続きはローカル変更起点が使いやすい。

## 備考

- VS Code 互換エディタとして Cursor / Windsurf に対応している。JetBrains IDE 向けの統合も公式に案内されている。
- CLI 版と IDE 拡張は設定を共有する。ただし、会話スレッドそのものを CLI と IDE の間で常に完全に引き継げるとは限らないため、重要な前提はプロンプトや `AGENTS.md` に残す。
- 詳細は公式ドキュメントを確認する。
  - [Codex IDE extension](https://developers.openai.com/codex/ide)
  - [Codex IDE extension features](https://developers.openai.com/codex/ide/features)
  - [Codex web / Cloud](https://developers.openai.com/codex/cloud)
  - [Visual Studio Marketplace: Codex - OpenAI's coding agent](https://marketplace.visualstudio.com/items?itemName=OpenAI.chatgpt)
