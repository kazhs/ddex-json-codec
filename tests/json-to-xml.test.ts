import { describe, expect, test } from 'vite-plus/test';
import { ddexToJson as xmlToJson, jsonToDdex as jsonToXml } from '../src/index.js';
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

describe('JSON→XML: ERN 3.8 multilingual PartyName', () => {
  test('outputs multiple PartyName with LanguageAndScriptCode when names is set', () => {
    const msg = xmlToJson(singleXml);
    const dbt = msg.resourceList[0].detailsByTerritory;
    if (dbt?.[0]) {
      dbt[0].displayArtists = [{
        artist: {
          name: 'アド',
          names: [
            { fullName: 'アド', languageAndScriptCode: 'ja' },
            { fullName: 'Ado', languageAndScriptCode: 'en' },
          ],
          roles: [{ role: 'MainArtist' }],
        },
        sequenceNumber: 1,
      }];
    }
    const xml = jsonToXml(msg);
    expect(xml).toContain('LanguageAndScriptCode="ja"');
    expect(xml).toContain('LanguageAndScriptCode="en"');
    expect(xml).toContain('<FullName>アド</FullName>');
    expect(xml).toContain('<FullName>Ado</FullName>');
  });

  test('falls back to single PartyName when names is not set', () => {
    const msg = xmlToJson(singleXml);
    const xml = jsonToXml(msg);
    expect(xml).toContain('<FullName>');
    // Should not have LanguageAndScriptCode when names is not set
    expect(xml).not.toMatch(/PartyName.*LanguageAndScriptCode/);
  });
});

describe('JSON→XML: ERN 3.8 multilingual Title', () => {
  test('outputs Title with LanguageAndScriptCode attribute', () => {
    const msg = xmlToJson(singleXml);
    const dbt = msg.resourceList[0].detailsByTerritory;
    if (dbt?.[0]) {
      dbt[0].titles = [
        { titleText: 'テスト', titleType: 'DisplayTitle', languageAndScriptCode: 'ja' },
        { titleText: 'TEST', titleType: 'DisplayTitle', languageAndScriptCode: 'en' },
      ];
    }
    const xml = jsonToXml(msg);
    expect(xml).toContain('LanguageAndScriptCode="ja"');
    expect(xml).toContain('LanguageAndScriptCode="en"');
    expect(xml).toContain('<TitleText>テスト</TitleText>');
    expect(xml).toContain('<TitleText>TEST</TitleText>');
  });
});
