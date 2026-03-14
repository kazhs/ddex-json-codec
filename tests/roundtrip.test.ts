import { describe, expect, test } from 'vite-plus/test';
import { xmlToJson, jsonToXml } from '../src/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixtures = resolve(import.meta.dirname, 'fixtures');
const singleXml = readFileSync(resolve(fixtures, 'ern382/single.xml'), 'utf-8');
const albumXml = readFileSync(resolve(fixtures, 'ern382/album.xml'), 'utf-8');

describe('Roundtrip: XML→JSON→XML→JSON', () => {
  test('ern382-single: roundtrip produces equivalent JSON', () => {
    const json1 = xmlToJson(singleXml);
    const xml2 = jsonToXml(json1);
    const json2 = xmlToJson(xml2);

    // Compare key fields
    expect(json2.ernVersion).toBe(json1.ernVersion);
    expect(json2.messageHeader.messageId).toBe(json1.messageHeader.messageId);
    expect(json2.updateIndicator).toBe(json1.updateIndicator);
    expect(json2.resourceList).toHaveLength(json1.resourceList.length);
    expect(json2.releaseList).toHaveLength(json1.releaseList.length);
    expect(json2.dealList).toHaveLength(json1.dealList.length);

    // Deep compare SoundRecording
    const sr1 = json1.resourceList[0];
    const sr2 = json2.resourceList[0];
    expect(sr2.soundRecordingId?.isrc).toBe(sr1.soundRecordingId?.isrc);
    expect(sr2.referenceTitle.titleText).toBe(sr1.referenceTitle.titleText);
    expect(sr2.displayArtists).toEqual(sr1.displayArtists);
    expect(sr2.duration).toBe(sr1.duration);

    // Deep compare Release
    const r1 = json1.releaseList[0];
    const r2 = json2.releaseList[0];
    expect(r2.releaseId).toEqual(r1.releaseId);
    expect(r2.releaseType).toBe(r1.releaseType);
    expect(r2.displayArtists).toEqual(r1.displayArtists);
    expect(r2.pLine).toEqual(r1.pLine);
    expect(r2.cLine).toEqual(r1.cLine);

    // Deep compare Deal
    expect(json2.dealList[0].deals[0].dealTerms.takeDown).toBe(json1.dealList[0].deals[0].dealTerms.takeDown);
  });

  test('ern382-album: roundtrip produces equivalent JSON', () => {
    const json1 = xmlToJson(albumXml);
    const xml2 = jsonToXml(json1);
    const json2 = xmlToJson(xml2);

    expect(json2.ernVersion).toBe(json1.ernVersion);
    expect(json2.resourceList).toHaveLength(json1.resourceList.length);
    expect(json2.releaseList).toHaveLength(json1.releaseList.length);
    expect(json2.dealList).toHaveLength(json1.dealList.length);

    // SoundRecordings match
    for (let i = 0; i < json1.resourceList.length; i++) {
      expect(json2.resourceList[i].soundRecordingId?.isrc).toBe(json1.resourceList[i].soundRecordingId?.isrc);
      expect(json2.resourceList[i].displayArtists).toEqual(json1.resourceList[i].displayArtists);
    }

    // ResourceContributors match
    const dbt1 = json1.resourceList[0].detailsByTerritory![0];
    const dbt2 = json2.resourceList[0].detailsByTerritory![0];
    expect(dbt2.resourceContributors).toEqual(dbt1.resourceContributors);
    expect(dbt2.indirectResourceContributors).toEqual(dbt1.indirectResourceContributors);

    // Deals match
    for (let i = 0; i < json1.dealList.length; i++) {
      expect(json2.dealList[i].dealReleaseReferences).toEqual(json1.dealList[i].dealReleaseReferences);
      expect(json2.dealList[i].deals.length).toBe(json1.dealList[i].deals.length);
      for (let j = 0; j < json1.dealList[i].deals.length; j++) {
        expect(json2.dealList[i].deals[j].dealTerms).toEqual(json1.dealList[i].deals[j].dealTerms);
      }
    }
  });
});
