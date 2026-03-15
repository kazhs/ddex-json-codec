import { describe, expect, test } from 'vite-plus/test';
import { xmlToJson, jsonToXml } from '../src/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixtures = resolve(import.meta.dirname, 'fixtures');
const monkeyClawXml = readFileSync(resolve(fixtures, 'ern382/official-album.xml'), 'utf-8');

describe('XML→JSON: DDEX official ERN 3.8.2 (Monkey Claw album)', () => {
  const msg = xmlToJson(monkeyClawXml);

  test('version detection', () => {
    expect(msg.ernVersion).toBe('3.8.2');
  });

  test('MessageHeader', () => {
    expect(msg.messageHeader.messageSender.partyId).toBe('DPID_OF_THE_SENDER');
    expect(msg.messageHeader.messageRecipient.partyId).toBe('DPID_OF_THE_RECIPIENT');
    expect(msg.messageHeader.messageCreatedDateTime).toBe('2012-12-11T15:50:00+00:00');
  });

  test('6 SoundRecordings', () => {
    expect(msg.resourceList).toHaveLength(6);
    expect(msg.resourceList[0].soundRecordingId?.isrc).toBe('CASE00000001');
    expect(msg.resourceList[0].referenceTitle?.titleText).toBe('Can you feel ...the Monkey Claw!');
    expect(msg.resourceList[0].duration).toBe('PT13M31S');
    expect(msg.resourceList[5].soundRecordingId?.isrc).toBe('CASE00000006');
    expect(msg.resourceList[5].referenceTitle?.titleText).toBe('Yes... I can feel the Monkey Claw!');
  });

  test('SoundRecording displayArtists', () => {
    // Track 1 has 2 DisplayArtists
    expect(msg.resourceList[0].displayArtists).toHaveLength(2);
    expect(msg.resourceList[0].displayArtists[0].artist.name).toBe('Monkey Claw');
    expect(msg.resourceList[0].displayArtists[1].artist.name).toBe('Second Artist');
    // Tracks 2-6 have 1 DisplayArtist
    expect(msg.resourceList[1].displayArtists).toHaveLength(1);
  });

  test('SoundRecording detailsByTerritory', () => {
    const dbt = msg.resourceList[0].detailsByTerritory![0];
    expect(dbt.territoryCode).toEqual(['Worldwide']);
    expect(dbt.titles).toHaveLength(2);
    expect(dbt.titles![0].titleType).toBe('FormalTitle');
    expect(dbt.pLine?.pLineText).toBe('(P) 2010 Iron Crown Music');
    expect(dbt.genre?.genreText).toBe('Metal');
    expect(dbt.genre?.subGenre).toBe('Progressive Metal');
  });

  test('ResourceContributor and IndirectResourceContributor', () => {
    const dbt = msg.resourceList[0].detailsByTerritory![0];
    expect(dbt.resourceContributors).toHaveLength(1);
    expect(dbt.resourceContributors![0].name).toBe('Steve Albino');
    expect(dbt.resourceContributors![0].role).toBe('Producer');
    expect(dbt.indirectResourceContributors).toHaveLength(1);
    expect(dbt.indirectResourceContributors![0].name).toBe('Bob Black');
    expect(dbt.indirectResourceContributors![0].role).toBe('Composer');
  });

  test('7 Releases (1 Album + 6 TrackReleases)', () => {
    expect(msg.releaseList).toHaveLength(7);
    expect(msg.releaseList[0].releaseType).toBe('Album');
    expect(msg.releaseList[0].releaseId?.gridOrIcpn).toBe('A1UCASE0000000401X');
    expect(msg.releaseList[0].referenceTitle?.titleText).toBe('A Monkey Claw in a Velvet Glove');

    for (let i = 1; i <= 6; i++) {
      expect(msg.releaseList[i].releaseType).toBe('TrackRelease');
    }
  });

  test('Album releaseResourceReferences (7 refs)', () => {
    const album = msg.releaseList[0];
    expect(album.releaseResourceReferences).toHaveLength(7);
    expect(album.releaseResourceReferences![0].releaseResourceType).toBe('PrimaryResource');
    expect(album.releaseResourceReferences![6].releaseResourceType).toBe('SecondaryResource');
    expect(album.releaseResourceReferences![6].value).toBe('A7');
  });

  test('Album ResourceGroup (nested, 6 tracks + 1 image)', () => {
    const rg = msg.releaseList[0].detailsByTerritory![0].resourceGroup;
    expect(rg).toBeDefined();
    // Outer: nested ResourceGroup + Image ContentItem
    expect(rg!.resourceGroups).toHaveLength(1);
    expect(rg!.resourceGroupContentItems).toHaveLength(1);
    expect(rg!.resourceGroupContentItems![0].resourceType).toBe('Image');

    // Nested group: 6 SoundRecording content items
    const nested = rg!.resourceGroups![0];
    expect(nested.sequenceNumber).toBe(1);
    expect(nested.title).toBe('Component 1');
    expect(nested.resourceGroupContentItems).toHaveLength(6);
  });

  test('Album PLine/CLine', () => {
    const album = msg.releaseList[0];
    expect(album.pLine?.year).toBe('2010');
    expect(album.pLine?.pLineText).toBe('(P) 2010 Iron Crown Music');
    expect(album.cLine?.cLineText).toBe('(C) 2010 Iron Crown Music');
  });

  test('Album detailsByTerritory', () => {
    const dbt = msg.releaseList[0].detailsByTerritory![0];
    expect(dbt.displayArtistName).toBe('Monkey Claw');
    expect(dbt.labelName).toBe('Iron Crown Music');
    expect(dbt.genre?.genreText).toBe('Metal');
  });

  test('Image resource', () => {
    expect(msg.imageList).toHaveLength(1);
    const img = msg.imageList![0];
    expect(img.resourceReference).toBe('A7');
    expect(img.type).toBe('FrontCoverImage');
    expect(img.imageId?.proprietaryId).toBe('PId0401');
    expect(img.detailsByTerritory![0].territoryCode).toEqual(['Worldwide']);
    expect(img.detailsByTerritory![0].technicalDetails?.file?.fileName).toBe('A1UCASE0000000401X.jpeg');
  });

  test('no DealList (not present in this sample)', () => {
    expect(msg.dealList).toHaveLength(0);
  });
});

describe('Roundtrip: DDEX official ERN 3.8.2 (Monkey Claw)', () => {
  test('XML→JSON→XML→JSON equivalence', () => {
    const json1 = xmlToJson(monkeyClawXml);
    const xml2 = jsonToXml(json1);
    const json2 = xmlToJson(xml2);

    expect(json2.ernVersion).toBe(json1.ernVersion);
    expect(json2.resourceList).toHaveLength(json1.resourceList.length);
    expect(json2.releaseList).toHaveLength(json1.releaseList.length);

    for (let i = 0; i < json1.resourceList.length; i++) {
      expect(json2.resourceList[i].soundRecordingId?.isrc).toBe(json1.resourceList[i].soundRecordingId?.isrc);
      expect(json2.resourceList[i].displayArtists).toEqual(json1.resourceList[i].displayArtists);
    }

    for (let i = 0; i < json1.releaseList.length; i++) {
      expect(json2.releaseList[i].releaseType).toBe(json1.releaseList[i].releaseType);
      expect(json2.releaseList[i].pLine).toEqual(json1.releaseList[i].pLine);
    }
  });
});
