# ADR-003: vite+の採用

## ステータス
Accepted (2026-03-14)

## コンテキスト
ライブラリのビルド・テスト・lint環境の選定。候補: tsup + Vitest + ESLint / vite+ (統合ツールチェイン)。

## 決定
**vite+** を採用。設定は `vite.config.ts` に一元化。

- ビルド: `vp pack` (tsdownベース)
- テスト: `vp test` (Vitestベース)
- lint/format/型チェック: `vp check` (Oxlint + Oxfmt + tsgolint)

## 理由
- 設定ファイルが1つで済む
- ツール間の設定共有が自動（Vite resolveやtransform設定をテストが再利用）
- CLI統一（`vp` だけ覚えればいい）

## 注意
- `vitest.config.ts`, `tsdown.config.ts` は作らない
- `vp build` はアプリ用、`vp pack` がライブラリ用（間違えやすい）
- `vp test` はwatchモードにならない（`vp test watch` が必要）
