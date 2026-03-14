import type { ErnVersion, ErnMajorVersion } from '../types/ern.js';
import { NAMESPACE_VERSION_MAP } from './namespaces.js';

/**
 * XMLの先頭部分からERNバージョンを検出する
 *
 * 検出戦略（Ruby実装 sshaw/ddex を参考）:
 * 1. namespace URI から検出（4系、3.8系共通）
 * 2. MessageSchemaVersionId 属性から検出（3.8系のフォールバック）
 *
 * 巨大ファイル対策として先頭1024バイトのみ読む
 */
export function detectVersion(xml: string): ErnVersion {
  const head = xml.slice(0, 1024);

  // 1. namespace URI から検出
  const nsMatch = head.match(/xmlns(?::\w+)?=["']http:\/\/(?:service\.)?ddex\.net\/xml\/(ern\/\d+)/i);
  if (nsMatch) {
    const versionId = nsMatch[1];
    const version = NAMESPACE_VERSION_MAP.get(versionId);
    if (version) return version;
  }

  // 2. MessageSchemaVersionId 属性から検出
  const schemaMatch = head.match(/MessageSchemaVersionId=["']([^"']+)["']/);
  if (schemaMatch) {
    const raw = schemaMatch[1]
      .trim()
      .replace(/\/\/+/g, '/')
      .replace(/^\/|\/$/g, '');
    const version = NAMESPACE_VERSION_MAP.get(raw);
    if (version) return version;
  }

  throw new Error(`Unsupported or unrecognized ERN version in XML: ${head.slice(0, 200)}...`);
}

/**
 * ErnVersion からメジャー系統を取得（変換ロジックの分岐用）
 */
export function getMajorVersion(version: ErnVersion): ErnMajorVersion {
  return version.startsWith('3.') ? '3.8' : '4';
}
