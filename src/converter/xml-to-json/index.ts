import type { DdexMessage, ErnVersion } from '../../types/ern.js';
import { detectVersion } from '../../version/detect.js';

export interface XmlToJsonConverter {
  convert(parsed: Record<string, unknown>, version: ErnVersion): DdexMessage;
}

/**
 * XML文字列をDdexMessageに変換する
 */
export function xmlToJson(_xml: string): DdexMessage {
  const _version = detectVersion(_xml);
  // TODO: implement
  throw new Error('Not implemented');
}
