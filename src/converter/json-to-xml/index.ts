import type { DdexMessage, ErnVersion } from '../../types/ern.js';

export interface JsonToXmlBuilder {
  build(message: DdexMessage, version: ErnVersion): string;
}

/**
 * DdexMessageをXML文字列に変換する
 */
export function jsonToXml(_message: DdexMessage, _version?: ErnVersion): string {
  const _targetVersion = _version ?? _message.ernVersion;
  // TODO: implement
  throw new Error('Not implemented');
}
