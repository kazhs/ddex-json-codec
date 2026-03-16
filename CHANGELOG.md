# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.4.1] - 2026-03-16

### Changed
- npm publish を Trusted Publishing (OIDC) に移行、NPM_TOKEN 不要に

## [0.4.0] - 2026-03-16

### Breaking Changes
- **公開API関数のリネーム**: DDEXプレフィックスを追加し、importの明確化を実現
  - `xmlToJson` → `ddexToJson`
  - `jsonToXml` → `jsonToDdex` (`version` 引数も削除)
  - `detectVersion` → `detectDdexVersion`

### Added
- `convertDdexVersion(xml, target: ErnMajorVersion)` — DDEX XML文字列をターゲットメジャーバージョンに変換（`'3.8'` or `'4'`）
- `convertDdexMessage(message, target: ErnMajorVersion)` — DdexMessage をターゲットメジャーバージョンに変換
- `ConversionResult`, `ConversionWarning` 型のエクスポート
- 3.8→4変換: detailsByTerritoryフラット化、PartyList生成、DealTerms変換、takeDown Deal除外
- 4→3.8変換: PartyReference解決、detailsByTerritory再構成、Contributor→ResourceContributor変換

## [0.3.1] - 2026-03-15

### Added
- ERN 3.8系: 多言語 `PartyName` のパース/出力 — `Artist.names` に `LanguageAndScriptCode` 属性付き複数 `PartyName` を格納 (#2)
- ERN 3.8系: `Title.languageAndScriptCode` フィールド — 言語別タイトルの出力に対応 (#2)

## [0.3.0] - 2026-03-15

### Breaking Changes
- **Discriminated Union型への移行**: `DdexMessage`, `SoundRecording`, `Release`, `Image` を3.8系/4系で分離。`ernVersion` リテラルでnarrowingできるようになった ([ADR-003](docs/adr/003-discriminated-union.md))
  - `DdexMessage` → `DdexMessage38 | DdexMessage4`
  - `SoundRecording` → `SoundRecording38 | SoundRecording4`
  - `Release` → `Release38 | Release4`
  - `Image` → `Image38 | Image4`
  - 各Baseインターフェース (`DdexMessageBase`, `SoundRecordingBase`, `ReleaseBase`, `ImageBase`) もエクスポート
  - `ErnVersion38`, `ErnVersion4` 型を追加

### Added
- v4 `UpdateIndicator` 対応: XML属性 `@UpdateIndicator` のパース/出力 (#1)
- `ResourceContributor.instrumentType` フィールド (#1)
- `TechnicalSoundRecordingDetails.bitsPerSample` フィールド (#1)
- `ReleaseId.catalogNumberNamespace` フィールド (#1)
- `PartyName` 型のエクスポート (#1)
- `ReleaseId`, `ReleaseDetailsByTerritory`, `SoundRecordingDetailsByTerritory` 型のエクスポート

### Fixed
- v4で `detailsByTerritory` がサイレントに無視される問題を型レベルで解決 — v4型に `detailsByTerritory` が存在しないためコンパイル時にエラーになる (#1)

## [0.2.0] - 2026-03-14

### Added
- `Image` リソース型と `TechnicalImageDetails`, `FileDetails`, `HashSum` 型
- `TechnicalSoundRecordingDetails` の全フィールド (audioCodecType, bitRate, samplingRate, etc.)
- 多言語 `Artist.names` (PartyName[]) サポート
- `ArtistRole` の UserDefined 属性 (namespace, userDefinedValue)
- `DisplayArtistName` フィールド (3.8系 territory)

## [0.1.1] - 2026-03-13

### Changed
- README を英語に書き直し

## [0.1.0] - 2026-03-13

### Added
- ERN 3.8系 (3.8〜3.8.3) XML↔JSON 双方向変換
- ERN 4系 (4.1〜4.3.2) XML↔JSON 双方向変換
- `xmlToJson()`, `jsonToXml()`, `detectVersion()` 公開API
- 4系 PartyList 参照解決 (2パス処理)
- ラウンドトリップ保証 (XML→JSON→XML等価性)
