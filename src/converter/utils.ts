import type { X2jOptions, XmlBuilderOptions } from 'fast-xml-parser';

/**
 * 単一要素をオブジェクトで返す fast-xml-parser の挙動を防御し、常に配列にする
 */
export function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * fast-xml-parser が常に配列として返すべきタグ名
 */
const ALWAYS_ARRAY_TAGS = new Set([
  'SoundRecording',
  'Image',
  'Release',
  'ReleaseDeal',
  'Deal',
  'DisplayArtist',
  'ResourceContributor',
  'IndirectResourceContributor',
  'ResourceGroupContentItem',
  'ResourceGroup',
  'ReleaseResourceReference',
  'Title',
  'TerritoryCode',
  'UseType',
  'Genre',
  'PLine',
  'CLine',
  'SoundRecordingDetailsByTerritory',
  'ReleaseDetailsByTerritory',
  'ImageDetailsByTerritory',
  'DealReleaseReference',
]);

/**
 * fast-xml-parser XMLParser 設定
 */
export const PARSER_OPTIONS: Partial<X2jOptions> = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (_name: string, _jpath: unknown, _isLeafNode: boolean, isAttribute: boolean) => {
    if (isAttribute) return false;
    return ALWAYS_ARRAY_TAGS.has(_name);
  },
};

/**
 * fast-xml-parser XMLBuilder 設定
 */
export const BUILDER_OPTIONS: Partial<XmlBuilderOptions> = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  format: true,
  indentBy: '  ',
  suppressBooleanAttributes: false,
  suppressEmptyNode: true,
};
