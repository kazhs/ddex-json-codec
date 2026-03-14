export interface Party {
  partyReference: string;
  partyId?: string[];
  partyName?: PartyName[];
}

export interface PartyName {
  fullName: string;
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
