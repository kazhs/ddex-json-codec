import { describe, expect, test } from 'vite-plus/test';
import { xmlToJson, jsonToXml } from '../../src/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixtures = resolve(import.meta.dirname, '..', 'fixtures');
const ern42AlbumXml = readFileSync(resolve(fixtures, 'ern42/album.xml'), 'utf-8');
const ern42SingleXml = readFileSync(resolve(fixtures, 'ern42/single.xml'), 'utf-8');
const ern43AlbumXml = readFileSync(resolve(fixtures, 'ern43/album.xml'), 'utf-8');

describe('Roundtrip: ERN 4.2', () => {
  test('album: XML→JSON→XML→JSON equivalence', () => {
    const json1 = xmlToJson(ern42AlbumXml);
    const xml2 = jsonToXml(json1);
    const json2 = xmlToJson(xml2);

    expect(json2.ernVersion).toBe(json1.ernVersion);
    expect(json2.messageHeader.messageId).toBe(json1.messageHeader.messageId);
    expect(json2.resourceList).toHaveLength(json1.resourceList.length);
    expect(json2.releaseList).toHaveLength(json1.releaseList.length);
    expect(json2.dealList).toHaveLength(json1.dealList.length);
    expect(json2.partyList).toHaveLength(json1.partyList!.length);

    // SoundRecording artist resolution preserved
    for (let i = 0; i < json1.resourceList.length; i++) {
      expect(json2.resourceList[i].displayArtists).toEqual(json1.resourceList[i].displayArtists);
      expect(json2.resourceList[i].soundRecordingId?.isrc).toBe(json1.resourceList[i].soundRecordingId?.isrc);
    }

    // TrackRelease preserved
    expect(json2.trackReleaseList).toHaveLength(json1.trackReleaseList!.length);
    for (let i = 0; i < json1.trackReleaseList!.length; i++) {
      expect(json2.trackReleaseList![i].releaseResourceReference).toBe(json1.trackReleaseList![i].releaseResourceReference);
    }

    // Deal preserved
    for (let i = 0; i < json1.dealList.length; i++) {
      expect(json2.dealList[i].dealReleaseReferences).toEqual(json1.dealList[i].dealReleaseReferences);
      for (let j = 0; j < json1.dealList[i].deals.length; j++) {
        expect(json2.dealList[i].deals[j].dealTerms).toEqual(json1.dealList[i].deals[j].dealTerms);
      }
    }
  });

  test('single: XML→JSON→XML→JSON equivalence', () => {
    const json1 = xmlToJson(ern42SingleXml);
    const xml2 = jsonToXml(json1);
    const json2 = xmlToJson(xml2);

    expect(json2.ernVersion).toBe(json1.ernVersion);
    expect(json2.releaseList[0].displayArtists).toEqual(json1.releaseList[0].displayArtists);
    expect(json2.releaseList[0].releaseLabelReferences).toEqual(json1.releaseList[0].releaseLabelReferences);
  });
});

describe('Roundtrip: ERN 4.3', () => {
  test('album: XML→JSON→XML→JSON equivalence', () => {
    const json1 = xmlToJson(ern43AlbumXml);
    const xml2 = jsonToXml(json1);
    const json2 = xmlToJson(xml2);

    expect(json2.ernVersion).toBe(json1.ernVersion);
    expect(json2.resourceList).toHaveLength(json1.resourceList.length);

    // ISRC from SoundRecordingEdition preserved
    for (let i = 0; i < json1.resourceList.length; i++) {
      expect(json2.resourceList[i].soundRecordingId?.isrc).toBe(json1.resourceList[i].soundRecordingId?.isrc);
      expect(json2.resourceList[i].displayArtists).toEqual(json1.resourceList[i].displayArtists);
    }

    // PartyList preserved
    expect(json2.partyList).toHaveLength(json1.partyList!.length);
    for (let i = 0; i < json1.partyList!.length; i++) {
      expect(json2.partyList![i].partyReference).toBe(json1.partyList![i].partyReference);
    }
  });
});
