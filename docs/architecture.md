# アーキテクチャ

## 技術スタック

| 項目 | 選定 |
|---|---|
| ツールチェイン | vite+ (`vp` CLI) |
| XMLパーサー | fast-xml-parser |
| テスト | Vitest (vite+内蔵) |
| モジュール | ESM |
| パッケージ名 | `ddex-json-codec` |

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

## モジュール一覧

```
src/
  index.ts                                # 公開API エクスポート
  types/
    ern.ts                                # DdexMessage, ErnVersion, MessageHeader 等
    sound-recording.ts                    # SoundRecording
    release.ts                            # Release, TrackRelease, ResourceGroup
    deal.ts                               # ReleaseDeal, Deal, DealTerms, Usage
    party.ts                              # Party, Artist, DisplayArtist, Contributor
    common.ts                             # TextWithAttribute, Genre, PLine, CLine, Title
  version/
    detect.ts                             # detectVersion(), getMajorVersion()
    namespaces.ts                         # namespace URI → ErnVersion マッピング
  converter/
    converter-factory.ts                  # ConverterFactory（バージョン→Converter/Builderディスパッチ）
    utils.ts                              # ensureArray(), PARSER_OPTIONS, BUILDER_OPTIONS
    xml-to-json/
      index.ts                            # xmlToJson() + XmlToJsonConverter インターフェース
      ern38-converter.ts                  # Ern38Converter（3.8系 XML→JSON）
      ern4-converter.ts                   # Ern4Converter（4系 XML→JSON、2パス処理）
    json-to-xml/
      index.ts                            # jsonToXml() + JsonToXmlBuilder インターフェース
      ern38-builder.ts                    # Ern38Builder（3.8系 JSON→XML）
      ern4-builder.ts                     # Ern4Builder（4系 JSON→XML、PartyList再構築）
```

## バージョン検出

`detectVersion()` は2段階で検出する。

1. **namespace URI** -- `xmlns` 属性の URI を `NAMESPACE_VERSION_MAP` で照合
2. **MessageSchemaVersionId フォールバック** -- 3.8系の古い形式向け。属性値を正規化してMapで照合

巨大ファイル対策として先頭1024バイトのみ読む。

## 変換フロー

### XML → JSON（3.8系）

```
XML文字列
  → fast-xml-parser でパース（PARSER_OPTIONS）
  → detectVersion でバージョン判別
  → ConverterFactory が Ern38Converter を返す
  → DetailsByTerritory 構造を走査
  → インラインの Artist 情報をそのまま抽出
  → DdexMessage 返却
```

3.8系はアーティスト情報がリソース内にインラインで記述されるため、参照解決は不要。

### XML → JSON（4系）

```
XML文字列
  → fast-xml-parser でパース（PARSER_OPTIONS）
  → detectVersion でバージョン判別
  → ConverterFactory が Ern4Converter を返す
  → Pass 1: PartyList をインデックス化 (PartyReference → Party の Map)
  → Pass 2: リソース走査時に PartyReference を解決して実データ埋め込み
  → DdexMessage 返却
```

4系はアーティスト情報が `PartyList` に分離されているため、2パス処理が必須。PartyListがXML上でResourceListより後に出現する可能性もあるため、全体パース後に処理する。

### JSON → XML（3.8系）

```
DdexMessage
  → Ern38Builder がインラインの Artist 情報をそのまま DetailsByTerritory に埋め込み
  → fast-xml-parser の Builder で XML 文字列生成（BUILDER_OPTIONS）
  → namespace 宣言をルート要素に付与
```

### JSON → XML（4系）

```
DdexMessage
  → Ern4Builder がインラインの Artist 情報から PartyList を再構築
    （DdexMessage.partyList が存在すればそれを使い、なければ Artist から再生成）
  → PartyReference を生成して各リソースに埋め込み
  → fast-xml-parser の Builder で XML 文字列生成（BUILDER_OPTIONS）
  → namespace 宣言をルート要素に付与
```

## 設計原則

- **知らないフィールドは無視**: 未知のXML要素はスキップ、既知のフィールドはあれば取る
- **ラウンドトリップ保証**: XML→JSON→XMLで元のXMLと等価になること
  - 4系の `partyList` と各Artistの `partyReference` はこのために保持
- **ファクトリーパターン**: バージョン判別 → 適切なConverter/Builderを返す
- **2パス処理**: 4系のXML→JSONはPartyListを先にインデックス化してからリソースを走査
- **配列の安全化**: `ensureArray()` で fast-xml-parser の単一要素→オブジェクト返却を防御。`ALWAYS_ARRAY_TAGS` に登録されたタグは常に配列として返す

## テスト

85テスト（3.8系47 + 4系36 + bulk validation 2）。430件の実データで検証済み。

テスト構成:
- バージョン検出テスト
- XML→JSON 変換テスト（3.8系 / 4系それぞれ）
- JSON→XML 変換テスト（3.8系 / 4系それぞれ）
- ラウンドトリップテスト（XML→JSON→XMLの等価性）
- bulk validation（実データ一括検証）
