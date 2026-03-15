import { XMLBuilder } from 'fast-xml-parser';
import type { JsonToXmlBuilder } from './index.js';
import type { DdexMessage, ErnVersion, MessageHeader, MessageParty } from '../../types/ern.js';
import type { SoundRecording } from '../../types/sound-recording.js';
import type { Release, ResourceGroup, ResourceGroupContentItem, ReleaseResourceReference, TrackRelease } from '../../types/release.js';
import type { ReleaseDeal, Deal, DealTerms } from '../../types/deal.js';
import type { ArtistRole, DisplayArtist, Party, Contributor } from '../../types/party.js';
import type { DisplayTitle, Genre, PLine, CLine } from '../../types/common.js';
import { VERSION_NAMESPACE_MAP } from '../../version/namespaces.js';
import { BUILDER_OPTIONS } from '../utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export class Ern4Builder implements JsonToXmlBuilder {
  build(message: DdexMessage, version: ErnVersion): string {
    const nsUri = VERSION_NAMESPACE_MAP.get(version);
    if (!nsUri) throw new Error(`Unknown version: ${version}`);

    const root: Raw = {
      'ern:NewReleaseMessage': {
        '@_xmlns:ern': nsUri,
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_xsi:schemaLocation': `${nsUri} ${nsUri}/release-notification.xsd`,
        '@_LanguageAndScriptCode': 'en',
        MessageHeader: this.buildMessageHeader(message.messageHeader),
        PartyList: this.buildPartyList(message.partyList ?? []),
        ResourceList: this.buildResourceList(message.resourceList, version),
        ReleaseList: this.buildReleaseList(message.releaseList, message.trackReleaseList),
        DealList: this.buildDealList(message.dealList),
      },
    };

    const builder = new XMLBuilder(BUILDER_OPTIONS);
    const xml = builder.build(root) as string;
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`.trimEnd();
  }

  // --- MessageHeader ---

  private buildMessageHeader(header: MessageHeader): Raw {
    return {
      ...(header.messageThreadId ? { MessageThreadId: header.messageThreadId } : {}),
      MessageId: header.messageId,
      ...(header.messageFileName ? { MessageFileName: header.messageFileName } : {}),
      MessageSender: this.buildMessageParty(header.messageSender),
      MessageRecipient: this.buildMessageParty(header.messageRecipient),
      MessageCreatedDateTime: header.messageCreatedDateTime,
    };
  }

  private buildMessageParty(party: MessageParty): Raw {
    const result: Raw = {};
    if (party.partyId !== undefined) {
      result.PartyId = party.partyId || '';
    }
    if (party.fullName) {
      result.PartyName = { FullName: party.fullName };
    }
    return result;
  }

  // --- PartyList ---

  private buildPartyList(parties: Party[]): Raw {
    if (parties.length === 0) return {};
    return {
      Party: parties.map(p => this.buildParty(p)),
    };
  }

  private buildParty(party: Party): Raw {
    const result: Raw = {};
    result.PartyReference = party.partyReference;
    if (party.partyName?.length) {
      result.PartyName = party.partyName.map(pn => {
        const r: Raw = {};
        if (pn.languageAndScriptCode) r['@_LanguageAndScriptCode'] = pn.languageAndScriptCode;
        r.FullName = pn.fullName;
        if (pn.fullNameIndexed) r.FullNameIndexed = pn.fullNameIndexed;
        return r;
      });
    }
    if (party.partyId?.length) {
      result.PartyId = party.partyId.map(id => id);
    }
    return result;
  }

  // --- ResourceList ---

  private buildResourceList(soundRecordings: SoundRecording[], _version: ErnVersion): Raw {
    return {
      SoundRecording: soundRecordings.map(sr => this.buildSoundRecording(sr)),
    };
  }

  private buildSoundRecording(sr: SoundRecording): Raw {
    const result: Raw = {};
    result.ResourceReference = sr.resourceReference;
    if (sr.type) result.Type = sr.type;
    if (sr.soundRecordingId) {
      result.ResourceId = this.buildSoundRecordingId(sr.soundRecordingId);
    }
    if (sr.displayTitleText) result.DisplayTitleText = sr.displayTitleText;
    if (sr.displayTitles) result.DisplayTitle = sr.displayTitles.map(t => this.buildDisplayTitle(t));
    if (sr.displayArtists.length > 0) {
      result.DisplayArtist = sr.displayArtists.map(a => this.buildDisplayArtist(a));
    }
    if (sr.contributors) result.Contributor = sr.contributors.map(c => this.buildContributor(c));
    if (sr.pLine) result.PLine = this.buildPLine(sr.pLine);
    if (sr.duration) result.Duration = sr.duration;
    if (sr.languageOfPerformance) result.LanguageOfPerformance = sr.languageOfPerformance;
    return result;
  }

  private buildSoundRecordingId(id: SoundRecording['soundRecordingId']): Raw {
    if (!id) return {};
    const result: Raw = {};
    if (id.isrc) result.ISRC = id.isrc;
    if (id.catalogNumber) result.CatalogNumber = id.catalogNumber;
    return result;
  }

  // --- ReleaseList ---

  private buildReleaseList(releases: Release[], trackReleases?: TrackRelease[]): Raw {
    const result: Raw = {};
    result.Release = releases.map(r => this.buildRelease(r));
    if (trackReleases?.length) {
      result.TrackRelease = trackReleases.map(tr => this.buildTrackRelease(tr));
    }
    return result;
  }

  private buildRelease(r: Release): Raw {
    const result: Raw = {};
    result.ReleaseReference = r.releaseReference;
    if (r.releaseType) result.ReleaseType = r.releaseType;
    if (r.releaseId) result.ReleaseId = this.buildReleaseId(r.releaseId);
    if (r.displayTitleText) result.DisplayTitleText = r.displayTitleText;
    if (r.displayTitles) result.DisplayTitle = r.displayTitles.map(t => this.buildDisplayTitle(t));
    if (r.displayArtists.length > 0) {
      result.DisplayArtist = r.displayArtists.map(a => this.buildDisplayArtist(a));
    }
    if (r.releaseLabelReferences) {
      result.ReleaseLabelReference = r.releaseLabelReferences;
    }
    if (r.pLine) result.PLine = this.buildPLine(r.pLine);
    if (r.cLine) result.CLine = this.buildCLine(r.cLine);
    if (r.duration) result.Duration = r.duration;
    if (r.genre) result.Genre = this.buildGenre(r.genre);
    if (r.parentalWarningType) result.ParentalWarningType = r.parentalWarningType;
    if (r.resourceGroup) result.ResourceGroup = this.buildResourceGroup(r.resourceGroup);
    return result;
  }

  private buildReleaseId(id: Release['releaseId']): Raw {
    if (!id) return {};
    const result: Raw = {};
    if (id.icpn) result.ICPN = id.icpn;
    if (id.isrc) result.ISRC = id.isrc;
    if (id.gridOrIcpn) result.GRid = id.gridOrIcpn;
    if (id.proprietaryId) result.ProprietaryId = id.proprietaryId;
    if (id.catalogNumber) result.CatalogNumber = id.catalogNumber;
    return result;
  }

  private buildTrackRelease(tr: TrackRelease): Raw {
    const result: Raw = {};
    result.ReleaseReference = tr.releaseReference;
    if (tr.releaseId) result.ReleaseId = this.buildReleaseId(tr.releaseId);
    if (tr.displayTitles) result.DisplayTitle = tr.displayTitles.map(t => this.buildDisplayTitle(t));
    result.ReleaseResourceReference = tr.releaseResourceReference;
    if (tr.releaseLabelReferences) {
      result.ReleaseLabelReference = tr.releaseLabelReferences;
    }
    if (tr.genre) result.Genre = this.buildGenre(tr.genre);
    return result;
  }

  // --- ResourceGroup ---

  private buildResourceGroup(rg: ResourceGroup): Raw {
    const result: Raw = {};
    if (rg.title) {
      result.AdditionalTitle = { TitleText: rg.title };
    }
    if (rg.sequenceNumber != null) result.SequenceNumber = String(rg.sequenceNumber);
    if (rg.resourceGroups) {
      result.ResourceGroup = rg.resourceGroups.map(g => this.buildResourceGroup(g));
    }
    if (rg.resourceGroupContentItems) {
      result.ResourceGroupContentItem = rg.resourceGroupContentItems.map(item => this.buildResourceGroupContentItem(item));
    }
    return result;
  }

  private buildResourceGroupContentItem(item: ResourceGroupContentItem): Raw {
    const result: Raw = {};
    if (item.sequenceNumber != null) result.SequenceNumber = String(item.sequenceNumber);
    if (item.resourceType) result.ResourceType = item.resourceType;
    result.ReleaseResourceReference = this.buildReleaseResourceReference(item.releaseResourceReference);
    return result;
  }

  private buildReleaseResourceReference(ref: ReleaseResourceReference): Raw {
    if (ref.releaseResourceType) {
      return {
        '#text': ref.value,
        '@_ReleaseResourceType': ref.releaseResourceType,
      };
    }
    return ref.value;
  }

  // --- DealList ---

  private buildDealList(deals: ReleaseDeal[]): Raw {
    return {
      ReleaseDeal: deals.map(rd => this.buildReleaseDeal(rd)),
    };
  }

  private buildReleaseDeal(rd: ReleaseDeal): Raw {
    const result: Raw = {};
    result.DealReleaseReference = rd.dealReleaseReferences;
    result.Deal = rd.deals.map(d => this.buildDeal(d));
    if (rd.effectiveDate) result.EffectiveDate = rd.effectiveDate;
    return result;
  }

  private buildDeal(deal: Deal): Raw {
    const result: Raw = {};
    if (deal.dealReference) result.DealReference = deal.dealReference;
    result.DealTerms = this.buildDealTerms(deal.dealTerms);
    return result;
  }

  private buildDealTerms(dt: DealTerms): Raw {
    const result: Raw = {};
    if (dt.territoryCode) result.TerritoryCode = dt.territoryCode;
    if (dt.validityPeriod) {
      const vp: Raw = {};
      if (dt.validityPeriod.startDate) vp.StartDate = dt.validityPeriod.startDate;
      if (dt.validityPeriod.endDate) vp.EndDate = dt.validityPeriod.endDate;
      result.ValidityPeriod = vp;
    }
    if (dt.commercialModelType) result.CommercialModelType = dt.commercialModelType;
    if (dt.useTypes) result.UseType = dt.useTypes;
    return result;
  }

  // --- Shared builders ---

  private buildDisplayArtist(da: DisplayArtist): Raw {
    const result: Raw = {};
    if (da.sequenceNumber != null) result['@_SequenceNumber'] = String(da.sequenceNumber);
    if (da.artist.partyReference) {
      result.ArtistPartyReference = da.artist.partyReference;
    }
    if (da.artist.roles?.length) {
      const builtRoles = da.artist.roles.map(r => this.buildArtistRole(r));
      result.DisplayArtistRole = builtRoles.length === 1 ? builtRoles[0] : builtRoles;
    }
    return result;
  }

  private buildArtistRole(r: ArtistRole): Raw {
    if (r.userDefinedValue) {
      return {
        '#text': r.role,
        ...(r.namespace ? { '@_Namespace': r.namespace } : {}),
        '@_UserDefinedValue': r.userDefinedValue,
      };
    }
    return r.role;
  }

  private buildContributor(c: Contributor): Raw {
    const result: Raw = {};
    if (c.sequenceNumber != null) result['@_SequenceNumber'] = String(c.sequenceNumber);
    result.ContributorPartyReference = c.contributorPartyReference;
    result.Role = c.role;
    return result;
  }

  private buildDisplayTitle(t: DisplayTitle): Raw {
    const result: Raw = {};
    if (t.applicableTerritoryCode) result['@_ApplicableTerritoryCode'] = t.applicableTerritoryCode;
    if (t.languageAndScriptCode) result['@_LanguageAndScriptCode'] = t.languageAndScriptCode;
    if (t.isDefault) result['@_IsDefault'] = 'true';
    result.TitleText = t.titleText;
    if (t.subTitle) result.SubTitle = t.subTitle;
    return result;
  }

  private buildPLine(p: PLine): Raw {
    const result: Raw = {};
    if (p.year) result.Year = p.year;
    result.PLineText = p.pLineText;
    return result;
  }

  private buildCLine(c: CLine): Raw {
    const result: Raw = {};
    if (c.year) result.Year = c.year;
    result.CLineText = c.cLineText;
    return result;
  }

  private buildGenre(g: Genre): Raw {
    const result: Raw = {};
    result.GenreText = g.genreText;
    if (g.subGenre) result.SubGenre = g.subGenre;
    return result;
  }
}
