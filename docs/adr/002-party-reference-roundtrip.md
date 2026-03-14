# ADR-002: PartyReferenceのラウンドトリップ保持

## ステータス
Accepted (2026-03-14)

## コンテキスト
4系ではアーティスト情報がPartyListに集約され、SoundRecording等からはPartyReferenceで参照される。JSON変換時に参照を解決して実際の名前を埋め込む仕様だが、JSON→XMLのラウンドトリップ時にPartyListとPartyReferenceを再構築する必要がある。

## 決定
**解決済みの名前 + 元のPartyReference + PartyList の3つを全てJSONに保持する。**

```typescript
interface Artist {
  name: string;              // 解決済みの名前（利用者向け）
  partyReference?: string;   // 元の参照ID（ラウンドトリップ用）
}

interface DdexMessage {
  partyList?: Party[];       // 4系のみ: ラウンドトリップ用に保持
}
```

## 理由
- JSON利用者は `artist.name` だけ見ればいい（参照解決済み）
- JSON→XML変換時は `partyReference` と `partyList` から元の構造を復元できる
- テスト要件「XML→JSON→XMLで元のXMLと等価」を満たせる

## トレードオフ
- JSONのサイズがやや増える（名前の重複保持）
- partyListとartist.nameの不整合が起きうる（ライブラリ内で整合性を保証する）
