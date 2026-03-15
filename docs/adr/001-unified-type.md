# ADR-001: 統一型方式の採用

## ステータス
Superseded by [ADR-003](003-discriminated-union.md) (2026-03-15)

## コンテキスト
ERN 3.8系と4系でXMLの構造が大きく異なる。型定義をバージョンごとに分離するか、統一するかの選択が必要。

参考にしたOSS (Ruby: sshaw/ddex, Go: OpenAudio/ddex-proto) はどちらもバージョンごとに完全独立の型を持つ方式。ただしこれらはXSDからの自動生成が前提。

## 決定
**統一型 + 4系固有フィールドをoptional** で行く。

```typescript
interface DdexMessage {
  ernVersion: ErnVersion;
  resourceList: SoundRecording[];
  partyList?: Party[];          // 4系のみ
  trackReleaseList?: TrackRelease[];  // 4系のみ
}
```

## 理由
- API利用者が単一の型で扱える（バージョン分岐がライブラリ内に閉じる）
- 仕様書の要件「知らないフィールドは無視、知っているフィールドはあれば取る」と一致
- バージョン独立型はXSD自動生成前提であり、手書きでは保守コストが高い

## トレードオフ
- 4系固有フィールドがoptionalなので、利用者側でundefinedチェックが必要
- 3.8系と4系の構造差異がinterfaceから読み取りにくい
