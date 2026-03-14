import type { SoundRecording } from './sound-recording.js';
import type { Release, TrackRelease } from './release.js';
import type { Deal } from './deal.js';
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

export interface MessageHeader {
  messageId: string;
  messageSender: string;
  messageRecipient: string;
  messageCreatedDateTime: string;
}

export interface DdexMessage {
  ernVersion: ErnVersion;
  messageHeader: MessageHeader;
  resourceList: SoundRecording[];
  releaseList: Release[];
  dealList: Deal[];
  /** 4系のみ: PartyList（ラウンドトリップ用に保持） */
  partyList?: Party[];
  /** 4系のみ: TrackRelease */
  trackReleaseList?: TrackRelease[];
}
