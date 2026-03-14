import type { TitleText } from './common.js';
import type { DisplayArtist } from './party.js';

export interface Release {
  releaseReference: string;
  releaseType?: string;
  releaseId?: ReleaseId;
  title: TitleText;
  displayArtists: DisplayArtist[];
  resourceGroup?: ResourceGroup;
  /** 3.8系: territory別の詳細 */
  detailsByTerritory?: ReleaseDetailsByTerritory[];
}

export interface ReleaseId {
  gridOrIcpn?: string;
  catalogNumber?: string;
}

export interface ResourceGroup {
  sequenceNumber?: number;
  resourceGroupContentItems?: ResourceGroupContentItem[];
}

export interface ResourceGroupContentItem {
  sequenceNumber: number;
  resourceType: string;
  releaseResourceReference: string;
}

export interface TrackRelease {
  releaseReference: string;
  releaseId?: ReleaseId;
  title: TitleText;
  displayArtists: DisplayArtist[];
  releaseResourceReference: string;
}

export interface ReleaseDetailsByTerritory {
  territoryCode: string[];
  displayArtists?: DisplayArtist[];
  title?: TitleText;
}
