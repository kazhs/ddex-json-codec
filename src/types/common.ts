/**
 * XML要素が属性とテキストを両方持つ場合の汎用型
 *
 * 例: <TitleText languageAndScriptCode="en">Some Song</TitleText>
 * →  { value: "Some Song", languageAndScriptCode: "en" }
 */
export type TextWithAttribute<T extends Record<string, string> = Record<string, never>> = {
  value: string;
} & T;

export type TitleText = TextWithAttribute<{ languageAndScriptCode?: string }>;

export interface Title {
  titleText: string;
  subTitle?: string;
  titleType?: string;
}

export interface PLine {
  year?: string;
  pLineText: string;
}

export interface CLine {
  year?: string;
  cLineText: string;
}

export interface Genre {
  genreText: string;
  subGenre?: string;
}

/** 4系: DisplayTitle（territory+lang属性付き） */
export interface DisplayTitle {
  titleText: string;
  subTitle?: string;
  applicableTerritoryCode?: string;
  languageAndScriptCode?: string;
  isDefault?: boolean;
}
