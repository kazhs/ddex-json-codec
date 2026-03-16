# ddex-json-codec

Bidirectional XML/JSON codec for the DDEX ERN (Electronic Release Notification) standard, written in TypeScript.

## Features

- Convert ERN XML to typed TypeScript objects and back
- **Version conversion** between ERN 3.8 and ERN 4 with loss reports
- Discriminated Union types — version-specific fields are enforced at compile time
- Supports ERN 3.8.x (3.8 – 3.8.3) and ERN 4.x (4.1 – 4.3.2)
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
import { ddexToJson } from 'ddex-json-codec';

const message = ddexToJson(xmlString);
console.log(message.ernVersion); // "3.8.2"
console.log(message.resourceList); // SoundRecording[]
```

### JSON to XML

```typescript
import { jsonToDdex } from 'ddex-json-codec';

const xml = jsonToDdex(message);
```

### Version Detection

```typescript
import { detectDdexVersion } from 'ddex-json-codec';

const version = detectDdexVersion(xmlString); // "4.3"
```

### Version Conversion

Convert between ERN 3.8 and ERN 4. Incompatible fields are reported as warnings.

```typescript
import { convertDdexVersion, convertDdexMessage } from 'ddex-json-codec';

// XML string → XML string
const { xml, warnings } = convertDdexVersion(ern38Xml, '4');
// warnings: [{ type: 'structure_changed', path: '...', message: '...' }]

// DdexMessage → DdexMessage
const { result, warnings } = convertDdexMessage(message, '3.8');
```

Target is `'3.8'` or `'4'` (major version). Output uses the latest patch: 3.8.3 for 3.8, 4.3.2 for 4.

#### What gets converted

| 3.8 → 4 | 4 → 3.8 |
|---|---|
| `detailsByTerritory` → flat fields | Flat fields → `detailsByTerritory` (Worldwide) |
| Inline `PartyName` → `PartyList` + references | `PartyList` → inline `PartyName` |
| `ReferenceTitle` → `DisplayTitle` | `DisplayTitle` → `ReferenceTitle` + `Title[]` |
| `ResourceContributor` → `Contributor` | `Contributor` → `ResourceContributor` |
| `Usage { useTypes }` → `useTypes` | `useTypes` → `Usage { useTypes }` |
| `takeDown` deals removed (warning) | — |
| — | `PartyId` dropped (warning) |
| — | `TrackRelease` dropped (warning) |

## Discriminated Union Types

Types are split by version, preventing silent field ignoring:

```typescript
import type { DdexMessage, DdexMessage38, DdexMessage4 } from 'ddex-json-codec';

const msg = ddexToJson(xml);

// Narrow by ernVersion
if (msg.ernVersion.startsWith('3.8')) {
  const msg38 = msg as DdexMessage38;
  msg38.resourceList[0].detailsByTerritory; // OK
}
```

`SoundRecording`, `Release`, `Image` are also split into `*38` / `*4` variants with shared `*Base` interfaces.

## Supported Versions

| ERN Version | Status |
|---|---|
| 3.8 – 3.8.3 | Supported |
| 4.1 – 4.3.2 | Supported |

## API

### `ddexToJson(xml: string): DdexMessage`

Parse an ERN XML string into a typed object. Version is auto-detected.

### `jsonToDdex(message: DdexMessage): string`

Convert a `DdexMessage` back to an ERN XML string.

### `detectDdexVersion(xml: string): ErnVersion`

Detect the ERN version from namespace URI or `MessageSchemaVersionId` attribute.

### `convertDdexVersion(xml: string, target: ErnMajorVersion): ConversionResult & { xml: string }`

Convert an ERN XML string to a different major version. Returns the converted XML, the parsed result, and any warnings.

### `convertDdexMessage(message: DdexMessage, target: ErnMajorVersion): ConversionResult`

Convert a `DdexMessage` to a different major version. Returns the converted message and any warnings.

### Types

```typescript
// Discriminated Union
type DdexMessage = DdexMessage38 | DdexMessage4;
type SoundRecording = SoundRecording38 | SoundRecording4;
type Release = Release38 | Release4;
type Image = Image38 | Image4;

// Version conversion
interface ConversionResult {
  result: DdexMessage;
  warnings: ConversionWarning[];
}

interface ConversionWarning {
  type: 'field_dropped' | 'structure_changed';
  path: string;
  message: string;
}
```

## License

[MIT](./LICENSE.md)
