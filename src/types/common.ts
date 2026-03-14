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
