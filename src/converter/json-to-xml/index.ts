import type { DdexMessage, ErnVersion } from '../../types/ern.js';
import { ConverterFactory } from '../converter-factory.js';

export interface JsonToXmlBuilder {
  build(message: DdexMessage, version: ErnVersion): string;
}

/**
 * DdexMessageをXML文字列に変換する
 */
export function jsonToXml(message: DdexMessage, version?: ErnVersion): string {
  const targetVersion = version ?? message.ernVersion;
  const builder = ConverterFactory.createJsonToXmlBuilder(targetVersion);
  return builder.build(message, targetVersion);
}
