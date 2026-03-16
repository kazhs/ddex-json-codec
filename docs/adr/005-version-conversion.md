# ADR-005: ERN バージョン間変換機能

## ステータス
Proposed (2026-03-16)

## コンテキスト
DSPごとに受け付けるERNバージョンが異なるため、「手元のv4 XMLをv3.8に変換して送りたい」等の需要がある。JSON→JSON のバージョン変換機能を追加する。

## API 設計

```typescript
interface ConversionWarning {
  type: 'field_dropped' | 'structure_changed';
  path: string;       // e.g. "resourceList[0].partyId"
  message: string;
}

function convertVersion(
  message: DdexMessage,
  targetVersion: ErnVersion,
): { result: DdexMessage; warnings: ConversionWarning[] }
```

## 変換ロジック

### 3.8 → 4

| 項目 | 変換方法 |
|---|---|
| `detailsByTerritory` → フラット | 各フィールドに `ApplicableTerritoryCode` を付与。先頭territoryを `IsDefault` とする |
| `PartyName` (インライン) → `PartyList` | 一意な名前ごとに `PartyReference` を生成し PartyList に集約 |
| `ReferenceTitle` → `DisplayTitle` | `titleText` → `DisplayTitle.titleText`、`IsDefault=true` |
| `ResourceContributor` → `Contributor` | PartyList に追加 + `ContributorPartyReference` で参照 |
| `Usage { useTypes }` → `useTypes` | ラッパーを外すだけ |
| `takeDown: true` の Deal | **Deal を除外**（4系では Deal の不在がテイクダウンを意味する） |
| `ValidityPeriod.EndDate` | そのまま保持（テイクダウンとは独立） |

### 4 → 3.8

| 項目 | 変換方法 |
|---|---|
| フラット → `detailsByTerritory` | `ApplicableTerritoryCode` でグルーピングして territory ブロックに再構成 |
| `PartyList` + `PartyReference` → インライン `PartyName` | 参照を解決してインライン化（既存の `ern4-converter.resolveParty()` と同じロジック） |
| `DisplayTitle` → `ReferenceTitle` + `Title[]` | `IsDefault` の titleText → `ReferenceTitle`、全件 → `Title[]` |
| `Contributor` → `ResourceContributor` | PartyList から name 解決してインライン化 |
| `useTypes` → `Usage { useTypes }` | ラッパーで包むだけ |
| Deal なし | そのまま（3.8でもDealなし＝テイクダウンとして扱える） |

## 情報ロスと warning

| 変換 | 項目 | 対応 |
|---|---|---|
| 3.8→4 | `takeDown: true` | Deal除外 + warning（意味的に等価） |
| 4→3.8 | `PartyId` (ISNI等) | 欠落 + warning（3.8の DisplayArtist に格納場所がない） |
| 4→3.8 | `TrackRelease` | 欠落 + warning（3.8にない構造） |
| 4→3.8 | `SoundRecordingEdition` | フラット化（データロスなし） |
| 双方向 | territory | 構造変換のみ（データ欠損なし） |

### PartyId 欠落の実務上の影響

PartyId には ISNI（国際標準名称識別子）や IPN（実演家識別番号）が含まれる。欠落すると:
- 同名アーティストの名寄せ（disambiguation）ができなくなる
- CMO（著作権管理団体）へのロイヤリティ報告精度が下がる

ただし、3.8系しか受け付けないレガシーDSP向けでは仕様上避けられない制約。DSP側が名前+レーベル+ISRC等の組み合わせで独自マッチングしている。

### テイクダウンの設計思想の違い

- **3.8系**: Deal 内に `<TakeDown>true</TakeDown>` で明示的に宣言
- **4系**: Deal の「不在」がテイクダウン。以前送った Deal を含まない NewReleaseMessage を送ることで権利取消を暗黙的に伝える。または `PurgeReleaseMessage`（別メッセージ型）を使う

### territory 変換の詳細

- **3.8系**: `DetailsByTerritory` ブロック単位で territory を分ける
- **4系**: 各要素に `ApplicableTerritoryCode` 属性を付けて要素単位で分ける
- 430件の実データでは全件 `Worldwide` 1件のみ（複数territory は0件）だが、ロジックとしては対応する
- 3.8→4 変換時、先頭の territory を `IsDefault="true"` とする

## 再利用できる既存ロジック

- `ern4-converter.resolveParty()` — PartyReference → インライン名の解決
- `ern4-builder.buildPartyList()` — インライン名 → PartyList 生成
- `ensureArray()` — 配列安全化ユーティリティ

## トレードオフ

- ロスレス変換は不可能だが、warning レポートにより利用者が判断できる
- `PurgeReleaseMessage` は対応しない（現在 `NewReleaseMessage` のみサポート）
- 4→3.8 の PartyId 欠落は仕様上の制約として許容する
