import type { XmlToJsonConverter } from './index.js';
import type { DdexMessage, ErnVersion, MessageHeader, MessageParty } from '../../types/ern.js';
import type { SoundRecording, SoundRecordingDetailsByTerritory, ReferenceTitle as SoundRecordingReferenceTitle } from '../../types/sound-recording.js';
import type { Release, ReleaseDetailsByTerritory, ResourceGroup, ResourceGroupContentItem, ReleaseResourceReference, ReferenceTitle as ReleaseReferenceTitle } from '../../types/release.js';
import type { ReleaseDeal, Deal, DealTerms } from '../../types/deal.js';
import type { ArtistRole, DisplayArtist, ResourceContributor, IndirectResourceContributor } from '../../types/party.js';
import type { Genre, PLine, CLine, Title } from '../../types/common.js';
import { ensureArray } from '../utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export class Ern38Converter implements XmlToJsonConverter {
  convert(parsed: Record<string, unknown>, version: ErnVersion): DdexMessage {
    const root = (parsed as Raw).NewReleaseMessage;
    if (!root) {
      throw new Error('NewReleaseMessage root element not found');
    }

    return {
      ernVersion: version,
      messageHeader: this.parseMessageHeader(root.MessageHeader),
      updateIndicator: root.UpdateIndicator ?? undefined,
      resourceList: this.parseSoundRecordings(root.ResourceList),
      releaseList: this.parseReleases(root.ReleaseList),
      dealList: this.parseDealList(root.DealList),
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
    let isDpid: boolean | undefined;
    if (partyId) {
      partyIdValue = typeof partyId === 'string' ? partyId : (partyId['#text'] || undefined);
      isDpid = partyId['@_IsDPID'] === 'true' ? true : undefined;
    }
    const partyName = raw.PartyName;
    const fullName = partyName?.FullName ?? undefined;
    return {
      partyId: partyIdValue,
      partyIdIsDpid: isDpid,
      fullName,
      tradingName: raw.TradingName ?? undefined,
    };
  }

  // --- SoundRecording ---

  private parseSoundRecordings(resourceList: Raw): SoundRecording[] {
    if (!resourceList) return [];
    const recordings = ensureArray(resourceList.SoundRecording);
    return recordings.map((sr: Raw) => this.parseSoundRecording(sr));
  }

  private parseSoundRecording(raw: Raw): SoundRecording {
    const detailsByTerritory = ensureArray(raw.SoundRecordingDetailsByTerritory)
      .map((d: Raw) => this.parseSoundRecordingDetailsByTerritory(d));

    // displayArtistsは最初のterritoryから引き上げ
    const firstTerritory = detailsByTerritory[0];
    const displayArtists = firstTerritory?.displayArtists ?? [];

    return {
      resourceReference: raw.ResourceReference,
      type: raw.SoundRecordingType ?? undefined,
      soundRecordingId: raw.SoundRecordingId ? {
        isrc: raw.SoundRecordingId.ISRC ?? undefined,
        catalogNumber: raw.SoundRecordingId.CatalogNumber ?? undefined,
      } : undefined,
      referenceTitle: this.parseReferenceTitle(raw.ReferenceTitle),
      displayArtists,
      duration: raw.Duration ?? undefined,
      languageOfPerformance: raw.LanguageOfPerformance ?? undefined,
      detailsByTerritory,
    };
  }

  private parseReferenceTitle(raw: Raw): SoundRecordingReferenceTitle | ReleaseReferenceTitle {
    if (!raw) return { titleText: '' };
    return {
      titleText: raw.TitleText ?? '',
      subTitle: (raw.SubTitle && raw.SubTitle !== '') ? raw.SubTitle : undefined,
    };
  }

  private parseSoundRecordingDetailsByTerritory(raw: Raw): SoundRecordingDetailsByTerritory {
    return {
      territoryCode: ensureArray(raw.TerritoryCode),
      displayArtists: this.parseDisplayArtists(raw.DisplayArtist),
      displayArtistName: Array.isArray(raw.DisplayArtistName) ? raw.DisplayArtistName[0] : (raw.DisplayArtistName ?? undefined),
      titles: this.parseTitles(raw.Title),
      labelName: raw.LabelName ?? undefined,
      pLine: raw.PLine ? this.parsePLine(ensureArray(raw.PLine)[0]) : undefined,
      genre: raw.Genre ? this.parseGenre(ensureArray(raw.Genre)[0]) : undefined,
      parentalWarningType: raw.ParentalWarningType ?? undefined,
      sequenceNumber: raw.SequenceNumber ? Number(raw.SequenceNumber) : undefined,
      resourceContributors: this.parseResourceContributors(raw.ResourceContributor),
      indirectResourceContributors: this.parseIndirectResourceContributors(raw.IndirectResourceContributor),
    };
  }

  // --- Release ---

  private parseReleases(releaseList: Raw): Release[] {
    if (!releaseList) return [];
    return ensureArray(releaseList.Release).map((r: Raw) => this.parseRelease(r));
  }

  private parseRelease(raw: Raw): Release {
    const detailsByTerritory = ensureArray(raw.ReleaseDetailsByTerritory)
      .map((d: Raw) => this.parseReleaseDetailsByTerritory(d));

    // displayArtistsは最初のterritoryから引き上げ
    const firstTerritory = detailsByTerritory[0];
    const displayArtists = firstTerritory?.displayArtists ?? [];

    return {
      releaseReference: raw.ReleaseReference,
      releaseType: raw.ReleaseType ?? undefined,
      releaseId: raw.ReleaseId ? this.parseReleaseId(raw.ReleaseId) : undefined,
      referenceTitle: this.parseReferenceTitle(raw.ReferenceTitle),
      displayArtists,
      releaseResourceReferences: this.parseReleaseResourceReferences(raw.ReleaseResourceReferenceList),
      resourceGroup: firstTerritory?.resourceGroup ?? undefined,
      duration: raw.Duration ?? undefined,
      pLine: raw.PLine ? this.parsePLine(ensureArray(raw.PLine)[0]) : undefined,
      cLine: raw.CLine ? this.parseCLine(ensureArray(raw.CLine)[0]) : undefined,
      detailsByTerritory,
    };
  }

  private parseReleaseId(raw: Raw): Release['releaseId'] {
    const icpnRaw = raw.ICPN;
    if (icpnRaw) {
      const icpnValue = typeof icpnRaw === 'string' ? icpnRaw : icpnRaw['#text'];
      const isEan = typeof icpnRaw === 'object' && icpnRaw['@_IsEan'] === 'true' ? true : undefined;
      return { icpn: icpnValue, isEan };
    }
    return {
      isrc: raw.ISRC ?? undefined,
      gridOrIcpn: raw.GRid ?? undefined,
      catalogNumber: raw.CatalogNumber ?? undefined,
    };
  }

  private parseReleaseResourceReferences(raw: Raw): ReleaseResourceReference[] | undefined {
    if (!raw) return undefined;
    return ensureArray(raw.ReleaseResourceReference).map((ref: Raw) => {
      if (typeof ref === 'string') {
        return { value: ref };
      }
      return {
        value: ref['#text'],
        releaseResourceType: ref['@_ReleaseResourceType'] ?? undefined,
      };
    });
  }

  private parseReleaseDetailsByTerritory(raw: Raw): ReleaseDetailsByTerritory {
    return {
      territoryCode: ensureArray(raw.TerritoryCode),
      displayArtists: this.parseDisplayArtists(raw.DisplayArtist),
      displayArtistName: Array.isArray(raw.DisplayArtistName) ? raw.DisplayArtistName[0] : (raw.DisplayArtistName ?? undefined),
      titles: this.parseTitles(raw.Title),
      labelName: raw.LabelName ?? undefined,
      genre: raw.Genre ? this.parseGenre(ensureArray(raw.Genre)[0]) : undefined,
      parentalWarningType: raw.ParentalWarningType ?? undefined,
      originalReleaseDate: raw.OriginalReleaseDate ?? undefined,
      resourceGroup: raw.ResourceGroup ? this.parseResourceGroupWrapper(raw.ResourceGroup) : undefined,
    };
  }

  // --- ResourceGroup (recursive, nested inside ReleaseDetailsByTerritory) ---

  private parseResourceGroupWrapper(raw: Raw): ResourceGroup {
    // ReleaseDetailsByTerritory内のResourceGroupは配列ではなく単一オブジェクト
    // ただしその中にネストされたResourceGroupがある
    const outerRaw = Array.isArray(raw) ? raw[0] : raw;
    return this.parseResourceGroup(outerRaw);
  }

  private parseResourceGroup(raw: Raw): ResourceGroup {
    const nestedGroups = raw.ResourceGroup
      ? ensureArray(raw.ResourceGroup).map((g: Raw) => this.parseResourceGroup(g))
      : undefined;

    const contentItems = raw.ResourceGroupContentItem
      ? ensureArray(raw.ResourceGroupContentItem).map((item: Raw) => this.parseResourceGroupContentItem(item))
      : undefined;

    return {
      sequenceNumber: raw.SequenceNumber ? Number(raw.SequenceNumber) : undefined,
      title: raw.Title ? this.extractTitleText(raw.Title) : undefined,
      resourceGroups: nestedGroups,
      resourceGroupContentItems: contentItems,
    };
  }

  private extractTitleText(raw: Raw): string | undefined {
    // Title inside ResourceGroup can be { TitleText: "..." } or an array
    if (Array.isArray(raw)) {
      const first = raw[0];
      return first?.TitleText ?? undefined;
    }
    return raw?.TitleText ?? undefined;
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
        value: ref['#text'],
        releaseResourceType: ref['@_ReleaseResourceType'] ?? undefined,
      };
    }

    return {
      sequenceNumber: raw.SequenceNumber ? Number(raw.SequenceNumber) : undefined,
      resourceType: raw.ResourceType,
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
    const usage = raw.Usage;
    return {
      commercialModelType: raw.CommercialModelType ?? undefined,
      usage: usage ? { useTypes: ensureArray(usage.UseType) } : undefined,
      territoryCode: raw.TerritoryCode ? ensureArray(raw.TerritoryCode) : undefined,
      validityPeriod: raw.ValidityPeriod ? {
        startDate: raw.ValidityPeriod.StartDate ?? undefined,
        endDate: raw.ValidityPeriod.EndDate ?? undefined,
      } : undefined,
      takeDown: raw.TakeDown === 'true' ? true : undefined,
    };
  }

  // --- Shared parsers ---

  private parseDisplayArtists(raw: Raw): DisplayArtist[] | undefined {
    if (!raw) return undefined;
    const artists = ensureArray(raw);
    if (artists.length === 0) return undefined;
    return artists.map((a: Raw) => ({
      artist: {
        name: a.PartyName?.FullName ?? '',
        roles: a.ArtistRole ? this.parseArtistRoles(a.ArtistRole) : undefined,
      },
      sequenceNumber: a['@_SequenceNumber'] ? Number(a['@_SequenceNumber']) : undefined,
    }));
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

  private parseResourceContributors(raw: Raw): ResourceContributor[] | undefined {
    if (!raw) return undefined;
    const contributors = ensureArray(raw);
    if (contributors.length === 0) return undefined;
    return contributors.map((c: Raw) => {
      const roleRaw = c.ResourceContributorRole;
      let role: string;
      let roleNamespace: string | undefined;
      let roleUserDefinedValue: string | undefined;
      if (!roleRaw) {
        role = c.InstrumentType ?? '';
      } else if (typeof roleRaw === 'string') {
        role = roleRaw;
      } else {
        role = roleRaw['#text'] ?? '';
        roleNamespace = roleRaw['@_Namespace'] ?? undefined;
        roleUserDefinedValue = roleRaw['@_UserDefinedValue'] ?? undefined;
      }
      return {
        name: c.PartyName?.FullName ?? '',
        role,
        sequenceNumber: c['@_SequenceNumber'] ? Number(c['@_SequenceNumber']) : undefined,
        roleNamespace,
        roleUserDefinedValue,
      };
    });
  }

  private parseIndirectResourceContributors(raw: Raw): IndirectResourceContributor[] | undefined {
    if (!raw) return undefined;
    const contributors = ensureArray(raw);
    if (contributors.length === 0) return undefined;
    return contributors.map((c: Raw) => ({
      name: c.PartyName?.FullName ?? '',
      role: c.IndirectResourceContributorRole ?? '',
      sequenceNumber: c['@_SequenceNumber'] ? Number(c['@_SequenceNumber']) : undefined,
    }));
  }

  private parseTitles(raw: Raw): Title[] | undefined {
    if (!raw) return undefined;
    const titles = ensureArray(raw);
    if (titles.length === 0) return undefined;
    return titles.map((t: Raw) => ({
      titleText: t.TitleText ?? '',
      subTitle: (t.SubTitle && t.SubTitle !== '') ? t.SubTitle : undefined,
      titleType: t['@_TitleType'] ?? undefined,
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
}
