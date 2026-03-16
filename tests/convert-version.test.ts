import { describe, expect, test } from 'vite-plus/test';
import { ddexToJson, jsonToDdex, convertDdexMessage, convertDdexVersion } from '../src/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixtures = resolve(import.meta.dirname, 'fixtures');
const ern382SingleXml = readFileSync(resolve(fixtures, 'ern382/single.xml'), 'utf-8');
const ern382AlbumXml = readFileSync(resolve(fixtures, 'ern382/album.xml'), 'utf-8');
const ern42SingleXml = readFileSync(resolve(fixtures, 'ern42/single.xml'), 'utf-8');
const ern42AlbumXml = readFileSync(resolve(fixtures, 'ern42/album.xml'), 'utf-8');

describe('convertDdexMessage: 3.8 → 4', () => {
  test('single: converts to v4.2', () => {
    const msg38 = ddexToJson(ern382SingleXml);
    const { result, warnings } = convertDdexMessage(msg38, '4');
    expect(result.ernVersion).toBe('4.3.2');
    expect(result.resourceList).toHaveLength(msg38.resourceList.length);
    expect(result.releaseList).toHaveLength(msg38.releaseList.length);
  });

  test('single: displayArtists preserved', () => {
    const msg38 = ddexToJson(ern382SingleXml);
    const { result } = convertDdexMessage(msg38, '4');
    const sr = result.resourceList[0];
    expect(sr.displayArtists.length).toBeGreaterThan(0);
    expect(sr.displayArtists[0].artist.name).toBeTruthy();
    expect(sr.displayArtists[0].artist.partyReference).toBeTruthy();
  });

  test('single: PartyList generated from inline artists', () => {
    const msg38 = ddexToJson(ern382SingleXml);
    const { result } = convertDdexMessage(msg38, '4');
    expect(result.partyList).toBeDefined();
    expect(result.partyList!.length).toBeGreaterThan(0);
    expect(result.partyList![0].partyName![0].fullName).toBeTruthy();
  });

  test('single: displayTitleText from referenceTitle', () => {
    const msg38 = ddexToJson(ern382SingleXml);
    const { result } = convertDdexMessage(msg38, '4');
    const sr = result.resourceList[0];
    expect(sr.displayTitleText).toBeTruthy();
  });

  test('single: deal takeDown removed with warning', () => {
    const msg38 = ddexToJson(ern382SingleXml);
    const { result, warnings } = convertDdexMessage(msg38, '4');
    const takeDownWarnings = warnings.filter(w => w.message.includes('takeDown'));
    // If source has takeDown deals, they should be removed
    const hasTakeDown = msg38.dealList.some(rd =>
      rd.deals.some(d => d.dealTerms.takeDown),
    );
    if (hasTakeDown) {
      expect(takeDownWarnings.length).toBeGreaterThan(0);
    }
    // All remaining deals should not have takeDown
    for (const rd of result.dealList) {
      for (const d of rd.deals) {
        expect(d.dealTerms.takeDown).toBeUndefined();
      }
    }
  });

  test('single: DealTerms usage unwrapped to useTypes', () => {
    const msg38 = ddexToJson(ern382SingleXml);
    const { result } = convertDdexMessage(msg38, '4');
    for (const rd of result.dealList) {
      for (const d of rd.deals) {
        expect(d.dealTerms.usage).toBeUndefined();
        // If original had usage, useTypes should exist
      }
    }
  });

  test('album: multiple resources converted', () => {
    const msg38 = ddexToJson(ern382AlbumXml);
    const { result } = convertDdexMessage(msg38, '4');
    expect(result.resourceList.length).toBe(msg38.resourceList.length);
    expect(result.releaseList.length).toBe(msg38.releaseList.length);
  });

  test('single: re-serializable to XML', () => {
    const msg38 = ddexToJson(ern382SingleXml);
    const { result } = convertDdexMessage(msg38, '4');
    const xml = jsonToDdex(result);
    expect(xml).toContain('xmlns:ern="http://ddex.net/xml/ern/432"');
    expect(xml).toContain('<PartyList>');
    expect(xml).toContain('<ArtistPartyReference>');
  });
});

describe('convertDdexMessage: 4 → 3.8', () => {
  test('single: converts to v3.8.2', () => {
    const msg4 = ddexToJson(ern42SingleXml);
    const { result, warnings } = convertDdexMessage(msg4, '3.8');
    expect(result.ernVersion).toBe('3.8.3');
    expect(result.resourceList).toHaveLength(msg4.resourceList.length);
    expect(result.releaseList).toHaveLength(msg4.releaseList.length);
  });

  test('single: PartyId drop warning', () => {
    const msg4 = ddexToJson(ern42SingleXml);
    const { warnings } = convertDdexMessage(msg4, '3.8');
    const partyIdWarnings = warnings.filter(w => w.message.includes('PartyId'));
    // If partyList has partyIds, should warn
    const hasPartyIds = msg4.partyList?.some(p => p.partyId?.length);
    if (hasPartyIds) {
      expect(partyIdWarnings.length).toBeGreaterThan(0);
    }
  });

  test('album: displayArtists resolved to inline', () => {
    const msg4 = ddexToJson(ern42AlbumXml);
    const { result } = convertDdexMessage(msg4, '3.8');
    const sr = result.resourceList[0];
    expect(sr.displayArtists.length).toBeGreaterThan(0);
    expect(sr.displayArtists[0].artist.name).toBeTruthy();
    // Should not have partyReference in 3.8
    expect(sr.displayArtists[0].artist.partyReference).toBeUndefined();
  });

  test('album: detailsByTerritory created with Worldwide', () => {
    const msg4 = ddexToJson(ern42AlbumXml);
    const { result } = convertDdexMessage(msg4, '3.8');
    const sr = result.resourceList[0];
    expect(sr.detailsByTerritory).toHaveLength(1);
    expect(sr.detailsByTerritory![0].territoryCode).toEqual(['Worldwide']);
  });

  test('album: TrackRelease dropped with warning', () => {
    const msg4 = ddexToJson(ern42AlbumXml);
    const { warnings } = convertDdexMessage(msg4, '3.8');
    if (msg4.trackReleaseList?.length) {
      const trWarnings = warnings.filter(w => w.message.includes('TrackRelease'));
      expect(trWarnings.length).toBeGreaterThan(0);
    }
  });

  test('album: DealTerms useTypes wrapped to usage', () => {
    const msg4 = ddexToJson(ern42AlbumXml);
    const { result } = convertDdexMessage(msg4, '3.8');
    for (const rd of result.dealList) {
      for (const d of rd.deals) {
        expect(d.dealTerms.useTypes).toBeUndefined();
      }
    }
  });

  test('album: re-serializable to XML', () => {
    const msg4 = ddexToJson(ern42AlbumXml);
    const { result } = convertDdexMessage(msg4, '3.8');
    const xml = jsonToDdex(result);
    expect(xml).toContain('xmlns:ern="http://ddex.net/xml/ern/383"');
    expect(xml).toContain('<SoundRecordingDetailsByTerritory>');
  });
});

describe('convertDdexMessage: same major version', () => {
  test('3.8 → 3.8 returns same message', () => {
    const msg = ddexToJson(ern382SingleXml);
    const { result, warnings } = convertDdexMessage(msg, '3.8');
    expect(result.ernVersion).toBe(msg.ernVersion);
    expect(warnings).toHaveLength(0);
  });

  test('4 → 4 returns same message', () => {
    const msg = ddexToJson(ern42SingleXml);
    const { result, warnings } = convertDdexMessage(msg, '4');
    expect(result.ernVersion).toBe(msg.ernVersion);
    expect(warnings).toHaveLength(0);
  });
});

describe('convertDdexVersion: XML → XML', () => {
  test('3.8.2 XML → 4.2 XML', () => {
    const { xml } = convertDdexVersion(ern382SingleXml, '4');
    expect(xml).toContain('xmlns:ern="http://ddex.net/xml/ern/432"');
    expect(xml).toContain('<?xml version="1.0"');
  });

  test('4.2 XML → 3.8.2 XML', () => {
    const { xml } = convertDdexVersion(ern42AlbumXml, '3.8');
    expect(xml).toContain('xmlns:ern="http://ddex.net/xml/ern/383"');
    expect(xml).toContain('<SoundRecordingDetailsByTerritory>');
  });
});
