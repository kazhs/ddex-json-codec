# ADR-003: Discriminated Union型への移行

## ステータス
Accepted (2026-03-15)

## コンテキスト
ADR-001で採用した統一型方式（3.8系と4系で同一interface）で、以下の問題が発生した:

- v4で `detailsByTerritory` を設定しても**サイレントに無視**される（型的には合法だがランタイムで機能しない）
- 3.8系固有/4系固有のフィールドがinterfaceから読み取れず、利用者が誤用する
- v0.2.0で実際のユーザーから報告があった（GitHub Issue #1）

v0.2.0時点でダウンロード数が少なく（157件）、破壊的変更のコストが低い。

## 決定
**Discriminated Union方式**に移行する。`ernVersion`リテラル型でnarrowingできるようにする。

```typescript
type ErnVersion38 = '3.8' | '3.8.1' | '3.8.2' | '3.8.3';
type ErnVersion4 = '4.1' | '4.1.1' | '4.2' | '4.3' | '4.3.1' | '4.3.2';

interface DdexMessage38 extends DdexMessageBase {
  ernVersion: ErnVersion38;
  resourceList: SoundRecording38[];
  // ...3.8系固有フィールド
}

interface DdexMessage4 extends DdexMessageBase {
  ernVersion: ErnVersion4;
  resourceList: SoundRecording4[];
  partyList?: Party[];
  // ...4系固有フィールド
}

type DdexMessage = DdexMessage38 | DdexMessage4;
```

### 分離対象
- `DdexMessage` → `DdexMessage38 | DdexMessage4`
- `SoundRecording` → `SoundRecording38 | SoundRecording4`
- `Release` → `Release38 | Release4`
- `Image` → `Image38 | Image4`

### 分離しないもの
`Party`, `Artist`, `DisplayArtist`, `ReleaseDeal`, `DealTerms` 等は共通のまま。

## 理由
- v4で `detailsByTerritory` を渡すと**コンパイル時にエラー**になる（サイレント無視を防止）
- `ernVersion` リテラルで自然にnarrowingでき、利用者のバージョン分岐が型安全になる
- 共通フィールドはBaseインターフェースに集約し、型の重複を最小化
- generics（Conditional Types）は検討したが、plain extends + Discriminated Unionの方がシンプル

## トレードオフ
- エクスポートする型の数が増える（`SoundRecordingBase`, `SoundRecording38`, `SoundRecording4` 等）
- v0.2.0からの破壊的変更（union型への移行、バージョン固有フィールドの移動）
