import { describe, expect, test } from 'vite-plus/test';
import { xmlToJson } from '../src/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixtures = resolve(import.meta.dirname, 'fixtures');
const singleXml = readFileSync(resolve(fixtures, 'ern382-single.xml'), 'utf-8');
const albumXml = readFileSync(resolve(fixtures, 'ern382-album.xml'), 'utf-8');

describe('XML→JSON: ern382-single.xml', () => {
  const msg = xmlToJson(singleXml);

  test('version detection', () => {
    expect(msg.ernVersion).toBe('3.8.2');
  });

  test('MessageHeader', () => {
    expect(msg.messageHeader.messageId).toBe('2417334_20241002_101032');
    expect(msg.messageHeader.messageSender.fullName).toBe('The Orchard Enterprises');
    expect(msg.messageHeader.messageSender.tradingName).toBe('The Orchard Enterprises, LLC');
    expect(msg.messageHeader.messageRecipient.fullName).toBe('MONSTAR LAB, INC.');
    expect(msg.messageHeader.messageCreatedDateTime).toBe('2024-10-02T10:10:32Z');
  });

  test('UpdateIndicator', () => {
    expect(msg.updateIndicator).toBe('UpdateMessage');
  });

  test('SoundRecording basics', () => {
    expect(msg.resourceList).toHaveLength(1);
    const sr = msg.resourceList[0];
    expect(sr.resourceReference).toBe('A1');
    expect(sr.type).toBe('MusicalWorkSoundRecording');
    expect(sr.soundRecordingId?.isrc).toBe('DKFD52275001');
    expect(sr.referenceTitle.titleText).toBe('Allez Allez Allez');
    expect(sr.duration).toBe('PT0H3M8S');
  });

  test('SoundRecording displayArtists (lifted from territory)', () => {
    const sr = msg.resourceList[0];
    expect(sr.displayArtists).toHaveLength(2);
    expect(sr.displayArtists[0].artist.name).toBe('Technica');
    expect(sr.displayArtists[0].artist.roles).toContain('MainArtist');
    expect(sr.displayArtists[0].sequenceNumber).toBe(1);
    expect(sr.displayArtists[1].artist.name).toBe('N/A');
    expect(sr.displayArtists[1].artist.roles).toContain('Composer');
  });

  test('SoundRecording detailsByTerritory', () => {
    const sr = msg.resourceList[0];
    const dbt = sr.detailsByTerritory;
    expect(dbt).toHaveLength(1);
    expect(dbt![0].territoryCode).toEqual(['Worldwide']);
    expect(dbt![0].labelName).toBe('Technica');
    expect(dbt![0].pLine?.pLineText).toBe('(P) 2016 Technica');
    expect(dbt![0].genre?.genreText).toBe('Pop');
  });

  test('Releases', () => {
    expect(msg.releaseList).toHaveLength(2);
    const main = msg.releaseList[0];
    expect(main.releaseType).toBe('Single');
    expect(main.releaseId?.icpn).toBe('5710261026118');
    expect(main.releaseId?.isEan).toBe(true);
    expect(main.referenceTitle.titleText).toBe('Allez Allez Allez');
    expect(main.displayArtists).toHaveLength(1);
    expect(main.displayArtists[0].artist.name).toBe('Technica');

    const track = msg.releaseList[1];
    expect(track.releaseType).toBe('TrackRelease');
    expect(track.releaseId?.isrc).toBe('DKFD52275001');
  });

  test('Release releaseResourceReferences', () => {
    const main = msg.releaseList[0];
    expect(main.releaseResourceReferences).toHaveLength(2);
    expect(main.releaseResourceReferences![0].value).toBe('A1');
    expect(main.releaseResourceReferences![0].releaseResourceType).toBe('PrimaryResource');
    expect(main.releaseResourceReferences![1].releaseResourceType).toBe('SecondaryResource');
  });

  test('Release ResourceGroup (nested)', () => {
    const main = msg.releaseList[0];
    const rg = main.detailsByTerritory![0].resourceGroup;
    expect(rg).toBeDefined();
    expect(rg!.resourceGroups).toHaveLength(1);
    expect(rg!.resourceGroups![0].sequenceNumber).toBe(1);
    expect(rg!.resourceGroups![0].resourceGroupContentItems).toHaveLength(1);
    expect(rg!.resourceGroups![0].resourceGroupContentItems![0].resourceType).toBe('SoundRecording');

    // Outer level image resource
    expect(rg!.resourceGroupContentItems).toHaveLength(1);
    expect(rg!.resourceGroupContentItems![0].resourceType).toBe('Image');
  });

  test('DealList (TakeDown)', () => {
    expect(msg.dealList).toHaveLength(2);
    const rd = msg.dealList[0];
    expect(rd.dealReleaseReferences).toEqual(['R0']);
    expect(rd.deals).toHaveLength(1);
    expect(rd.deals[0].dealTerms.takeDown).toBe(true);
    expect(rd.deals[0].dealTerms.territoryCode).toEqual(['JP']);
    expect(rd.deals[0].dealTerms.validityPeriod?.startDate).toBe('2019-01-14');
    expect(rd.effectiveDate).toBe('2024-10-02');
  });

  test('Release PLine/CLine', () => {
    const main = msg.releaseList[0];
    expect(main.pLine?.year).toBe('2016');
    expect(main.pLine?.pLineText).toBe('(P) 2016 Technica');
    expect(main.cLine?.year).toBe('2016');
    expect(main.cLine?.cLineText).toBe('(C) 2016 Technica');
  });
});

describe('XML→JSON: ern382-album.xml', () => {
  const msg = xmlToJson(albumXml);

  test('version detection', () => {
    expect(msg.ernVersion).toBe('3.8.2');
  });

  test('multiple SoundRecordings', () => {
    expect(msg.resourceList).toHaveLength(2);
    expect(msg.resourceList[0].soundRecordingId?.isrc).toBe('JPR842500194');
    expect(msg.resourceList[1].soundRecordingId?.isrc).toBe('JPR842500195');
  });

  test('SoundRecording ResourceContributors', () => {
    const sr = msg.resourceList[0];
    const dbt = sr.detailsByTerritory![0];
    expect(dbt.resourceContributors).toHaveLength(4);
    expect(dbt.resourceContributors![0].name).toBe('Misa Kimura');
    expect(dbt.resourceContributors![0].role).toBe('Producer');

    // UserDefined role with attributes
    const vocalist = dbt.resourceContributors![1];
    expect(vocalist.role).toBe('UserDefined');
    expect(vocalist.roleUserDefinedValue).toBe('LeadVocalist');
  });

  test('SoundRecording IndirectResourceContributors', () => {
    const sr = msg.resourceList[0];
    const dbt = sr.detailsByTerritory![0];
    expect(dbt.indirectResourceContributors).toHaveLength(2);
    expect(dbt.indirectResourceContributors![0].name).toBe('TV ASAHI MUSIC CO.,LTD.');
    expect(dbt.indirectResourceContributors![0].role).toBe('MusicPublisher');
  });

  test('multiple Releases (Album + TrackReleases)', () => {
    expect(msg.releaseList).toHaveLength(3);
    expect(msg.releaseList[0].releaseType).toBe('Album');
    expect(msg.releaseList[1].releaseType).toBe('TrackRelease');
    expect(msg.releaseList[2].releaseType).toBe('TrackRelease');
  });

  test('Album ResourceGroup with nested groups and multiple content items', () => {
    const album = msg.releaseList[0];
    const rg = album.detailsByTerritory![0].resourceGroup;
    expect(rg).toBeDefined();

    // Nested ResourceGroup containing 2 tracks
    expect(rg!.resourceGroups).toHaveLength(1);
    const nestedGroup = rg!.resourceGroups![0];
    expect(nestedGroup.sequenceNumber).toBe(1);
    expect(nestedGroup.title).toBe('Component 1');
    expect(nestedGroup.resourceGroupContentItems).toHaveLength(2);

    // Outer level image resource
    expect(rg!.resourceGroupContentItems).toHaveLength(1);
    expect(rg!.resourceGroupContentItems![0].resourceType).toBe('Image');
  });

  test('DealList with Usage/UseType', () => {
    expect(msg.dealList).toHaveLength(3);
    const rd = msg.dealList[0];
    expect(rd.deals).toHaveLength(2);

    const deal1 = rd.deals[0];
    expect(deal1.dealTerms.commercialModelType).toBe('PayAsYouGoModel');
    expect(deal1.dealTerms.usage?.useTypes).toEqual(['PermanentDownload']);

    const deal2 = rd.deals[1];
    expect(deal2.dealTerms.commercialModelType).toBe('SubscriptionModel');
    expect(deal2.dealTerms.usage?.useTypes).toEqual(['NonInteractiveStream', 'OnDemandStream']);
  });

  test('UpdateIndicator', () => {
    expect(msg.updateIndicator).toBe('OriginalMessage');
  });

  test('ReferenceTitle with SubTitle', () => {
    const sr = msg.resourceList[1];
    expect(sr.referenceTitle.titleText.normalize('NFC')).toBe('ハグ！');
    expect(sr.referenceTitle.subTitle).toBe('Instrumental');
  });
});
