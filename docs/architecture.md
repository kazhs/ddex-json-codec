# アーキテクチャ

## 技術スタック

| 項目 | 選定 |
|---|---|
| ツールチェイン | vite+ (`vp` CLI) |
| XMLパーサー | fast-xml-parser |
| テスト | Vitest (vite+内蔵) |
| モジュール | ESM |
| パッケージ名 | `@ddex/json-codec` |

## 公開API

```typescript
xmlToJson(xml: string): DdexMessage        // XML→JSON
jsonToXml(json: DdexMessage, version?: ErnVersion): string  // JSON→XML
detectVersion(xml: string): ErnVersion      // バージョン検出
```

## 型設計

**統一型方式**: 3.8系と4系で同じ `DdexMessage` 型を使う。4系固有フィールドはoptional。

```typescript
type ErnVersion = '3.8' | '3.8.1' | '3.8.2' | '3.8.3'
               | '4.1' | '4.1.1' | '4.2' | '4.3' | '4.3.1' | '4.3.2';

// 変換ロジックの分岐用
type ErnMajorVersion = '3.8' | '4';
```

### XML属性+テキスト混在パターン

```typescript
// <TitleText languageAndScriptCode="en">Some Song</TitleText>
// → { value: "Some Song", languageAndScriptCode: "en" }
type TextWithAttribute<T> = { value: string } & T;
```

## 変換フロー

### XML → JSON（4系）

```
XML文字列
  → fast-xml-parser でパース
  → detectVersion で バージョン判別
  → ConverterFactory が Ern4Converter を返す
  → Pass 1: PartyList をインデックス化 (PartyReference → Party の Map)
  → Pass 2: リソース走査時に PartyReference を解決して実データ埋め込み
  → DdexMessage 返却
```

### JSON → XML（4系）

```
DdexMessage
  → Ern4Builder がインラインの Artist 情報から PartyList を再構築
  → PartyReference を生成して各リソースに埋め込み
  → fast-xml-parser の Builder で XML 文字列生成
  → namespace 宣言をルート要素に付与
```

## 設計原則

- **知らないフィールドは無視**: 未知のXML要素はスキップ、既知のフィールドはあれば取る
- **ラウンドトリップ保証**: XML→JSON→XMLで元のXMLと等価になること
  - 4系の `partyList` と各Artistの `partyReference` はこのために保持
- **ファクトリーパターン**: バージョン判別 → 適切なConverter/Builderを返す
- **2パス処理**: 4系のXML→JSONはPartyListを先にインデックス化してからリソースを走査
