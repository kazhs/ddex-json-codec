import type { DisplayTitle, Genre, PLine, CLine, Title } from './common.js';
import type { DisplayArtist } from './party.js';

export interface ReleaseBase {
  releaseReference: string;
  releaseType?: string;
  releaseId?: ReleaseId;
  displayArtists: DisplayArtist[];
  releaseResourceReferences?: ReleaseResourceReference[];
  duration?: string;
  pLine?: PLine;
  cLine?: CLine;
}

export interface Release38 extends ReleaseBase {
  referenceTitle?: ReferenceTitle;
  detailsByTerritory?: ReleaseDetailsByTerritory[];
  resourceGroup?: ResourceGroup;
}

export interface Release4 extends ReleaseBase {
  displayTitleText?: string;
  displayTitles?: DisplayTitle[];
  releaseLabelReferences?: string[];
  genre?: Genre;
  parentalWarningType?: string;
  resourceGroup?: ResourceGroup;
}

export type Release = Release38 | Release4;

export interface ReferenceTitle {
  titleText: string;
  subTitle?: string;
}

export interface ReleaseId {
  icpn?: string;
  isEan?: boolean;
  isrc?: string;
  gridOrIcpn?: string;
  catalogNumber?: string;
  catalogNumberNamespace?: string;
  proprietaryId?: string;
}

export interface ReleaseResourceReference {
  value: string;
  releaseResourceType?: string;
}

export interface ResourceGroup {
  sequenceNumber?: number;
  title?: string;
  resourceGroups?: ResourceGroup[];
  resourceGroupContentItems?: ResourceGroupContentItem[];
}

export interface ResourceGroupContentItem {
  sequenceNumber?: number;
  resourceType?: string;
  releaseResourceReference: ReleaseResourceReference;
}

export interface TrackRelease {
  releaseReference: string;
  releaseId?: ReleaseId;
  referenceTitle?: ReferenceTitle;
  displayArtists?: DisplayArtist[];
  releaseResourceReference: string;
  displayTitles?: DisplayTitle[];
  releaseLabelReferences?: string[];
  genre?: Genre;
}

export interface ReleaseDetailsByTerritory {
  territoryCode: string[];
  displayArtists?: DisplayArtist[];
  displayArtistName?: string;
  titles?: Title[];
  labelName?: string;
  genre?: Genre;
  parentalWarningType?: string;
  originalReleaseDate?: string;
  resourceGroup?: ResourceGroup;
}
