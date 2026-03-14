# ERN バージョン差異

## バージョン検出

`detectVersion()` は XMLの先頭1024バイトのみ読む（巨大ファイル対策）。

1. **namespace URI** から検出: `xmlns:*="http://ddex.net/xml/ern/XXX"` の末尾
2. **MessageSchemaVersionId属性** から検出（3.8系フォールバック）

正規化ルール（Ruby実装 sshaw/ddex を参考）:
- 連続スラッシュ → 単一スラッシュ
- 先頭・末尾スラッシュ除去
- 大文字小文字不問

## namespace URI 一覧

| バージョン | namespace URI |
|---|---|
| 3.8 | `http://ddex.net/xml/ern/38` |
| 3.8.1 | `http://ddex.net/xml/ern/381` |
| 3.8.2 | `http://ddex.net/xml/ern/382` |
| 3.8.3 | `http://ddex.net/xml/ern/383` |
| 4.1 | `http://ddex.net/xml/ern/41` |
| 4.1.1 | `http://service.ddex.net/xml/ern/411` |
| 4.2 | `http://ddex.net/xml/ern/42` |
| 4.3 | `http://ddex.net/xml/ern/43` |
| 4.3.1 | `http://ddex.net/xml/ern/431` |
| 4.3.2 | `http://ddex.net/xml/ern/432` |

注: 4.1.1 はホストが `service.ddex.net`。

## 3.8系 vs 4系の構造差異

### アーティスト情報（最大の違い）

**3.8系**: インライン記述
```xml
<SoundRecordingDetailsByTerritory>
  <DisplayArtist>
    <PartyName><FullName>Artist Name</FullName></PartyName>
    <ArtistRole>MainArtist</ArtistRole>
  </DisplayArtist>
</SoundRecordingDetailsByTerritory>
```

**4系**: PartyList参照パターン
```xml
<PartyList>
  <Party>
    <PartyReference>P1</PartyReference>
    <PartyName><FullName>Artist Name</FullName></PartyName>
  </Party>
</PartyList>
<!-- SoundRecording内 -->
<DisplayArtist>
  <ArtistPartyReference>P1</ArtistPartyReference>
</DisplayArtist>
```

### トップレベル構造

| 要素 | 3.8系 | 4系 |
|---|---|---|
| MessageHeader | ✓ | ✓ |
| ResourceList | ✓ | ✓ |
| ReleaseList | ✓ | ✓ |
| DealList | ✓ | ✓ |
| PartyList | ✗ | ✓ |
| WorkList | ✓ | ✗ |
| CollectionList | ✓ | ✗ |
| ChapterList | ✗ | ✓ |

### SoundRecording

| 項目 | 3.8系 | 4系 |
|---|---|---|
| アーティスト | DetailsByTerritory内にインライン | DisplayArtist（PartyRef） |
| 技術詳細 | 1:1に近い | TechnicalDetails複数可 |
| テリトリー | DetailsByTerritory構造 | フラット |

### 属性

| 属性 | 3.8系 | 4系 |
|---|---|---|
| MessageSchemaVersionId | 必須 | なし |
| LanguageAndScriptCode | なし | 必須 |
| AvsVersionId | なし | 4.3〜必須 |

### バージョン間の追加要素

- 4.2: `IsProvidedInDelivery`
- 4.3: `AvsVersionId` 必須化、`ReleaseAdmin`
- 4.3.2: 最新、namespace `ern/432`

## 参考にしたOSSリポジトリ

| リポジトリ | 言語 | 主な参考箇所 |
|---|---|---|
| [anthonycorletti/ddex](https://github.com/anthonycorletti/ddex) | Python | 反面教師（型なし変換の問題点） |
| [sshaw/ddex](https://github.com/sshaw/ddex) | Ruby | namespace URI一覧、バージョン検出の正規化 |
| [OpenAudio/ddex-proto](https://github.com/OpenAudio/ddex-proto) | Go | 型の粒度、3.8 vs 4系の構造差異詳細 |
