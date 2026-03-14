import { XMLParser } from 'fast-xml-parser';
import type { DdexMessage, ErnVersion } from '../../types/ern.js';
import { detectVersion } from '../../version/detect.js';
import { ConverterFactory } from '../converter-factory.js';
import { PARSER_OPTIONS } from '../utils.js';

export interface XmlToJsonConverter {
  convert(parsed: Record<string, unknown>, version: ErnVersion): DdexMessage;
}

/**
 * XML文字列をDdexMessageに変換する
 */
export function xmlToJson(xml: string): DdexMessage {
  const version = detectVersion(xml);
  const parser = new XMLParser(PARSER_OPTIONS);
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const converter = ConverterFactory.createXmlToJsonConverter(version);
  return converter.convert(parsed, version);
}
