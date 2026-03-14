# ddex-json-codec

DDEX ERN規格のXML/JSON相互変換ライブラリ（TypeScript）

## 特徴

- ERN XMLからTypeScript型付きオブジェクトへの変換、およびその逆変換
- ERN 3.8系 (3.8〜3.8.3) / 4系 (4.1〜4.3.2) に対応
- バージョン自動検出
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) ベース
- Node.js >= 20

## インストール

```bash
npm install ddex-json-codec
# or
pnpm add ddex-json-codec
```

## 使い方

### XML → JSON

```typescript
import { xmlToJson } from 'ddex-json-codec';

const message = xmlToJson(xmlString);
console.log(message.ernVersion); // "3.8.1"
console.log(message.resourceList); // SoundRecording[]
```

### JSON → XML

```typescript
import { jsonToXml } from 'ddex-json-codec';

const xml = jsonToXml(message);
// バージョン指定も可
const xml382 = jsonToXml(message, '3.8.2');
```

### バージョン検出

```typescript
import { detectVersion } from 'ddex-json-codec';

const version = detectVersion(xmlString); // "3.8.1"
```

## 対応バージョン

| ERN バージョン | 状態 |
|---|---|
| 3.8 | 実装済み |
| 3.8.1 | 実装済み |
| 3.8.2 | 実装済み |
| 3.8.3 | 実装済み |
| 4.1 | 実装済み |
| 4.1.1 | 実装済み |
| 4.2 | 実装済み |
| 4.3 | 実装済み |
| 4.3.1 | 実装済み |
| 4.3.2 | 実装済み |

## API リファレンス

### `xmlToJson(xml: string): DdexMessage`

ERN XMLを解析し、型付きオブジェクトを返す。バージョンは自動検出される。

### `jsonToXml(message: DdexMessage, version?: ErnVersion): string`

`DdexMessage` をERN XMLに変換する。`version` 省略時は `message.ernVersion` を使用。

### `detectVersion(xml: string): ErnVersion`

ERN XMLのnamespace URIからバージョンを検出して返す。

### 型

```typescript
interface DdexMessage {
  ernVersion: ErnVersion;
  messageHeader: MessageHeader;
  updateIndicator?: string;
  resourceList: SoundRecording[];
  releaseList: Release[];
  dealList: ReleaseDeal[];
  partyList?: Party[];              // 4系のみ
  trackReleaseList?: TrackRelease[]; // 4系のみ
}
```

エクスポートされる型一覧:

`DdexMessage`, `ErnVersion`, `ErnMajorVersion`, `MessageHeader`, `MessageParty`,
`SoundRecording`, `Release`, `TrackRelease`, `ResourceGroup`, `ReleaseResourceReference`,
`ReleaseDeal`, `Deal`, `DealTerms`, `Usage`,
`Party`, `Artist`, `DisplayArtist`, `ResourceContributor`, `IndirectResourceContributor`, `Contributor`,
`TextWithAttribute`, `Genre`, `PLine`, `CLine`, `Title`, `DisplayTitle`

## ライセンス

[MIT](./LICENSE.md)
