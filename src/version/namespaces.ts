import type { ErnVersion } from '../types/ern.js';

/**
 * namespace URI末尾のバージョン識別子 → ErnVersion のマッピング
 * Ruby実装 (sshaw/ddex) の etc/namespaces.yml を参考に構築
 */
export const NAMESPACE_VERSION_MAP: ReadonlyMap<string, ErnVersion> = new Map([
  // 3.8系
  ['ern/38', '3.8'],
  ['ern/381', '3.8.1'],
  ['ern/382', '3.8.2'],
  ['ern/383', '3.8.3'],
  // 4系
  ['ern/41', '4.1'],
  ['ern/411', '4.1.1'],
  ['ern/42', '4.2'],
  ['ern/43', '4.3'],
  ['ern/431', '4.3.1'],
  ['ern/432', '4.3.2'],
]);

/**
 * ErnVersion → namespace URI のマッピング（JSON→XML変換用）
 */
export const VERSION_NAMESPACE_MAP: ReadonlyMap<ErnVersion, string> = new Map([
  ['3.8', 'http://ddex.net/xml/ern/38'],
  ['3.8.1', 'http://ddex.net/xml/ern/381'],
  ['3.8.2', 'http://ddex.net/xml/ern/382'],
  ['3.8.3', 'http://ddex.net/xml/ern/383'],
  ['4.1', 'http://ddex.net/xml/ern/41'],
  ['4.1.1', 'http://service.ddex.net/xml/ern/411'],
  ['4.2', 'http://ddex.net/xml/ern/42'],
  ['4.3', 'http://ddex.net/xml/ern/43'],
  ['4.3.1', 'http://ddex.net/xml/ern/431'],
  ['4.3.2', 'http://ddex.net/xml/ern/432'],
]);
