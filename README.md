# ddex-json-codec

Bidirectional XML/JSON codec for the DDEX ERN (Electronic Release Notification) standard, written in TypeScript.

## Features

- Convert ERN XML to typed TypeScript objects and back
- Supports ERN 3.8.x (3.8 - 3.8.3) and ERN 4.x (4.1 - 4.3.2)
- Automatic version detection from namespace URI
- Built on [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
- Node.js >= 20

## Install

```bash
npm install ddex-json-codec
# or
pnpm add ddex-json-codec
```

## Usage

### XML to JSON

```typescript
import { xmlToJson } from 'ddex-json-codec';

const message = xmlToJson(xmlString);
console.log(message.ernVersion); // "3.8.2"
console.log(message.resourceList); // SoundRecording[]
```

### JSON to XML

```typescript
import { jsonToXml } from 'ddex-json-codec';

const xml = jsonToXml(message);
// Optionally specify a target version
const xml382 = jsonToXml(message, '3.8.2');
```

### Version Detection

```typescript
import { detectVersion } from 'ddex-json-codec';

const version = detectVersion(xmlString); // "4.3"
```

## Supported Versions

| ERN Version | Status |
|---|---|
| 3.8 | Supported |
| 3.8.1 | Supported |
| 3.8.2 | Supported |
| 3.8.3 | Supported |
| 4.1 | Supported |
| 4.1.1 | Supported |
| 4.2 | Supported |
| 4.3 | Supported |
| 4.3.1 | Supported |
| 4.3.2 | Supported |

## API

### `xmlToJson(xml: string): DdexMessage`

Parse an ERN XML string into a typed object. Version is auto-detected.

### `jsonToXml(message: DdexMessage, version?: ErnVersion): string`

Convert a `DdexMessage` back to an ERN XML string. Falls back to `message.ernVersion` when `version` is omitted.

### `detectVersion(xml: string): ErnVersion`

Detect the ERN version from namespace URI or `MessageSchemaVersionId` attribute.

### Types

```typescript
interface DdexMessage {
  ernVersion: ErnVersion;
  messageHeader: MessageHeader;
  updateIndicator?: string;
  resourceList: SoundRecording[];
  imageList?: Image[];
  releaseList: Release[];
  dealList: ReleaseDeal[];
  partyList?: Party[];              // ERN 4.x only
  trackReleaseList?: TrackRelease[]; // ERN 4.x only
}
```

Exported types:

`DdexMessage`, `ErnVersion`, `ErnMajorVersion`, `MessageHeader`, `MessageParty`,
`SoundRecording`, `TechnicalSoundRecordingDetails`,
`Image`, `ImageId`, `ImageDetailsByTerritory`, `TechnicalImageDetails`, `FileDetails`, `HashSum`,
`Release`, `TrackRelease`, `ResourceGroup`, `ReleaseResourceReference`,
`ReleaseDeal`, `Deal`, `DealTerms`, `Usage`,
`Party`, `Artist`, `ArtistRole`, `DisplayArtist`, `ResourceContributor`, `IndirectResourceContributor`, `Contributor`,
`TextWithAttribute`, `Genre`, `PLine`, `CLine`, `Title`, `DisplayTitle`

## License

[MIT](./LICENSE.md)
