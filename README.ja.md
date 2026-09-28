# handoffX

**AI エージェントが仕事を終えた。しかし、引き継ぎは残されていなかった。**

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

午前2時、Agent A は40分かけて本番障害を調査しました。データベースを原因候補から外し、重要なログを2件見つけ、さらに一つの禁止事項を確認しました。**プライマリデータベースを再起動してはいけない。**

その直後、セッションが終了します。

引き継いだ Agent B が受け取ったのは結論ではなく、800件のチャット履歴でした。B は失敗済みのコマンドを繰り返し、すでに否定された仮説を再検討した末、こう尋ねます。

「結局、いま何を解決しようとしているのですか？」

A も B も有能です。それでも引き継ぎは失敗しました。

> チャット履歴は監視カメラの映像であって、引き継ぎ書ではありません。

handoffX は、AI エージェント向けのオープンでポータブルな Markdown ベースのコンテキスト引き継ぎプロトコルです。エージェント、セッション、所有者、プラットフォーム、インフラストラクチャの境界を越えて、作業継続に必要な最小十分のコンテキストを運びます。

## Matt Pocock の Handoff から

handoffX は、Matt Pocock が [Dictionary of AI Coding](https://github.com/mattpocock/dictionary-of-ai-coding) で定義した [Handoff](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Handoff.md) に着想を得ています。

Matt は、引き継ぎを形作る重要な制約を示しました。新しいセッションはコンテキストをまったく持たず、以前のセッションへ質問し直す経路もないかもしれません。次のセッションに必要なものは明示的に運ばなければならず、引き継ぎの品質は「ゼロコンテキストのエージェントが何を実行できるか」で評価されます。

handoffX はこの考えを、所有者とインフラストラクチャを越えて拡張します。受信者が別の人のエージェントで、別のプラットフォーム上にいて、追加質問が必要ならどうするか。同じ引き継ぎを B、C、D が独立して受け取る場合はどうするか。

## handoff に含めるもの

handoff は送信側の全記憶を詰め込むものではありません。作業継続に必要な最小限のコンテキストを含めます。

- 目的と現在の状態
- 確認済みの事実と根拠
- 実行済みの対応と結果
- 判断、理由、禁止事項
- 次のアクションと完了条件
- 未解決の質問と依存関係

これはチャットの要約ではありません。タスクの責任を移すためのものです。

## Agent Skill として試す

オープンな Skill ディレクトリ形式に対応する Agent 環境へ `handoffx` Skill をインストールします。

```bash
npx skills add ammend/handoffX -y -g
```

次に Agent へ依頼します。

```text
handoffX を使って、現在の決済レイテンシ調査を agent-b に引き継いでください。
事実、失敗した試行、禁止事項、次のアクション、完了条件を残し、
私がオフラインでも単独で利用できる Markdown handoff を作成してください。
```

受信側の Agent は次のようにレビューできます。

```text
handoffX を使って、この引き継ぎをレビューしてください。
作業を続けられるなら明示的に受理し、足りない場合は
次のアクションを妨げる質問、または重大な誤りを防ぐ質問だけをしてください。
```

受信側に handoffX のインストールは不要です。Markdown を読み、自然言語で返答できます。Skill はワークフローを安定させますが、プロトコル利用の条件ではありません。

## 引き継ぎは対話である

```text
OFFER → REQUEST_INFO → REVISE → ACCEPT
```

送信側が完全な handoff を提示し、受信側は受理するか、具体的な質問を返します。回答はチャットに散在させず、新しい自己完結した revision に統合します。

同じ revision を B、C、D など複数の受信者へ提示できます。それぞれが、正確な handoff ID、revision、SHA-256 ダイジェストに対して独立に返答します。B が revision 2 を受理しても、C が受理したことにはなりません。

## なぜ Markdown なのか

引き継ぎで最も大切なのは、元のシステムを離れても読めることです。

Markdown は、チャット添付、メール、Git、課題管理、ファイルシステム、HTTP、共有ホワイトボード、MCP リソース、A2A artifact で運べます。そのいずれにも依存しません。

ツールが必要なのは送信側だけです。受信側は Markdown を読めれば十分です。

SHA-256 は応答と revision を正確なファイル内容へ結び付け、バージョンの不一致を検出します。ただし、作成者の本人性は証明しません。転送、権限、署名、ディスカバリ、タスク編成は 0.1 のコア範囲外です。

## リファレンス CLI

Node.js/Bun CLI は、スクリプト、CI、Agent フレームワーク向けのリファレンス実装です。プロトコル自体は CLI を必要としません。

```bash
npm install -g github:ammend/handoffX#v0.1.1
```

handoff を作成します。

```bash
handoffx create \
  --title "決済レイテンシ調査" \
  --producer "agent-a" \
  --audience "agent-b" \
  --goal "P99 上昇の原因を特定する" \
  --summary "サービスは稼働中だが、障害は未解決" \
  --action "インスタンスを4台から8台へ増加したが改善なし" \
  --decision "承認なしにデータベースを再起動しない" \
  --next "16:00以降の長時間トランザクションを調査する" \
  --verify "P99が30分間500ms未満を維持する"
```

検証と参照：

```bash
handoffx validate .handoff/<file>.md
handoffx digest .handoff/<file>.md
handoffx show <handoff-id>
handoffx list
handoffx deps <handoff-id>
```

応答と revision：

```bash
handoffx respond handoff.md \
  --as agent-b \
  --disposition needs-info \
  --question "本番メトリクスを参照できるロールはどれですか？"

handoffx accept handoff.md --as agent-b --note "作業を継続できます"
handoffx revise handoff-r1.md --body updated-body.md
```

CLI は不変の応答 artifact と完全な新 revision を生成します。メタデータ、状態、revision、適合性の規則は [handoffX 0.1 仕様](SPEC.md)を参照してください。

## プロトコル文書

バージョン 0.1 は2種類の UTF-8 Markdown 文書を定義します。

- `handoff`：現在の canonical context
- `handoff-response`：正確な revision に対する一受信者の `accepted`、`needs-info`、`rejected`

追加質問への回答は次の canonical handoff に統合します。最終 artifact の理解に、交渉ログの再生は不要です。

## スコープ

バージョン 0.1 は、意図的に次の機能を提供しません。

- ネットワーク転送または Agent ディスカバリ
- クラウド文書またはチャットプラットフォーム統合
- タスクオーケストレーション
- 本人認証またはデジタル署名
- メモリ、Git、ログ、環境情報の自動収集

A2A、MCP、チャット、共有ホワイトボード、アプリ固有のアダプターは、プロトコルを変更せず handoffX を運べます。

## オープンソース

handoffX は Apache-2.0 ライセンスで公開されています。プロトコルと実装へのコントリビューションを歓迎します。詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

テスト方法は簡単です。チャット履歴を持たない Agent に、いま最も重要な仕事を渡してください。作業を続けられれば引き継ぎは成功です。足りない情報を質問されたら、その回答を新しい revision に統合します。

最良の引き継ぎは、最も長い文書ではありません。次の Agent を前へ進ませる文書です。
