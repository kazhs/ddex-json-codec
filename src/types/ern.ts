import type { SoundRecording } from './sound-recording.js';
import type { Image } from './image.js';
import type { Release, TrackRelease } from './release.js';
import type { ReleaseDeal } from './deal.js';
import type { Party } from './party.js';

/**
 * パッチレベルまでのバージョン（namespace URIから検出）
 */
export type ErnVersion =
  | '3.8' | '3.8.1' | '3.8.2' | '3.8.3'
  | '4.1' | '4.1.1' | '4.2' | '4.3' | '4.3.1' | '4.3.2';

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

export interface DdexMessage {
  ernVersion: ErnVersion;
  messageHeader: MessageHeader;
  updateIndicator?: string;
  resourceList: SoundRecording[];
  imageList?: Image[];
  releaseList: Release[];
  dealList: ReleaseDeal[];
  /** 4系のみ: PartyList（ラウンドトリップ用に保持） */
  partyList?: Party[];
  /** 4系のみ: TrackRelease */
  trackReleaseList?: TrackRelease[];
}
