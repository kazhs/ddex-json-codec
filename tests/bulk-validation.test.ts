import { describe, expect, test } from 'vite-plus/test';
import { xmlToJson, jsonToXml } from '../src/index.js';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const sampleDir = '/Users/kazuki_hashimoto/Desktop/ddex-sample';
let xmlFiles: string[] = [];

try {
  xmlFiles = readdirSync(sampleDir)
    .filter(f => f.endsWith('.xml'))
    .map(f => resolve(sampleDir, f));
} catch {
  // ディレクトリが存在しない場合はスキップ
}

describe.skipIf(xmlFiles.length === 0)(`Bulk validation: ${xmlFiles.length} ERN 3.8.2 XMLs`, () => {
  const errors: { file: string; phase: string; error: string }[] = [];

  test('all files parse without error (XML→JSON)', () => {
    for (const file of xmlFiles) {
      try {
        xmlToJson(readFileSync(file, 'utf-8'));
      } catch (e) {
        errors.push({
          file: basename(file),
          phase: 'xmlToJson',
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    if (errors.length > 0) {
      console.log(`\n--- xmlToJson failures (${errors.length}/${xmlFiles.length}) ---`);
      for (const err of errors.slice(0, 20)) {
        console.log(`  ${err.file}: ${err.error}`);
      }
    }
    expect(errors).toHaveLength(0);
  });

  test('all files roundtrip (XML→JSON→XML→JSON)', () => {
    const roundtripErrors: { file: string; field: string; detail: string }[] = [];

    for (const file of xmlFiles) {
      try {
        const xml1 = readFileSync(file, 'utf-8');
        const json1 = xmlToJson(xml1);
        const xml2 = jsonToXml(json1);
        const json2 = xmlToJson(xml2);

        // 基本フィールドの等価性チェック
        if (json2.ernVersion !== json1.ernVersion) {
          roundtripErrors.push({ file: basename(file), field: 'ernVersion', detail: `${json1.ernVersion} → ${json2.ernVersion}` });
        }
        if (json2.resourceList.length !== json1.resourceList.length) {
          roundtripErrors.push({ file: basename(file), field: 'resourceList.length', detail: `${json1.resourceList.length} → ${json2.resourceList.length}` });
        }
        if (json2.releaseList.length !== json1.releaseList.length) {
          roundtripErrors.push({ file: basename(file), field: 'releaseList.length', detail: `${json1.releaseList.length} → ${json2.releaseList.length}` });
        }
        if (json2.dealList.length !== json1.dealList.length) {
          roundtripErrors.push({ file: basename(file), field: 'dealList.length', detail: `${json1.dealList.length} → ${json2.dealList.length}` });
        }

        // ISRC の等価性
        for (let i = 0; i < json1.resourceList.length; i++) {
          const isrc1 = json1.resourceList[i].soundRecordingId?.isrc;
          const isrc2 = json2.resourceList[i]?.soundRecordingId?.isrc;
          if (isrc1 !== isrc2) {
            roundtripErrors.push({ file: basename(file), field: `resourceList[${i}].isrc`, detail: `${isrc1} → ${isrc2}` });
          }
        }
      } catch (e) {
        roundtripErrors.push({
          file: basename(file),
          field: 'exception',
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    }
    if (roundtripErrors.length > 0) {
      console.log(`\n--- roundtrip failures (${roundtripErrors.length}) ---`);
      for (const err of roundtripErrors.slice(0, 20)) {
        console.log(`  ${err.file} [${err.field}]: ${err.detail}`);
      }
    }
    expect(roundtripErrors).toHaveLength(0);
  });
});
