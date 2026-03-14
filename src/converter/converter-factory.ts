import type { ErnVersion } from '../types/ern.js';
import { detectVersion, getMajorVersion } from '../version/detect.js';
import type { XmlToJsonConverter } from './xml-to-json/index.js';
import type { JsonToXmlBuilder } from './json-to-xml/index.js';

// TODO: 実装後にimportを追加
// import { Ern38Converter } from './xml-to-json/ern38-converter.js';
// import { Ern4Converter } from './xml-to-json/ern4-converter.js';
// import { Ern38Builder } from './json-to-xml/ern38-builder.js';
// import { Ern4Builder } from './json-to-xml/ern4-builder.js';

export class ConverterFactory {
  private constructor() {}

  static createXmlToJsonConverter(_version: ErnVersion): XmlToJsonConverter {
    const _major = getMajorVersion(_version);
    // TODO: implement
    throw new Error('Not implemented');
  }

  static createJsonToXmlBuilder(_version: ErnVersion): JsonToXmlBuilder {
    const _major = getMajorVersion(_version);
    // TODO: implement
    throw new Error('Not implemented');
  }
}
