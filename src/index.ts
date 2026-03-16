import { xmlToJson } from './converter/xml-to-json/index.js';
import { jsonToXml } from './converter/json-to-xml/index.js';
import { detectVersion } from './version/detect.js';
import { convertDdexMessage } from './converter/version/index.js';
import type { ErnMajorVersion } from './types/ern.js';
import type { ConversionResult } from './converter/version/index.js';

export { xmlToJson as ddexToJson };
export { jsonToXml as jsonToDdex };
export { detectVersion as detectDdexVersion };
export { convertDdexMessage };
export type { ConversionResult, ConversionWarning } from './converter/version/index.js';

/**
 * DDEX XML文字列をターゲットメジャーバージョンに変換する
 */
export function convertDdexVersion(xml: string, target: ErnMajorVersion): ConversionResult & { xml: string } {
  const message = xmlToJson(xml);
  const { result, warnings } = convertDdexMessage(message, target);
  return { result, xml: jsonToXml(result), warnings };
}

export type {
  DdexMessage,
  DdexMessage38,
  DdexMessage4,
  DdexMessageBase,
  ErnVersion,
  ErnVersion38,
  ErnVersion4,
  ErnMajorVersion,
  MessageHeader,
  MessageParty,
} from './types/ern.js';

export type {
  SoundRecording,
  SoundRecording38,
  SoundRecording4,
  SoundRecordingBase,
  SoundRecordingDetailsByTerritory,
  TechnicalSoundRecordingDetails,
} from './types/sound-recording.js';

export type {
  Image,
  Image38,
  Image4,
  ImageBase,
  ImageId,
  ImageDetailsByTerritory,
  TechnicalImageDetails,
  FileDetails,
  HashSum,
} from './types/image.js';

export type {
  Release,
  Release38,
  Release4,
  ReleaseBase,
  TrackRelease,
  ResourceGroup,
  ReleaseResourceReference,
  ReleaseId,
  ReleaseDetailsByTerritory,
} from './types/release.js';

export type { ReleaseDeal, Deal, DealTerms, Usage } from './types/deal.js';

export type {
  Party,
  PartyName,
  Artist,
  ArtistRole,
  DisplayArtist,
  ResourceContributor,
  IndirectResourceContributor,
  Contributor,
} from './types/party.js';

export type { TextWithAttribute, Genre, PLine, CLine, Title, DisplayTitle } from './types/common.js';
