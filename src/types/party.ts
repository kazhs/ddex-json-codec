export interface Party {
  partyReference: string;
  partyId?: string[];
  partyName?: PartyName[];
}

export interface PartyName {
  fullName: string;
  fullNameIndexed?: string;
  languageAndScriptCode?: string;
}

export interface Artist {
  /** 解決済みの名前（3.8系: FullNameから直接取得、4系: PartyListから解決） */
  name: string;
  /** 4系のみ: 元の参照ID（ラウンドトリップ用） */
  partyReference?: string;
  partyId?: string[];
  roles?: string[];
}

export interface DisplayArtist {
  artist: Artist;
  sequenceNumber?: number;
}

export interface ResourceContributor {
  name: string;
  role: string;
  sequenceNumber?: number;
  /** UserDefined時の属性 */
  roleNamespace?: string;
  roleUserDefinedValue?: string;
}

export interface IndirectResourceContributor {
  name: string;
  role: string;
  sequenceNumber?: number;
}

/** 4系: PartyReference参照のContributor */
export interface Contributor {
  contributorPartyReference: string;
  /** PartyList解決後に埋める */
  name?: string;
  role: string;
  sequenceNumber?: number;
}
