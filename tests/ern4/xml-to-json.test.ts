import { describe, expect, test } from 'vite-plus/test';
import { ddexToJson as xmlToJson } from '../../src/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixtures = resolve(import.meta.dirname, '..', 'fixtures');
const ern42SingleXml = readFileSync(resolve(fixtures, 'ern42/single.xml'), 'utf-8');
const ern42AlbumXml = readFileSync(resolve(fixtures, 'ern42/album.xml'), 'utf-8');
const ern43SingleXml = readFileSync(resolve(fixtures, 'ern43/single.xml'), 'utf-8');
const ern43AlbumXml = readFileSync(resolve(fixtures, 'ern43/album.xml'), 'utf-8');

describe('XML→JSON: ERN 4.2 single', () => {
  const msg = xmlToJson(ern42SingleXml);

  test('version detection', () => {
    expect(msg.ernVersion).toBe('4.2');
  });

  test('MessageHeader', () => {
    expect(msg.messageHeader.messageId).toBe('W83751545');
    expect(msg.messageHeader.messageSender.fullName).toBe('Warner Music Group');
    expect(msg.messageHeader.messageRecipient.fullName).toBe('226-24-7 MusicShop LLC');
  });

  test('PartyList preserved', () => {
    expect(msg.partyList).toHaveLength(3);
    expect(msg.partyList![0].partyReference).toBe('PAsh');
    expect(msg.partyList![0].partyName![0].fullName).toBe('Ash');
  });

  test('Release basics', () => {
    expect(msg.releaseList).toHaveLength(1);
    const release = msg.releaseList[0];
    expect(release.releaseType).toBe('SingleResourceRelease');
    expect(release.releaseId?.gridOrIcpn).toBe('A10302B0003662026S');
    expect(release.displayTitleText).toBe('Been Waiting');
  });

  test('Release DisplayArtist resolved from PartyList', () => {
    const release = msg.releaseList[0];
    expect(release.displayArtists).toHaveLength(1);
    expect(release.displayArtists[0].artist.name).toBe('Ash');
    expect(release.displayArtists[0].artist.partyReference).toBe('PAsh');
    expect(release.displayArtists[0].artist.roles).toContainEqual({ role: 'MainArtist' });
  });

  test('Release ReleaseLabelReference', () => {
    const release = msg.releaseList[0];
    expect(release.releaseLabelReferences).toEqual(['PWM']);
  });

  test('DealList with UseType directly under DealTerms', () => {
    expect(msg.dealList).toHaveLength(1);
    const rd = msg.dealList[0];
    expect(rd.deals).toHaveLength(3);
    expect(rd.deals[0].dealTerms.useTypes).toEqual(['NonInteractiveStream', 'OnDemandStream']);
    expect(rd.deals[0].dealTerms.commercialModelType).toBe('AdvertisementSupportedModel');
  });
});

describe('XML→JSON: ERN 4.2 album', () => {
  const msg = xmlToJson(ern42AlbumXml);

  test('version detection', () => {
    expect(msg.ernVersion).toBe('4.2');
  });

  test('PartyList with multiple PartyNames (multilingual)', () => {
    expect(msg.partyList).toHaveLength(2);
    const saekoShu = msg.partyList![0];
    expect(saekoShu.partyName).toHaveLength(2);
    expect(saekoShu.partyName![0].fullName).toBe('Saeko Shu');
    expect(saekoShu.partyName![0].fullNameIndexed).toBe('Shu, Saeko');
    expect(saekoShu.partyName![1].fullName).toBe('しゅうさえこ');
    expect(saekoShu.partyName![1].languageAndScriptCode).toBe('ja-Jpan');
  });

  test('multiple SoundRecordings', () => {
    expect(msg.resourceList).toHaveLength(2);
    expect(msg.resourceList[0].soundRecordingId?.isrc).toBe('JPTO09404900');
    expect(msg.resourceList[1].soundRecordingId?.isrc).toBe('JPTO09404910');
  });

  test('SoundRecording DisplayTitles (multilingual)', () => {
    const sr = msg.resourceList[0];
    expect(sr.displayTitles).toHaveLength(2);
    expect(sr.displayTitles![0].titleText).toBe('Yume no Lullaby');
    expect(sr.displayTitles![0].isDefault).toBe(true);
    expect(sr.displayTitles![1].languageAndScriptCode).toBe('ja-Jpan');
  });

  test('SoundRecording DisplayArtist resolved from PartyList', () => {
    const sr = msg.resourceList[0];
    expect(sr.displayArtists).toHaveLength(1);
    expect(sr.displayArtists[0].artist.name).toBe('Saeko Shu');
    expect(sr.displayArtists[0].artist.partyReference).toBe('PSaekoShu');
  });

  test('SoundRecording DisplayArtist multilingual names', () => {
    const sr = msg.resourceList[0];
    const artist = sr.displayArtists[0].artist;
    expect(artist.names).toHaveLength(2);
    expect(artist.names![0].fullName).toBe('Saeko Shu');
    expect(artist.names![1].fullName).toBe('しゅうさえこ');
    expect(artist.names![1].languageAndScriptCode).toBe('ja-Jpan');
  });

  test('SoundRecording Contributor', () => {
    const sr = msg.resourceList[0];
    expect(sr.contributors).toHaveLength(1);
    expect(sr.contributors![0].contributorPartyReference).toBe('PSaekoShu');
    expect(sr.contributors![0].name).toBe('Saeko Shu');
    expect(sr.contributors![0].role).toBe('Artist');
  });

  test('Image resource', () => {
    expect(msg.imageList).toHaveLength(1);
    const img = msg.imageList![0];
    expect(img.resourceReference).toBe('A3');
    expect(img.type).toBe('FrontCoverImage');
    expect(img.imageId?.proprietaryId).toBe('PACKSHOT:0094631432057');
    expect(img.technicalDetails?.file?.uri).toBe('0094631432057.jpg');
  });

  test('TrackRelease list', () => {
    expect(msg.trackReleaseList).toHaveLength(2);
    expect(msg.trackReleaseList![0].releaseReference).toBe('R1');
    expect(msg.trackReleaseList![0].releaseResourceReference).toBe('A1');
    expect(msg.trackReleaseList![0].releaseLabelReferences).toEqual(['PEMI']);
  });

  test('Release ResourceGroup', () => {
    const album = msg.releaseList[0];
    expect(album.resourceGroup).toBeDefined();
    expect(album.resourceGroup!.sequenceNumber).toBe(1);
    expect(album.resourceGroup!.title).toBe('Component 1');
    expect(album.resourceGroup!.resourceGroupContentItems).toHaveLength(2);
  });

  test('DealList with multiple DealReleaseReferences', () => {
    const rd = msg.dealList[0];
    expect(rd.dealReleaseReferences).toEqual(['R1', 'R2']);
  });
});

describe('XML→JSON: ERN 4.3 single', () => {
  const msg = xmlToJson(ern43SingleXml);

  test('version detection', () => {
    expect(msg.ernVersion).toBe('4.3');
  });

  test('PartyList preserved', () => {
    expect(msg.partyList).toHaveLength(3);
  });

  test('Release basics', () => {
    expect(msg.releaseList).toHaveLength(1);
    expect(msg.releaseList[0].displayTitleText).toBe('Been Waiting');
  });
});

describe('XML→JSON: ERN 4 UpdateIndicator', () => {
  test('parses @UpdateIndicator attribute from v4 root element', () => {
    const xmlWithUpdate = ern42SingleXml.replace(
      '<ern:NewReleaseMessage',
      '<ern:NewReleaseMessage UpdateIndicator="UpdateMessage"',
    );
    const msg = xmlToJson(xmlWithUpdate);
    expect(msg.updateIndicator).toBe('UpdateMessage');
  });

  test('updateIndicator is undefined when not present', () => {
    const msg = xmlToJson(ern42SingleXml);
    expect(msg.updateIndicator).toBeUndefined();
  });
});

describe('XML→JSON: ERN 4.3 album', () => {
  const msg = xmlToJson(ern43AlbumXml);

  test('version detection', () => {
    expect(msg.ernVersion).toBe('4.3');
  });

  test('SoundRecordingEdition: ISRC extracted from Edition', () => {
    const sr = msg.resourceList[0];
    expect(sr.soundRecordingId?.isrc).toBe('JPTO09404900');
  });

  test('SoundRecordingEdition: PLine extracted from Edition', () => {
    const sr = msg.resourceList[0];
    expect(sr.pLine?.pLineText).toBe('(P) 1994 EMI Music Japan Inc.');
  });

  test('DisplayArtist resolved from PartyList', () => {
    const sr = msg.resourceList[0];
    expect(sr.displayArtists[0].artist.name).toBe('Saeko Shu');
    expect(sr.displayArtists[0].artist.partyReference).toBe('PSaekoShu');
  });

  test('TrackRelease list', () => {
    expect(msg.trackReleaseList).toHaveLength(2);
    expect(msg.trackReleaseList![0].releaseResourceReference).toBe('A1');
  });
});
