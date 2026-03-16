import type { DdexMessage, DdexMessage38, DdexMessage4, ErnVersion, ErnVersion38, ErnVersion4 } from '../../types/ern.js';
import type { SoundRecording38, SoundRecording4, SoundRecordingDetailsByTerritory, ReferenceTitle } from '../../types/sound-recording.js';
import type { Release38, Release4, ReleaseDetailsByTerritory } from '../../types/release.js';
import type { Image38, Image4 } from '../../types/image.js';
import type { ReleaseDeal, DealTerms } from '../../types/deal.js';
import type { DisplayArtist, Party, PartyName, ResourceContributor, Contributor } from '../../types/party.js';
import type { DisplayTitle, Title } from '../../types/common.js';
import { getMajorVersion } from '../../version/detect.js';

export interface ConversionWarning {
  type: 'field_dropped' | 'structure_changed';
  path: string;
  message: string;
}

export interface ConversionResult {
  result: DdexMessage;
  warnings: ConversionWarning[];
}

/**
 * DdexMessage をターゲットバージョンに変換する
 */
export function convertDdexMessage(message: DdexMessage, target: ErnVersion): ConversionResult {
  const sourceMajor = getMajorVersion(message.ernVersion);
  const targetMajor = getMajorVersion(target);

  if (sourceMajor === targetMajor) {
    // 同一メジャー: ernVersion だけ差し替え
    return { result: { ...message, ernVersion: target } as DdexMessage, warnings: [] };
  }

  if (sourceMajor === '3.8' && targetMajor === '4') {
    return convert38To4(message as DdexMessage38, target as ErnVersion4);
  }

  return convert4To38(message as DdexMessage4, target as ErnVersion38);
}

// --- 3.8 → 4 ---

function convert38To4(msg: DdexMessage38, target: ErnVersion4): ConversionResult {
  const warnings: ConversionWarning[] = [];
  const partyMap = new Map<string, Party>();

  const resourceList = msg.resourceList.map((sr, i) =>
    convertSoundRecording38To4(sr, i, partyMap, warnings),
  );

  const imageList = msg.imageList?.map((img): Image4 => ({
    resourceReference: img.resourceReference,
    type: img.type,
    imageId: img.imageId,
    parentalWarningType: img.detailsByTerritory?.[0]?.parentalWarningType,
    technicalDetails: img.detailsByTerritory?.[0]?.technicalDetails,
  }));

  const releaseList = msg.releaseList.map((r, i) =>
    convertRelease38To4(r, i, partyMap, warnings),
  );

  const dealList = convertDealList38To4(msg.dealList, warnings);

  const partyList = Array.from(partyMap.values());

  return {
    result: {
      ernVersion: target,
      messageHeader: msg.messageHeader,
      updateIndicator: msg.updateIndicator,
      resourceList,
      imageList,
      releaseList,
      dealList,
      partyList: partyList.length > 0 ? partyList : undefined,
    },
    warnings,
  };
}

function convertSoundRecording38To4(
  sr: SoundRecording38,
  index: number,
  partyMap: Map<string, Party>,
  warnings: ConversionWarning[],
): SoundRecording4 {
  const dbt = sr.detailsByTerritory?.[0];

  if (sr.detailsByTerritory && sr.detailsByTerritory.length > 1) {
    warnings.push({
      type: 'structure_changed',
      path: `resourceList[${index}].detailsByTerritory`,
      message: `${sr.detailsByTerritory.length} territories collapsed to first territory`,
    });
  }

  const displayArtists = (dbt?.displayArtists ?? sr.displayArtists).map(da =>
    ensurePartyReference(da, partyMap),
  );

  const contributors = convertResourceContributorsToContributors(
    dbt?.resourceContributors,
    partyMap,
  );

  if (dbt?.indirectResourceContributors?.length) {
    warnings.push({
      type: 'field_dropped',
      path: `resourceList[${index}].detailsByTerritory[0].indirectResourceContributors`,
      message: 'IndirectResourceContributors dropped (no equivalent in ERN 4)',
    });
  }

  return {
    resourceReference: sr.resourceReference,
    type: sr.type,
    soundRecordingId: sr.soundRecordingId,
    displayArtists,
    duration: sr.duration,
    creationDate: sr.creationDate,
    languageOfPerformance: sr.languageOfPerformance,
    pLine: dbt?.pLine ?? sr.pLine,
    displayTitleText: sr.referenceTitle?.titleText,
    displayTitles: convertTitlesToDisplayTitles(dbt?.titles, dbt?.territoryCode?.[0]),
    contributors: contributors.length > 0 ? contributors : undefined,
  };
}

function convertRelease38To4(
  r: Release38,
  index: number,
  partyMap: Map<string, Party>,
  warnings: ConversionWarning[],
): Release4 {
  const dbt = r.detailsByTerritory?.[0];

  if (r.detailsByTerritory && r.detailsByTerritory.length > 1) {
    warnings.push({
      type: 'structure_changed',
      path: `releaseList[${index}].detailsByTerritory`,
      message: `${r.detailsByTerritory.length} territories collapsed to first territory`,
    });
  }

  const displayArtists = (dbt?.displayArtists ?? r.displayArtists).map(da =>
    ensurePartyReference(da, partyMap),
  );

  // Convert label to PartyList reference
  const releaseLabelReferences: string[] | undefined = dbt?.labelName
    ? [ensureLabelPartyReference(dbt.labelName, partyMap)]
    : undefined;

  return {
    releaseReference: r.releaseReference,
    releaseType: r.releaseType,
    releaseId: r.releaseId,
    displayArtists,
    releaseResourceReferences: r.releaseResourceReferences,
    duration: r.duration,
    pLine: r.pLine,
    cLine: r.cLine,
    displayTitleText: r.referenceTitle?.titleText,
    displayTitles: convertTitlesToDisplayTitles(dbt?.titles, dbt?.territoryCode?.[0]),
    releaseLabelReferences,
    genre: dbt?.genre,
    parentalWarningType: dbt?.parentalWarningType,
    resourceGroup: dbt?.resourceGroup ?? r.resourceGroup,
  };
}

function convertDealList38To4(dealList: ReleaseDeal[], warnings: ConversionWarning[]): ReleaseDeal[] {
  return dealList.map((rd, i) => ({
    ...rd,
    deals: rd.deals
      .filter((d, j) => {
        if (d.dealTerms.takeDown) {
          warnings.push({
            type: 'structure_changed',
            path: `dealList[${i}].deals[${j}]`,
            message: 'Deal with takeDown=true removed (ERN 4 uses deal absence for takedown)',
          });
          return false;
        }
        return true;
      })
      .map(d => ({
        ...d,
        dealTerms: convertDealTerms38To4(d.dealTerms),
      })),
  }));
}

function convertDealTerms38To4(dt: DealTerms): DealTerms {
  return {
    commercialModelType: dt.commercialModelType,
    useTypes: dt.usage?.useTypes,
    territoryCode: dt.territoryCode,
    validityPeriod: dt.validityPeriod,
    priceInformation: dt.priceInformation,
  };
}

// --- 4 → 3.8 ---

function convert4To38(msg: DdexMessage4, target: ErnVersion38): ConversionResult {
  const warnings: ConversionWarning[] = [];
  const partyIndex = new Map<string, Party>();
  if (msg.partyList) {
    for (const p of msg.partyList) {
      partyIndex.set(p.partyReference, p);
    }
  }

  const resourceList = msg.resourceList.map((sr, i) =>
    convertSoundRecording4To38(sr, i, partyIndex, warnings),
  );

  const imageList = msg.imageList?.map((img): Image38 => ({
    resourceReference: img.resourceReference,
    type: img.type,
    imageId: img.imageId,
    detailsByTerritory: [{
      territoryCode: ['Worldwide'],
      parentalWarningType: img.parentalWarningType,
      technicalDetails: img.technicalDetails,
    }],
  }));

  const releaseList = msg.releaseList.map((r, i) =>
    convertRelease4To38(r, i, partyIndex, warnings),
  );

  if (msg.trackReleaseList?.length) {
    warnings.push({
      type: 'field_dropped',
      path: 'trackReleaseList',
      message: `${msg.trackReleaseList.length} TrackRelease(s) dropped (not available in ERN 3.8)`,
    });
  }

  // Check for PartyId loss
  if (msg.partyList?.some(p => p.partyId?.length)) {
    warnings.push({
      type: 'field_dropped',
      path: 'partyList[].partyId',
      message: 'PartyId (ISNI, IPN etc.) dropped (no storage in ERN 3.8 inline PartyName)',
    });
  }

  const dealList = msg.dealList.map(rd => ({
    ...rd,
    deals: rd.deals.map(d => ({
      ...d,
      dealTerms: convertDealTerms4To38(d.dealTerms),
    })),
  }));

  return {
    result: {
      ernVersion: target,
      messageHeader: msg.messageHeader,
      updateIndicator: msg.updateIndicator,
      resourceList,
      imageList,
      releaseList,
      dealList,
    },
    warnings,
  };
}

function convertSoundRecording4To38(
  sr: SoundRecording4,
  _index: number,
  partyIndex: Map<string, Party>,
  _warnings: ConversionWarning[],
): SoundRecording38 {
  const displayArtists = sr.displayArtists.map(da => resolveInlineArtist(da, partyIndex));

  const referenceTitle: ReferenceTitle | undefined = sr.displayTitleText
    ? { titleText: sr.displayTitleText }
    : sr.displayTitles?.[0]
      ? { titleText: sr.displayTitles[0].titleText, subTitle: sr.displayTitles[0].subTitle }
      : undefined;

  const titles = convertDisplayTitlesToTitles(sr.displayTitles);

  const resourceContributors = sr.contributors?.map(c =>
    resolveContributorToResourceContributor(c, partyIndex),
  );

  const dbt: SoundRecordingDetailsByTerritory = {
    territoryCode: ['Worldwide'],
    displayArtists,
    titles,
    pLine: sr.pLine,
  };

  if (resourceContributors?.length) {
    dbt.resourceContributors = resourceContributors;
  }

  return {
    resourceReference: sr.resourceReference,
    type: sr.type,
    soundRecordingId: sr.soundRecordingId,
    displayArtists,
    duration: sr.duration,
    creationDate: sr.creationDate,
    languageOfPerformance: sr.languageOfPerformance,
    pLine: sr.pLine,
    referenceTitle,
    detailsByTerritory: [dbt],
  };
}

function convertRelease4To38(
  r: Release4,
  _index: number,
  partyIndex: Map<string, Party>,
  _warnings: ConversionWarning[],
): Release38 {
  const displayArtists = r.displayArtists.map(da => resolveInlineArtist(da, partyIndex));

  const referenceTitle: ReferenceTitle | undefined = r.displayTitleText
    ? { titleText: r.displayTitleText }
    : r.displayTitles?.[0]
      ? { titleText: r.displayTitles[0].titleText, subTitle: r.displayTitles[0].subTitle }
      : undefined;

  const titles = convertDisplayTitlesToTitles(r.displayTitles);

  // Resolve label references to names
  let labelName: string | undefined;
  if (r.releaseLabelReferences?.[0]) {
    const party = partyIndex.get(r.releaseLabelReferences[0]);
    labelName = party?.partyName?.[0]?.fullName ?? r.releaseLabelReferences[0];
  }

  const dbt: ReleaseDetailsByTerritory = {
    territoryCode: ['Worldwide'],
    displayArtists,
    titles,
    labelName,
    genre: r.genre,
    parentalWarningType: r.parentalWarningType,
    resourceGroup: r.resourceGroup,
  };

  return {
    releaseReference: r.releaseReference,
    releaseType: r.releaseType,
    releaseId: r.releaseId,
    displayArtists,
    releaseResourceReferences: r.releaseResourceReferences,
    duration: r.duration,
    pLine: r.pLine,
    cLine: r.cLine,
    referenceTitle,
    detailsByTerritory: [dbt],
    resourceGroup: r.resourceGroup,
  };
}

function convertDealTerms4To38(dt: DealTerms): DealTerms {
  return {
    commercialModelType: dt.commercialModelType,
    usage: dt.useTypes ? { useTypes: dt.useTypes } : undefined,
    territoryCode: dt.territoryCode,
    validityPeriod: dt.validityPeriod,
    priceInformation: dt.priceInformation,
  };
}

// --- Shared helpers ---

function convertResourceContributorsToContributors(
  contributors: ResourceContributor[] | undefined,
  partyMap: Map<string, Party>,
): Contributor[] {
  if (!contributors?.length) return [];
  return contributors.map(c => {
    const ref = generatePartyReference(c.name);
    if (!partyMap.has(ref)) {
      partyMap.set(ref, {
        partyReference: ref,
        partyName: [{ fullName: c.name }],
      });
    }
    return {
      contributorPartyReference: ref,
      name: c.name,
      role: c.role,
      sequenceNumber: c.sequenceNumber,
    };
  });
}

function generatePartyReference(name: string): string {
  // Generate a stable reference from name: "P" + alphanumeric chars
  const clean = name.replace(/[^a-zA-Z0-9]/g, '');
  return `P${clean || 'Unknown'}`;
}

function ensurePartyReference(da: DisplayArtist, partyMap: Map<string, Party>): DisplayArtist {
  if (da.artist.partyReference) return da;

  const ref = generatePartyReference(da.artist.name);
  if (!partyMap.has(ref)) {
    const partyNames: PartyName[] = da.artist.names?.length
      ? da.artist.names
      : [{ fullName: da.artist.name }];
    partyMap.set(ref, {
      partyReference: ref,
      partyName: partyNames,
    });
  }

  return {
    ...da,
    artist: {
      ...da.artist,
      partyReference: ref,
    },
  };
}

function ensureLabelPartyReference(labelName: string, partyMap: Map<string, Party>): string {
  const ref = generatePartyReference(labelName);
  if (!partyMap.has(ref)) {
    partyMap.set(ref, {
      partyReference: ref,
      partyName: [{ fullName: labelName }],
    });
  }
  return ref;
}

function resolveInlineArtist(da: DisplayArtist, partyIndex: Map<string, Party>): DisplayArtist {
  if (!da.artist.partyReference) return da;

  const party = partyIndex.get(da.artist.partyReference);
  const name = party?.partyName?.[0]?.fullName ?? da.artist.name;
  const names = party?.partyName && party.partyName.length > 1 ? party.partyName : da.artist.names;

  return {
    ...da,
    artist: {
      name,
      names,
      roles: da.artist.roles,
      // partyReference is intentionally omitted for 3.8
    },
  };
}

function resolveContributorToResourceContributor(
  c: Contributor,
  partyIndex: Map<string, Party>,
): ResourceContributor {
  const party = partyIndex.get(c.contributorPartyReference);
  const name = party?.partyName?.[0]?.fullName ?? c.name ?? c.contributorPartyReference;
  return {
    name,
    role: c.role,
    sequenceNumber: c.sequenceNumber,
  };
}

function convertTitlesToDisplayTitles(
  titles: Title[] | undefined,
  territoryCode?: string,
): DisplayTitle[] | undefined {
  if (!titles?.length) return undefined;
  return titles.map((t, i) => ({
    titleText: t.titleText,
    subTitle: t.subTitle,
    applicableTerritoryCode: territoryCode ?? 'Worldwide',
    languageAndScriptCode: t.languageAndScriptCode,
    isDefault: i === 0 ? true : undefined,
  }));
}

function convertDisplayTitlesToTitles(displayTitles: DisplayTitle[] | undefined): Title[] | undefined {
  if (!displayTitles?.length) return undefined;
  return displayTitles.map(dt => ({
    titleText: dt.titleText,
    subTitle: dt.subTitle,
    titleType: 'DisplayTitle',
    languageAndScriptCode: dt.languageAndScriptCode,
  }));
}
