# converter/ — ローカルコンテキスト

ここが最も複雑なモジュール。変更時は慎重に。

## 構造

```
converter-factory.ts       # バージョン → Converter/Builder のディスパッチ
xml-to-json/               # XML→JSON（バージョン別Converter）
json-to-xml/               # JSON→XML（バージョン別Builder）
```

## 危険ポイント

### 4系の2パス処理 (xml-to-json)
1. **Pass 1**: PartyList を先に走査し `Map<PartyReference, Party>` を構築
2. **Pass 2**: ResourceList/ReleaseList を走査し、ArtistPartyReference を Map で解決

順序を間違えると参照解決が壊れる。PartyListがXML上でResourceListより後に出現する可能性もあるため、必ず全体パース後に2パスで処理すること。

### 4系のJSON→XML逆変換 (json-to-xml)
- `Artist.name`（解決済み）と `Artist.partyReference`（元ID）の両方からPartyListを再構築
- `DdexMessage.partyList` が存在すればそれを使う、なければArtistから再生成
- PartyReferenceの一意性を保証すること

### 3.8系と4系の分岐
- `ConverterFactory` がバージョンに応じて適切なConverter/Builderを返す
- 分岐は `ErnMajorVersion ('3.8' | '4')` レベル。パッチ間の差異はoptionalフィールドで吸収

## テスト時の注意
- ラウンドトリップテスト（XML→JSON→XML）は converter 全体を通すため、xml-to-json と json-to-xml の両方が正しくないと通らない
- 4系のアーティスト参照解決テストは必須
