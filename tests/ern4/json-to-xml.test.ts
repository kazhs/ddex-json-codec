import { describe, expect, test } from 'vite-plus/test';
import { xmlToJson, jsonToXml } from '../../src/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { PARSER_OPTIONS } from '../../src/converter/utils.js';

const fixtures = resolve(import.meta.dirname, '..', 'fixtures');
const ern42AlbumXml = readFileSync(resolve(fixtures, 'ern42/album.xml'), 'utf-8');
const ern42SingleXml = readFileSync(resolve(fixtures, 'ern42/single.xml'), 'utf-8');

describe('JSON→XML: ERN 4.2', () => {
  const msg = xmlToJson(ern42AlbumXml);
  const xml = jsonToXml(msg);

  test('contains XML declaration', () => {
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  test('contains correct namespace', () => {
    expect(xml).toContain('xmlns:ern="http://ddex.net/xml/ern/42"');
  });

  test('contains PartyList', () => {
    expect(xml).toContain('<PartyReference>PSaekoShu</PartyReference>');
    expect(xml).toContain('<FullName>Saeko Shu</FullName>');
  });

  test('contains ArtistPartyReference (not inline PartyName)', () => {
    expect(xml).toContain('<ArtistPartyReference>PSaekoShu</ArtistPartyReference>');
  });

  test('contains TrackRelease', () => {
    expect(xml).toContain('<TrackRelease>');
    expect(xml).toContain('<ReleaseResourceReference>A1</ReleaseResourceReference>');
  });

  test('contains UseType directly under DealTerms', () => {
    expect(xml).toContain('<UseType>ConditionalDownload</UseType>');
  });

  test('re-parseable as valid XML', () => {
    const parser = new XMLParser(PARSER_OPTIONS);
    expect(() => parser.parse(xml)).not.toThrow();
  });
});

describe('JSON→XML: ERN 4.2 single', () => {
  const msg = xmlToJson(ern42SingleXml);
  const xml = jsonToXml(msg);

  test('contains DisplayTitleText', () => {
    expect(xml).toContain('<DisplayTitleText>Been Waiting</DisplayTitleText>');
  });

  test('contains ReleaseLabelReference', () => {
    expect(xml).toContain('<ReleaseLabelReference>PWM</ReleaseLabelReference>');
  });
});
