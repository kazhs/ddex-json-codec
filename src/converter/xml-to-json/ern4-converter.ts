import type { XmlToJsonConverter } from './index.js';
import type { DdexMessage, ErnVersion, MessageHeader, MessageParty } from '../../types/ern.js';
import type { SoundRecording, SoundRecordingId } from '../../types/sound-recording.js';
import type { Release, ReleaseId, ResourceGroup, ResourceGroupContentItem, ReleaseResourceReference, TrackRelease } from '../../types/release.js';
import type { ReleaseDeal, Deal, DealTerms } from '../../types/deal.js';
import type { ArtistRole, DisplayArtist, Party, PartyName, Contributor } from '../../types/party.js';
import type { Image } from '../../types/image.js';
import type { DisplayTitle, Genre, PLine, CLine } from '../../types/common.js';
import { ensureArray } from '../utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export class Ern4Converter implements XmlToJsonConverter {
  private partyIndex = new Map<string, Party>();

  convert(parsed: Record<string, unknown>, version: ErnVersion): DdexMessage {
    const root = (parsed as Raw).NewReleaseMessage;
    if (!root) {
      throw new Error('NewReleaseMessage root element not found');
    }

    // Pass 1: PartyList → Map
    const partyList = this.buildPartyIndex(root.PartyList);

    // Pass 2: ResourceList, ReleaseList, DealList
    return {
      ernVersion: version,
      messageHeader: this.parseMessageHeader(root.MessageHeader),
      resourceList: this.parseSoundRecordings(root.ResourceList),
      imageList: this.parseImages(root.ResourceList),
      releaseList: this.parseReleases(root.ReleaseList),
      dealList: this.parseDealList(root.DealList),
      partyList,
      trackReleaseList: this.parseTrackReleases(root.ReleaseList),
    };
  }

  // --- PartyList (Pass 1) ---

  private buildPartyIndex(partyListRaw: Raw): Party[] {
    if (!partyListRaw) return [];
    const parties = ensureArray(partyListRaw.Party);
    const result: Party[] = [];
    for (const p of parties) {
      const party = this.parseParty(p);
      this.partyIndex.set(party.partyReference, party);
      result.push(party);
    }
    return result;
  }

  private parseParty(raw: Raw): Party {
    const partyNames = ensureArray(raw.PartyName).map((pn: Raw) => {
      const name: PartyName = {
        fullName: pn.FullName ?? '',
        fullNameIndexed: pn.FullNameIndexed ?? undefined,
        languageAndScriptCode: pn['@_LanguageAndScriptCode'] ?? undefined,
      };
      return name;
    });

    const partyIds: string[] = [];
    if (raw.PartyId) {
      const ids = ensureArray(raw.PartyId);
      for (const id of ids) {
        if (typeof id === 'string') {
          partyIds.push(id);
        } else if (id.ProprietaryId) {
          const propId = id.ProprietaryId;
          partyIds.push(typeof propId === 'string' ? propId : propId['#text'] ?? '');
        } else if (id['#text']) {
          partyIds.push(id['#text']);
        }
      }
    }

    return {
      partyReference: raw.PartyReference,
      partyName: partyNames.length > 0 ? partyNames : undefined,
      partyId: partyIds.length > 0 ? partyIds : undefined,
    };
  }

  private resolveParty(partyReference: string): { name: string; names?: PartyName[] } {
    const party = this.partyIndex.get(partyReference);
    if (!party?.partyName?.length) return { name: partyReference };
    return {
      name: party.partyName[0].fullName,
      names: party.partyName.length > 1 ? party.partyName : undefined,
    };
  }

  // --- MessageHeader ---

  private parseMessageHeader(raw: Raw): MessageHeader {
    return {
      messageThreadId: raw.MessageThreadId ?? undefined,
      messageId: raw.MessageId,
      messageFileName: raw.MessageFileName ?? undefined,
      messageSender: this.parseMessageParty(raw.MessageSender),
      messageRecipient: this.parseMessageParty(raw.MessageRecipient),
      messageCreatedDateTime: raw.MessageCreatedDateTime,
    };
  }

  private parseMessageParty(raw: Raw): MessageParty {
    if (!raw) return {};
    const partyId = raw.PartyId;
    let partyIdValue: string | undefined;
    if (partyId) {
      partyIdValue = typeof partyId === 'string' ? partyId : (partyId['#text'] || undefined);
    }
    const partyName = raw.PartyName;
    let fullName: string | undefined;
    if (partyName) {
      if (Array.isArray(partyName)) {
        fullName = partyName[0]?.FullName ?? undefined;
      } else {
        fullName = partyName.FullName ?? undefined;
      }
    }
    return {
      partyId: partyIdValue,
      fullName,
      tradingName: raw.TradingName ?? undefined,
    };
  }

  // --- SoundRecording ---

  private parseSoundRecordings(resourceList: Raw): SoundRecording[] {
    if (!resourceList) return [];
    return ensureArray(resourceList.SoundRecording).map((sr: Raw) => this.parseSoundRecording(sr));
  }

  private parseSoundRecording(raw: Raw): SoundRecording {
    // 4.3: SoundRecordingEdition wraps ResourceId, PLine
    const edition = raw.SoundRecordingEdition;
    let soundRecordingId: SoundRecordingId | undefined;
    let pLine: PLine | undefined;

    if (edition) {
      // 4.3: ResourceId and PLine inside Edition
      const editionData = Array.isArray(edition) ? edition[0] : edition;
      soundRecordingId = editionData.ResourceId ? this.parseSoundRecordingId(editionData.ResourceId) : undefined;
      pLine = editionData.PLine ? this.parsePLine(Array.isArray(editionData.PLine) ? editionData.PLine[0] : editionData.PLine) : undefined;
    } else {
      // 4.2: ResourceId and PLine directly
      soundRecordingId = raw.ResourceId ? this.parseSoundRecordingId(raw.ResourceId) : undefined;
      pLine = raw.PLine ? this.parsePLine(Array.isArray(raw.PLine) ? raw.PLine[0] : raw.PLine) : undefined;
    }

    return {
      resourceReference: raw.ResourceReference,
      type: raw.Type ?? undefined,
      soundRecordingId,
      displayTitleText: raw.DisplayTitleText ?? undefined,
      displayTitles: this.parseDisplayTitles(raw.DisplayTitle),
      displayArtists: this.parseDisplayArtists(raw.DisplayArtist) ?? [],
      contributors: this.parseContributors(raw.Contributor),
      pLine,
      duration: raw.Duration ?? undefined,
      creationDate: raw.CreationDate ? this.parseDateValue(raw.CreationDate) : undefined,
      languageOfPerformance: raw.LanguageOfPerformance ?? undefined,
    };
  }

  private parseSoundRecordingId(raw: Raw): SoundRecordingId {
    return {
      isrc: raw.ISRC ?? undefined,
      catalogNumber: raw.CatalogNumber ?? undefined,
    };
  }

  // --- Image ---

  private parseImages(resourceList: Raw): Image[] | undefined {
    if (!resourceList) return undefined;
    const images = ensureArray(resourceList.Image);
    if (images.length === 0) return undefined;
    return images.map((img: Raw) => {
      const result: Image = {
        resourceReference: img.ResourceReference,
        type: img.Type ?? undefined,
        parentalWarningType: img.ParentalWarningType ?? undefined,
      };
      // 4系: ResourceId は直下
      if (img.ResourceId) {
        const propId = img.ResourceId.ProprietaryId;
        if (propId) {
          result.imageId = {
            proprietaryId: typeof propId === 'string' ? propId : propId['#text'] ?? '',
            proprietaryIdNamespace: typeof propId === 'object' ? propId['@_Namespace'] ?? undefined : undefined,
          };
        }
      }
      // 4系: TechnicalDetails は直下
      if (img.TechnicalDetails) {
        const td = Array.isArray(img.TechnicalDetails) ? img.TechnicalDetails[0] : img.TechnicalDetails;
        result.technicalDetails = {
          technicalResourceDetailsReference: td.TechnicalResourceDetailsReference ?? undefined,
          imageCodecType: td.ImageCodecType ?? undefined,
          imageHeight: td.ImageHeight ? Number(td.ImageHeight) : undefined,
          imageWidth: td.ImageWidth ? Number(td.ImageWidth) : undefined,
          file: td.File ? {
            uri: td.File.URI ?? undefined,
            fileName: td.File.FileName ?? undefined,
            hashSum: td.File.HashSum ? {
              algorithm: td.File.HashSum.Algorithm ?? undefined,
              hashSumValue: td.File.HashSum.HashSumValue ?? undefined,
            } : undefined,
          } : undefined,
        };
      }
      return result;
    });
  }

  // --- Release ---

  private parseReleases(releaseList: Raw): Release[] {
    if (!releaseList) return [];
    return ensureArray(releaseList.Release).map((r: Raw) => this.parseRelease(r));
  }

  private parseRelease(raw: Raw): Release {
    return {
      releaseReference: raw.ReleaseReference,
      releaseType: this.parseReleaseType(raw.ReleaseType),
      releaseId: raw.ReleaseId ? this.parseReleaseId(raw.ReleaseId) : undefined,
      displayTitleText: raw.DisplayTitleText ?? undefined,
      displayTitles: this.parseDisplayTitles(raw.DisplayTitle),
      displayArtists: this.parseDisplayArtists(raw.DisplayArtist) ?? [],
      releaseLabelReferences: this.parseReleaseLabelReferences(raw.ReleaseLabelReference),
      resourceGroup: raw.ResourceGroup ? this.parseResourceGroup(Array.isArray(raw.ResourceGroup) ? raw.ResourceGroup[0] : raw.ResourceGroup) : undefined,
      duration: raw.Duration ?? undefined,
      pLine: raw.PLine ? this.parsePLine(Array.isArray(raw.PLine) ? raw.PLine[0] : raw.PLine) : undefined,
      cLine: raw.CLine ? this.parseCLine(Array.isArray(raw.CLine) ? raw.CLine[0] : raw.CLine) : undefined,
      genre: raw.Genre ? this.parseGenre(Array.isArray(raw.Genre) ? raw.Genre[0] : raw.Genre) : undefined,
      parentalWarningType: raw.ParentalWarningType ?? undefined,
    };
  }

  private parseReleaseType(raw: Raw): string | undefined {
    if (!raw) return undefined;
    // ReleaseType can be array (including UserDefined entries)
    const types = ensureArray(raw);
    // Return first non-UserDefined type, or the first one
    for (const t of types) {
      const val = typeof t === 'string' ? t : t['#text'];
      if (val && val !== 'UserDefined') return val;
    }
    return typeof types[0] === 'string' ? types[0] : types[0]?.['#text'];
  }

  private parseReleaseId(raw: Raw): ReleaseId {
    const icpnRaw = raw.ICPN;
    if (icpnRaw) {
      const icpnValue = typeof icpnRaw === 'string' ? icpnRaw : icpnRaw['#text'];
      return { icpn: icpnValue };
    }
    const propId = raw.ProprietaryId;
    let proprietaryId: string | undefined;
    if (propId) {
      proprietaryId = typeof propId === 'string' ? propId : propId['#text'];
    }
    return {
      isrc: raw.ISRC ?? undefined,
      gridOrIcpn: raw.GRid ?? undefined,
      catalogNumber: raw.CatalogNumber ?? undefined,
      proprietaryId,
    };
  }

  private parseReleaseLabelReferences(raw: Raw): string[] | undefined {
    if (!raw) return undefined;
    const refs = ensureArray(raw);
    return refs.map((r: Raw) => typeof r === 'string' ? r : r['#text'] ?? '');
  }

  // --- TrackRelease ---

  private parseTrackReleases(releaseList: Raw): TrackRelease[] | undefined {
    if (!releaseList) return undefined;
    const tracks = ensureArray(releaseList.TrackRelease);
    if (tracks.length === 0) return undefined;
    return tracks.map((tr: Raw) => this.parseTrackRelease(tr));
  }

  private parseTrackRelease(raw: Raw): TrackRelease {
    const ref = raw.ReleaseResourceReference;
    const releaseResourceReference = typeof ref === 'string' ? ref : (Array.isArray(ref) ? ref[0] : ref?.['#text'] ?? '');
    return {
      releaseReference: raw.ReleaseReference,
      releaseId: raw.ReleaseId ? this.parseReleaseId(raw.ReleaseId) : undefined,
      displayTitles: this.parseDisplayTitles(raw.DisplayTitle),
      displayArtists: this.parseDisplayArtists(raw.DisplayArtist) ?? undefined,
      releaseResourceReference,
      releaseLabelReferences: this.parseReleaseLabelReferences(raw.ReleaseLabelReference),
      genre: raw.Genre ? this.parseGenre(Array.isArray(raw.Genre) ? raw.Genre[0] : raw.Genre) : undefined,
    };
  }

  // --- ResourceGroup ---

  private parseResourceGroup(raw: Raw): ResourceGroup {
    const nestedGroups = raw.ResourceGroup
      ? ensureArray(raw.ResourceGroup).map((g: Raw) => this.parseResourceGroup(g))
      : undefined;

    const contentItems = raw.ResourceGroupContentItem
      ? ensureArray(raw.ResourceGroupContentItem).map((item: Raw) => this.parseResourceGroupContentItem(item))
      : undefined;

    // Title from AdditionalTitle in 4系
    let title: string | undefined;
    if (raw.AdditionalTitle) {
      const at = Array.isArray(raw.AdditionalTitle) ? raw.AdditionalTitle[0] : raw.AdditionalTitle;
      title = at?.TitleText ?? undefined;
    }

    return {
      sequenceNumber: raw.SequenceNumber ? Number(raw.SequenceNumber) : undefined,
      title,
      resourceGroups: nestedGroups,
      resourceGroupContentItems: contentItems,
    };
  }

  private parseResourceGroupContentItem(raw: Raw): ResourceGroupContentItem {
    const ref = raw.ReleaseResourceReference;
    let releaseResourceRef: ReleaseResourceReference;
    if (typeof ref === 'string') {
      releaseResourceRef = { value: ref };
    } else if (Array.isArray(ref)) {
      const first = ref[0];
      releaseResourceRef = typeof first === 'string'
        ? { value: first }
        : { value: first['#text'], releaseResourceType: first['@_ReleaseResourceType'] ?? undefined };
    } else {
      releaseResourceRef = {
        value: ref?.['#text'] ?? '',
        releaseResourceType: ref?.['@_ReleaseResourceType'] ?? undefined,
      };
    }

    return {
      sequenceNumber: raw.SequenceNumber ? Number(raw.SequenceNumber) : undefined,
      resourceType: raw.ResourceType ?? undefined,
      releaseResourceReference: releaseResourceRef,
    };
  }

  // --- DealList ---

  private parseDealList(dealList: Raw): ReleaseDeal[] {
    if (!dealList) return [];
    return ensureArray(dealList.ReleaseDeal).map((rd: Raw) => this.parseReleaseDeal(rd));
  }

  private parseReleaseDeal(raw: Raw): ReleaseDeal {
    return {
      dealReleaseReferences: ensureArray(raw.DealReleaseReference),
      deals: ensureArray(raw.Deal).map((d: Raw) => this.parseDeal(d)),
      effectiveDate: raw.EffectiveDate ?? undefined,
    };
  }

  private parseDeal(raw: Raw): Deal {
    return {
      dealReference: raw.DealReference ?? undefined,
      dealTerms: this.parseDealTerms(raw.DealTerms),
    };
  }

  private parseDealTerms(raw: Raw): DealTerms {
    // 4系: UseType is directly under DealTerms (no Usage wrapper)
    const useTypes = raw.UseType ? ensureArray(raw.UseType) : undefined;
    // 4系: CommercialModelType can be multiple
    const cmtRaw = raw.CommercialModelType;
    let commercialModelType: string | undefined;
    if (cmtRaw) {
      if (Array.isArray(cmtRaw)) {
        commercialModelType = cmtRaw[0];
      } else {
        commercialModelType = cmtRaw;
      }
    }

    return {
      commercialModelType,
      useTypes,
      territoryCode: raw.TerritoryCode ? ensureArray(raw.TerritoryCode) : undefined,
      validityPeriod: raw.ValidityPeriod ? {
        startDate: raw.ValidityPeriod.StartDate ?? undefined,
        endDate: raw.ValidityPeriod.EndDate ?? undefined,
      } : undefined,
    };
  }

  // --- Shared parsers ---

  private parseDisplayArtists(raw: Raw): DisplayArtist[] | undefined {
    if (!raw) return undefined;
    const artists = ensureArray(raw);
    if (artists.length === 0) return undefined;
    return artists.map((a: Raw) => {
      const partyRef = a.ArtistPartyReference;
      const resolved = partyRef ? this.resolveParty(partyRef) : { name: a.PartyName?.FullName ?? '', names: undefined };
      return {
        artist: {
          name: resolved.name,
          names: resolved.names,
          partyReference: partyRef ?? undefined,
          roles: a.DisplayArtistRole ? this.parseArtistRoles(a.DisplayArtistRole) : undefined,
        },
        sequenceNumber: a['@_SequenceNumber'] ? Number(a['@_SequenceNumber']) : undefined,
      };
    });
  }

  private parseArtistRoles(raw: Raw): ArtistRole[] {
    return ensureArray(raw).map((r: Raw) => {
      if (typeof r === 'string') {
        return { role: r };
      }
      return {
        role: r['#text'] ?? '',
        namespace: r['@_Namespace'] ?? undefined,
        userDefinedValue: r['@_UserDefinedValue'] ?? undefined,
      };
    });
  }

  private parseContributors(raw: Raw): Contributor[] | undefined {
    if (!raw) return undefined;
    const contributors = ensureArray(raw);
    if (contributors.length === 0) return undefined;
    return contributors.map((c: Raw) => {
      const partyRef = c.ContributorPartyReference;
      const name = partyRef ? this.resolveParty(partyRef).name : undefined;
      return {
        contributorPartyReference: partyRef ?? '',
        name,
        role: typeof c.Role === 'string' ? c.Role : (c.Role?.['#text'] ?? ''),
        sequenceNumber: c['@_SequenceNumber'] ? Number(c['@_SequenceNumber']) : undefined,
      };
    });
  }

  private parseDisplayTitles(raw: Raw): DisplayTitle[] | undefined {
    if (!raw) return undefined;
    const titles = ensureArray(raw);
    if (titles.length === 0) return undefined;
    return titles.map((t: Raw) => ({
      titleText: t.TitleText ?? '',
      subTitle: (t.SubTitle && t.SubTitle !== '') ? t.SubTitle : undefined,
      applicableTerritoryCode: t['@_ApplicableTerritoryCode'] ?? undefined,
      languageAndScriptCode: t['@_LanguageAndScriptCode'] ?? undefined,
      isDefault: t['@_IsDefault'] === 'true' ? true : undefined,
    }));
  }

  private parsePLine(raw: Raw): PLine {
    return {
      year: raw.Year ?? undefined,
      pLineText: raw.PLineText ?? '',
    };
  }

  private parseCLine(raw: Raw): CLine {
    return {
      year: raw.Year ?? undefined,
      cLineText: raw.CLineText ?? '',
    };
  }

  private parseGenre(raw: Raw): Genre {
    return {
      genreText: raw.GenreText ?? '',
      subGenre: raw.SubGenre ?? undefined,
    };
  }

  private parseDateValue(raw: Raw): string {
    if (typeof raw === 'string') return raw;
    return raw['#text'] ?? '';
  }
}
