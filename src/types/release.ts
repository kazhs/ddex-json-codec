import type { Genre, PLine, CLine, Title } from './common.js';
import type { DisplayArtist } from './party.js';

export interface Release {
  releaseReference: string;
  releaseType?: string;
  releaseId?: ReleaseId;
  referenceTitle: ReferenceTitle;
  displayArtists: DisplayArtist[];
  releaseResourceReferences?: ReleaseResourceReference[];
  resourceGroup?: ResourceGroup;
  duration?: string;
  pLine?: PLine;
  cLine?: CLine;
  /** 3.8系: territory別の詳細 */
  detailsByTerritory?: ReleaseDetailsByTerritory[];
}

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
  resourceType: string;
  releaseResourceReference: ReleaseResourceReference;
}

export interface TrackRelease {
  releaseReference: string;
  releaseId?: ReleaseId;
  referenceTitle: ReferenceTitle;
  displayArtists: DisplayArtist[];
  releaseResourceReference: string;
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
