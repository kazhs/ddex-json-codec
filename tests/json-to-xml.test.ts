import { describe, expect, test } from 'vite-plus/test';
import { xmlToJson, jsonToXml } from '../src/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { PARSER_OPTIONS } from '../src/converter/utils.js';

const fixtures = resolve(import.meta.dirname, 'fixtures');
const singleXml = readFileSync(resolve(fixtures, 'ern382/single.xml'), 'utf-8');
const albumXml = readFileSync(resolve(fixtures, 'ern382/album.xml'), 'utf-8');

describe('JSON→XML: ern382-single', () => {
  const msg = xmlToJson(singleXml);
  const xml = jsonToXml(msg);

  test('contains XML declaration', () => {
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  test('contains correct namespace', () => {
    expect(xml).toContain('xmlns:ern="http://ddex.net/xml/ern/382"');
  });

  test('contains MessageSchemaVersionId', () => {
    expect(xml).toContain('MessageSchemaVersionId="ern/382"');
  });

  test('contains key elements', () => {
    expect(xml).toContain('<MessageId>2417334_20241002_101032</MessageId>');
    expect(xml).toContain('<ISRC>DKFD52275001</ISRC>');
    expect(xml).toContain('<TitleText>Allez Allez Allez</TitleText>');
    expect(xml).toContain('<TakeDown>true</TakeDown>');
  });

  test('re-parseable as valid XML', () => {
    const parser = new XMLParser(PARSER_OPTIONS);
    expect(() => parser.parse(xml)).not.toThrow();
  });
});

describe('JSON→XML: ern382-album', () => {
  const msg = xmlToJson(albumXml);
  const xml = jsonToXml(msg);

  test('contains multiple SoundRecordings', () => {
    expect(xml).toContain('<ISRC>JPR842500194</ISRC>');
    expect(xml).toContain('<ISRC>JPR842500195</ISRC>');
  });

  test('contains Usage/UseType', () => {
    expect(xml).toContain('<UseType>PermanentDownload</UseType>');
    expect(xml).toContain('<UseType>OnDemandStream</UseType>');
  });

  test('contains ResourceContributor with UserDefined role', () => {
    expect(xml).toContain('UserDefinedValue="LeadVocalist"');
  });
});
