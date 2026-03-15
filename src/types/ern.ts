import type { SoundRecording38, SoundRecording4 } from './sound-recording.js';
import type { Image38, Image4 } from './image.js';
import type { Release38, Release4, TrackRelease } from './release.js';
import type { ReleaseDeal } from './deal.js';
import type { Party } from './party.js';

/**
 * パッチレベルまでのバージョン（namespace URIから検出）
 */
export type ErnVersion38 = '3.8' | '3.8.1' | '3.8.2' | '3.8.3';
export type ErnVersion4 = '4.1' | '4.1.1' | '4.2' | '4.3' | '4.3.1' | '4.3.2';
export type ErnVersion = ErnVersion38 | ErnVersion4;

/**
 * 変換ロジックの分岐用（メジャー系統のみ）
 */
export type ErnMajorVersion = '3.8' | '4';

export interface MessageParty {
  partyId?: string;
  partyIdIsDpid?: boolean;
  fullName?: string;
  tradingName?: string;
}

export interface MessageHeader {
  messageThreadId?: string;
  messageId: string;
  messageFileName?: string;
  messageSender: MessageParty;
  messageRecipient: MessageParty;
  messageCreatedDateTime: string;
}

export interface DdexMessageBase {
  messageHeader: MessageHeader;
  updateIndicator?: string;
}

export interface DdexMessage38 extends DdexMessageBase {
  ernVersion: ErnVersion38;
  resourceList: SoundRecording38[];
  imageList?: Image38[];
  releaseList: Release38[];
  dealList: ReleaseDeal[];
}

export interface DdexMessage4 extends DdexMessageBase {
  ernVersion: ErnVersion4;
  resourceList: SoundRecording4[];
  imageList?: Image4[];
  releaseList: Release4[];
  dealList: ReleaseDeal[];
  partyList?: Party[];
  trackReleaseList?: TrackRelease[];
}

export type DdexMessage = DdexMessage38 | DdexMessage4;
