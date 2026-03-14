import type { DisplayTitle, Genre, PLine, Title } from './common.js';
import type { Contributor, DisplayArtist, ResourceContributor, IndirectResourceContributor } from './party.js';

export interface SoundRecording {
  resourceReference: string;
  type?: string;
  soundRecordingId?: SoundRecordingId;
  referenceTitle?: ReferenceTitle;
  displayArtists: DisplayArtist[];
  duration?: string;
  creationDate?: string;
  languageOfPerformance?: string;
  pLine?: PLine;
  /** 3.8系: territory別の詳細 */
  detailsByTerritory?: SoundRecordingDetailsByTerritory[];
  /** 4系: フラットなタイトルテキスト */
  displayTitleText?: string;
  /** 4系: 複数のDisplayTitle（territory+lang属性） */
  displayTitles?: DisplayTitle[];
  /** 4系: PartyReference参照のContributor */
  contributors?: Contributor[];
}

export interface SoundRecordingId {
  isrc?: string;
  catalogNumber?: string;
}

export interface ReferenceTitle {
  titleText: string;
  subTitle?: string;
}

export interface SoundRecordingDetailsByTerritory {
  territoryCode: string[];
  displayArtists?: DisplayArtist[];
  titles?: Title[];
  labelName?: string;
  pLine?: PLine;
  genre?: Genre;
  parentalWarningType?: string;
  sequenceNumber?: number;
  resourceContributors?: ResourceContributor[];
  indirectResourceContributors?: IndirectResourceContributor[];
}
