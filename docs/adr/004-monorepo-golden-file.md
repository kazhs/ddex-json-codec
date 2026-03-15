# ADR-004: モノレポ化と Golden File テスト

## ステータス
Proposed (2026-03-15)

## コンテキスト
Kotlin版ライブラリ（Maven Central配信）を追加する際、fixture XMLやドキュメントの重複を避けたい。また、両言語の変換ロジックの整合性を担保する仕組みが必要。

## 決定

### モノレポ構成

```
ddex-json-codec/
  packages/
    typescript/               # 現在のsrc/をここに移動
      src/
      package.json
      vite.config.ts
    kotlin/
      src/main/kotlin/
      src/test/kotlin/
      build.gradle.kts
  docs/                       # 共有（ERN仕様、ADR）
  tests/fixtures/             # 共有（テスト用XML + Golden File）
  CHANGELOG.md
  README.md
```

### Golden File テスト

fixture XMLからの変換結果を `.expected.json` として保存し、両言語のテストが同じファイルに対して検証する。

```
tests/fixtures/
  ern382/
    single.xml                  # 入力（共有）
    single.expected.json        # 期待出力（共有）
    album.xml
    album.expected.json
  ern42/
    single.xml
    single.expected.json
    ...
```

- TypeScript側で `xmlToJson()` の結果を `.expected.json` として生成（初回 or 更新時）
- 両言語のテストが同じ `.expected.json` と一致するか検証
- golden file 更新コマンドを用意（例: `npx vp test -- --update-golden`）

### 注意点

- `undefined` フィールドはgolden file生成時に除外（Kotlin側の `null` 省略と合わせる）
- JSON比較はキー順序に依存しないディープ比較を使う
- golden file の差分はコードレビューで確認しやすい

### 型定義の共通化

型定義のみ共通ソース（JSON Schema or TypeSpec）から両言語のコードを生成する。変換ロジックはパーサーAPIの差異が大きいため各言語で手書き。

- **型の整合性** → 共通スキーマから生成
- **ロジックの整合性** → Golden File テストで検証

## 理由
- fixture XML（430件）やドキュメントの重複を排除
- 両言語間の変換結果の整合性をCIで自動検証
- 片方のロジック変更が即座にもう片方のテスト失敗として検出される

## トレードオフ
- モノレポ化に伴うCI設定の複雑化（TS + Kotlin両方のビルド環境が必要）
- golden file の更新を忘れるとテストが壊れる（逆に安全装置でもある）
- 変換ロジック自体は2回書く必要がある（パーサーAPI差異のため不可避）

## Kotlin側の技術スタック候補

| 項目 | 選定候補 |
|---|---|
| ビルド | Gradle (Kotlin DSL) |
| XMLパーサー | Jackson XML (`jackson-dataformat-xml`) or kotlinx-serialization-xml |
| JSONライブラリ | kotlinx-serialization-json or Jackson |
| テスト | kotlin.test + JUnit 5 |
| 配信 | Maven Central (via Sonatype) |
| 型設計 | sealed class で Discriminated Union を表現 |
