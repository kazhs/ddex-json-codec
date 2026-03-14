import type { TitleText } from './common.js';
import type { DisplayArtist } from './party.js';

export interface SoundRecording {
  resourceReference: string;
  type?: string;
  soundRecordingId?: SoundRecordingId;
  title: TitleText;
  displayArtists: DisplayArtist[];
  duration?: string;
  creationDate?: string;
  /** 3.8系: territory別の詳細 */
  detailsByTerritory?: SoundRecordingDetailsByTerritory[];
}

export interface SoundRecordingId {
  isrc?: string;
  catalogNumber?: string;
}

export interface SoundRecordingDetailsByTerritory {
  territoryCode: string[];
  displayArtists?: DisplayArtist[];
  title?: TitleText;
}
