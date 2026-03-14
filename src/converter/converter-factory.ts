import type { ErnVersion } from '../types/ern.js';
import { getMajorVersion } from '../version/detect.js';
import type { XmlToJsonConverter } from './xml-to-json/index.js';
import type { JsonToXmlBuilder } from './json-to-xml/index.js';
import { Ern38Converter } from './xml-to-json/ern38-converter.js';
import { Ern38Builder } from './json-to-xml/ern38-builder.js';

export class ConverterFactory {
  private constructor() {}

  static createXmlToJsonConverter(version: ErnVersion): XmlToJsonConverter {
    const major = getMajorVersion(version);
    switch (major) {
      case '3.8':
        return new Ern38Converter();
      case '4':
        throw new Error('ERN 4.x converter is not yet implemented');
    }
  }

  static createJsonToXmlBuilder(version: ErnVersion): JsonToXmlBuilder {
    const major = getMajorVersion(version);
    switch (major) {
      case '3.8':
        return new Ern38Builder();
      case '4':
        throw new Error('ERN 4.x builder is not yet implemented');
    }
  }
}
