# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

DDEX ERN規格のXML ↔ JSON相互変換TypeScriptライブラリ (`@ddex/json-codec`)。
対応: ERN 3.8系 (3.8〜3.8.3) / ERN 4系 (4.1〜4.3.2)。

## Commands

```bash
vp test                                   # テスト実行
vp test -- tests/version/detect.test.ts   # 単一ファイル
vp pack                                   # ライブラリビルド
vp check                                  # lint + format + 型チェック
vp install                                # 依存インストール
```

## Repo map

```
src/
  index.ts              # 公開API: xmlToJson, jsonToXml, detectVersion
  types/                # 型定義（統一型、4系固有はoptional）
  version/              # バージョン検出 + namespace URIマッピング
  converter/            # XML↔JSON変換（ファクトリー + バージョン別Converter）
tests/
  fixtures/             # サンプルXML
docs/                   # 詳細ドキュメント（↓参照）
```

## Rules

- 内部import: `.js` 拡張子付き相対パス（`'./types/ern.js'`）
- テスト: `import { test, expect } from 'vite-plus/test'`
- 設定は `vite.config.ts` に一元化（vitest.config.ts, tsdown.config.ts は使わない）
- XMLパーサー: fast-xml-parser

## docs/ — 詳細はここを見る

- [docs/architecture.md](docs/architecture.md) — アーキテクチャ・設計原則
- [docs/adr/](docs/adr/) — 設計決定の記録（ADR）
- [docs/ern-versions.md](docs/ern-versions.md) — ERN 3.8 vs 4系の構造差異
