import { XMLBuilder } from 'fast-xml-parser';
import type { JsonToXmlBuilder } from './index.js';
import type { DdexMessage, DdexMessage38, ErnVersion, MessageHeader, MessageParty } from '../../types/ern.js';
import type { SoundRecording38, SoundRecordingDetailsByTerritory, TechnicalSoundRecordingDetails } from '../../types/sound-recording.js';
import type { Release38, ReleaseDetailsByTerritory, ReleaseId, ResourceGroup, ResourceGroupContentItem, ReleaseResourceReference } from '../../types/release.js';
import type { ReleaseDeal, Deal, DealTerms } from '../../types/deal.js';
import type { ArtistRole, DisplayArtist, ResourceContributor, IndirectResourceContributor } from '../../types/party.js';
import type { Image38 } from '../../types/image.js';
import type { Genre, PLine, CLine, Title } from '../../types/common.js';
import { VERSION_NAMESPACE_MAP } from '../../version/namespaces.js';
import { BUILDER_OPTIONS } from '../utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export class Ern38Builder implements JsonToXmlBuilder {
  build(message: DdexMessage, version: ErnVersion): string {
    const msg = message as DdexMessage38;
    const nsUri = VERSION_NAMESPACE_MAP.get(version);
    if (!nsUri) throw new Error(`Unknown version: ${version}`);

    // Derive the version key from namespace: e.g. "http://ddex.net/xml/ern/382" -> "ern/382"
    const nsPath = new URL(nsUri).pathname.replace(/^\/xml\//, '');

    const root: Raw = {
      'ern:NewReleaseMessage': {
        '@_xmlns:ern': nsUri,
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_MessageSchemaVersionId': nsPath,
        '@_xsi:schemaLocation': `${nsUri} ${nsUri}/release-notification.xsd`,
        MessageHeader: this.buildMessageHeader(msg.messageHeader),
        ...(msg.updateIndicator ? { UpdateIndicator: msg.updateIndicator } : {}),
        ResourceList: this.buildResourceList(msg.resourceList, msg.imageList),
        ReleaseList: this.buildReleaseList(msg.releaseList),
        DealList: this.buildDealList(msg.dealList),
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
      result.PartyId = {
        '#text': party.partyId || '',
        ...(party.partyIdIsDpid ? { '@_IsDPID': 'true' } : {}),
      };
    }
    if (party.fullName) {
      result.PartyName = { FullName: party.fullName };
    }
    if (party.tradingName) {
      result.TradingName = party.tradingName;
    }
    return result;
  }

  // --- ResourceList ---

  private buildResourceList(soundRecordings: SoundRecording38[], images?: Image38[]): Raw {
    const result: Raw = {
      SoundRecording: soundRecordings.map(sr => this.buildSoundRecording(sr)),
    };
    if (images?.length) {
      result.Image = images.map(img => this.buildImage(img));
    }
    return result;
  }

  private buildSoundRecording(sr: SoundRecording38): Raw {
    const result: Raw = {};
    if (sr.type) result.SoundRecordingType = sr.type;
    if (sr.soundRecordingId) {
      const id: Raw = {};
      if (sr.soundRecordingId.isrc) id.ISRC = sr.soundRecordingId.isrc;
      if (sr.soundRecordingId.catalogNumber) id.CatalogNumber = sr.soundRecordingId.catalogNumber;
      result.SoundRecordingId = id;
    }
    result.ResourceReference = sr.resourceReference;
    if (sr.referenceTitle) result.ReferenceTitle = this.buildReferenceTitle(sr.referenceTitle);
    if (sr.languageOfPerformance) result.LanguageOfPerformance = sr.languageOfPerformance;
    if (sr.duration) result.Duration = sr.duration;
    if (sr.detailsByTerritory) {
      result.SoundRecordingDetailsByTerritory = sr.detailsByTerritory.map(d => this.buildSoundRecordingDetailsByTerritory(d));
    }
    return result;
  }

  private buildReferenceTitle(rt: { titleText: string; subTitle?: string }): Raw {
    const result: Raw = { TitleText: rt.titleText };
    if (rt.subTitle) result.SubTitle = rt.subTitle;
    return result;
  }

  private buildSoundRecordingDetailsByTerritory(d: SoundRecordingDetailsByTerritory): Raw {
    const result: Raw = {};
    result.TerritoryCode = d.territoryCode;
    if (d.titles) result.Title = d.titles.map(t => this.buildTitle(t));
    if (d.displayArtists) result.DisplayArtist = d.displayArtists.map(a => this.buildDisplayArtist(a));
    if (d.displayArtistName) result.DisplayArtistName = d.displayArtistName;
    if (d.resourceContributors) result.ResourceContributor = d.resourceContributors.map(c => this.buildResourceContributor(c));
    if (d.indirectResourceContributors) result.IndirectResourceContributor = d.indirectResourceContributors.map(c => this.buildIndirectResourceContributor(c));
    if (d.labelName) result.LabelName = d.labelName;
    if (d.pLine) result.PLine = this.buildPLine(d.pLine);
    if (d.sequenceNumber != null) result.SequenceNumber = String(d.sequenceNumber);
    if (d.genre) result.Genre = this.buildGenre(d.genre);
    if (d.parentalWarningType) result.ParentalWarningType = d.parentalWarningType;
    if (d.technicalDetails) {
      result.TechnicalSoundRecordingDetails = d.technicalDetails.map(td => this.buildTechnicalSoundRecordingDetails(td));
    }
    return result;
  }

  private buildTechnicalSoundRecordingDetails(td: TechnicalSoundRecordingDetails): Raw {
    const result: Raw = {};
    if (td.technicalResourceDetailsReference) result.TechnicalResourceDetailsReference = td.technicalResourceDetailsReference;
    if (td.audioCodecType) result.AudioCodecType = td.audioCodecType;
    if (td.bitRate != null) {
      result.BitRate = td.bitRateUnit
        ? { '#text': String(td.bitRate), '@_UnitOfMeasure': td.bitRateUnit }
        : String(td.bitRate);
    }
    if (td.bitsPerSample != null) result.BitsPerSample = String(td.bitsPerSample);
    if (td.numberOfChannels != null) result.NumberOfChannels = String(td.numberOfChannels);
    if (td.samplingRate != null) {
      result.SamplingRate = td.samplingRateUnit
        ? { '#text': String(td.samplingRate), '@_UnitOfMeasure': td.samplingRateUnit }
        : String(td.samplingRate);
    }
    if (td.isPreview != null) result.IsPreview = String(td.isPreview);
    if (td.file) {
      const file: Raw = {};
      if (td.file.fileName) file.FileName = td.file.fileName;
      if (td.file.uri) file.URI = td.file.uri;
      if (td.file.hashSum) {
        file.HashSum = {};
        if (td.file.hashSum.algorithm) file.HashSum.HashSumAlgorithmType = td.file.hashSum.algorithm;
        if (td.file.hashSum.hashSumValue) file.HashSum.HashSum = td.file.hashSum.hashSumValue;
      }
      result.File = file;
    }
    return result;
  }

  private buildImage(img: Image38): Raw {
    const result: Raw = {};
    if (img.type) result.ImageType = img.type;
    if (img.imageId) {
      const id: Raw = {};
      if (img.imageId.proprietaryId) {
        id.ProprietaryId = img.imageId.proprietaryIdNamespace
          ? { '#text': img.imageId.proprietaryId, '@_Namespace': img.imageId.proprietaryIdNamespace }
          : img.imageId.proprietaryId;
      }
      result.ImageId = id;
    }
    result.ResourceReference = img.resourceReference;
    if (img.detailsByTerritory) {
      result.ImageDetailsByTerritory = img.detailsByTerritory.map(d => {
        const dbt: Raw = {};
        dbt.TerritoryCode = d.territoryCode;
        if (d.parentalWarningType) dbt.ParentalWarningType = d.parentalWarningType;
        if (d.technicalDetails) dbt.TechnicalImageDetails = this.buildTechnicalImageDetails(d.technicalDetails);
        return dbt;
      });
    }
    return result;
  }

  private buildTechnicalImageDetails(td: NonNullable<NonNullable<Image38['detailsByTerritory']>[number]['technicalDetails']>): Raw {
    const result: Raw = {};
    if (td.technicalResourceDetailsReference) result.TechnicalResourceDetailsReference = td.technicalResourceDetailsReference;
    if (td.imageCodecType) result.ImageCodecType = td.imageCodecType;
    if (td.imageHeight != null) result.ImageHeight = String(td.imageHeight);
    if (td.imageWidth != null) result.ImageWidth = String(td.imageWidth);
    if (td.file) {
      const file: Raw = {};
      if (td.file.fileName) file.FileName = td.file.fileName;
      if (td.file.uri) file.URI = td.file.uri;
      if (td.file.hashSum) {
        file.HashSum = {};
        if (td.file.hashSum.algorithm) file.HashSum.HashSumAlgorithmType = td.file.hashSum.algorithm;
        if (td.file.hashSum.hashSumValue) file.HashSum.HashSum = td.file.hashSum.hashSumValue;
      }
      result.File = file;
    }
    return result;
  }

  // --- ReleaseList ---

  private buildReleaseList(releases: Release38[]): Raw {
    return {
      Release: releases.map(r => this.buildRelease(r)),
    };
  }

  private buildRelease(r: Release38): Raw {
    const result: Raw = {};
    if (r.releaseId) result.ReleaseId = this.buildReleaseId(r.releaseId);
    result.ReleaseReference = r.releaseReference;
    if (r.referenceTitle) result.ReferenceTitle = this.buildReferenceTitle(r.referenceTitle);
    if (r.releaseResourceReferences) {
      result.ReleaseResourceReferenceList = {
        ReleaseResourceReference: r.releaseResourceReferences.map(ref => this.buildReleaseResourceReference(ref)),
      };
    }
    if (r.releaseType) result.ReleaseType = r.releaseType;
    if (r.detailsByTerritory) {
      result.ReleaseDetailsByTerritory = r.detailsByTerritory.map(d => this.buildReleaseDetailsByTerritory(d));
    }
    if (r.duration) result.Duration = r.duration;
    if (r.pLine) result.PLine = this.buildPLine(r.pLine);
    if (r.cLine) result.CLine = this.buildCLine(r.cLine);
    return result;
  }

  private buildReleaseId(id: ReleaseId): Raw {
    if (!id) return {};
    if (id.icpn) {
      return {
        ICPN: {
          '#text': id.icpn,
          ...(id.isEan != null ? { '@_IsEan': String(id.isEan) } : {}),
        },
      };
    }
    const result: Raw = {};
    if (id.isrc) result.ISRC = id.isrc;
    if (id.gridOrIcpn) result.GRid = id.gridOrIcpn;
    if (id.catalogNumber) {
      result.CatalogNumber = id.catalogNumberNamespace
        ? { '#text': id.catalogNumber, '@_Namespace': id.catalogNumberNamespace }
        : id.catalogNumber;
    }
    return result;
  }

  private buildReleaseResourceReference(ref: ReleaseResourceReference): Raw {
    return {
      '#text': ref.value,
      ...(ref.releaseResourceType ? { '@_ReleaseResourceType': ref.releaseResourceType } : {}),
    };
  }

  private buildReleaseDetailsByTerritory(d: ReleaseDetailsByTerritory): Raw {
    const result: Raw = {};
    result.TerritoryCode = d.territoryCode;
    if (d.displayArtistName) result.DisplayArtistName = d.displayArtistName;
    if (d.labelName) result.LabelName = d.labelName;
    if (d.titles) result.Title = d.titles.map(t => this.buildTitle(t));
    if (d.displayArtists) result.DisplayArtist = d.displayArtists.map(a => this.buildDisplayArtist(a));
    if (d.parentalWarningType) result.ParentalWarningType = d.parentalWarningType;
    if (d.resourceGroup) result.ResourceGroup = this.buildResourceGroup(d.resourceGroup);
    if (d.genre) result.Genre = this.buildGenre(d.genre);
    if (d.originalReleaseDate) result.OriginalReleaseDate = d.originalReleaseDate;
    return result;
  }

  // --- ResourceGroup (recursive) ---

  private buildResourceGroup(rg: ResourceGroup): Raw {
    const result: Raw = {};
    if (rg.title) {
      result.Title = { TitleText: rg.title };
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
    result.ResourceType = item.resourceType;
    result.ReleaseResourceReference = this.buildReleaseResourceReference(item.releaseResourceReference);
    return result;
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
    if (dt.takeDown) result.TakeDown = 'true';
    if (dt.commercialModelType) result.CommercialModelType = dt.commercialModelType;
    if (dt.usage) {
      result.Usage = { UseType: dt.usage.useTypes };
    }
    if (dt.territoryCode) result.TerritoryCode = dt.territoryCode;
    if (dt.validityPeriod) {
      const vp: Raw = {};
      if (dt.validityPeriod.startDate) vp.StartDate = dt.validityPeriod.startDate;
      if (dt.validityPeriod.endDate) vp.EndDate = dt.validityPeriod.endDate;
      result.ValidityPeriod = vp;
    }
    return result;
  }

  // --- Shared builders ---

  private buildDisplayArtist(da: DisplayArtist): Raw {
    const result: Raw = {};
    if (da.sequenceNumber != null) result['@_SequenceNumber'] = String(da.sequenceNumber);
    if (da.artist.names?.length) {
      result.PartyName = da.artist.names.map(pn => {
        const r: Raw = {};
        if (pn.languageAndScriptCode) r['@_LanguageAndScriptCode'] = pn.languageAndScriptCode;
        r.FullName = pn.fullName;
        if (pn.fullNameIndexed) r.FullNameIndexed = pn.fullNameIndexed;
        return r;
      });
    } else {
      result.PartyName = { FullName: da.artist.name };
    }
    if (da.artist.roles?.length) {
      const builtRoles = da.artist.roles.map(r => this.buildArtistRole(r));
      result.ArtistRole = builtRoles.length === 1 ? builtRoles[0] : builtRoles;
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

  private buildResourceContributor(c: ResourceContributor): Raw {
    const result: Raw = {};
    if (c.sequenceNumber != null) result['@_SequenceNumber'] = String(c.sequenceNumber);
    result.PartyName = { FullName: c.name };
    if (c.roleUserDefinedValue) {
      result.ResourceContributorRole = {
        '#text': c.role,
        ...(c.roleNamespace ? { '@_Namespace': c.roleNamespace } : {}),
        '@_UserDefinedValue': c.roleUserDefinedValue,
      };
    } else {
      result.ResourceContributorRole = c.role;
    }
    if (c.instrumentType) result.InstrumentType = c.instrumentType;
    return result;
  }

  private buildIndirectResourceContributor(c: IndirectResourceContributor): Raw {
    const result: Raw = {};
    if (c.sequenceNumber != null) result['@_SequenceNumber'] = String(c.sequenceNumber);
    result.PartyName = { FullName: c.name };
    result.IndirectResourceContributorRole = c.role;
    return result;
  }

  private buildTitle(t: Title): Raw {
    const result: Raw = {};
    if (t.titleType) result['@_TitleType'] = t.titleType;
    if (t.languageAndScriptCode) result['@_LanguageAndScriptCode'] = t.languageAndScriptCode;
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
