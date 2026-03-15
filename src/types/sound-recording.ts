import type { DisplayTitle, Genre, PLine, Title } from './common.js';
import type { Contributor, DisplayArtist, ResourceContributor, IndirectResourceContributor } from './party.js';
import type { FileDetails } from './image.js';

export interface SoundRecordingBase {
  resourceReference: string;
  type?: string;
  soundRecordingId?: SoundRecordingId;
  displayArtists: DisplayArtist[];
  duration?: string;
  creationDate?: string;
  languageOfPerformance?: string;
  pLine?: PLine;
}

export interface SoundRecording38 extends SoundRecordingBase {
  referenceTitle?: ReferenceTitle;
  detailsByTerritory?: SoundRecordingDetailsByTerritory[];
}

export interface SoundRecording4 extends SoundRecordingBase {
  displayTitleText?: string;
  displayTitles?: DisplayTitle[];
  contributors?: Contributor[];
}

export type SoundRecording = SoundRecording38 | SoundRecording4;

export interface SoundRecordingId {
  isrc?: string;
  catalogNumber?: string;
}

export interface ReferenceTitle {
  titleText: string;
  subTitle?: string;
}

export interface TechnicalSoundRecordingDetails {
  technicalResourceDetailsReference?: string;
  audioCodecType?: string;
  bitRate?: number;
  bitRateUnit?: string;
  bitsPerSample?: number;
  numberOfChannels?: number;
  samplingRate?: number;
  samplingRateUnit?: string;
  isPreview?: boolean;
  file?: FileDetails;
}

export interface SoundRecordingDetailsByTerritory {
  territoryCode: string[];
  displayArtists?: DisplayArtist[];
  displayArtistName?: string;
  titles?: Title[];
  labelName?: string;
  pLine?: PLine;
  genre?: Genre;
  parentalWarningType?: string;
  sequenceNumber?: number;
  resourceContributors?: ResourceContributor[];
  indirectResourceContributors?: IndirectResourceContributor[];
  technicalDetails?: TechnicalSoundRecordingDetails[];
}
