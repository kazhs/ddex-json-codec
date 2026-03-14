import { describe, expect, test } from 'vite-plus/test';
import { detectVersion } from '../src/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixtures = resolve(import.meta.dirname, 'fixtures');
const singleXml = readFileSync(resolve(fixtures, 'ern382-single.xml'), 'utf-8');
const albumXml = readFileSync(resolve(fixtures, 'ern382-album.xml'), 'utf-8');

describe('detectVersion', () => {
  test('should detect ERN 3.8.2 from namespace URI', () => {
    expect(detectVersion(singleXml)).toBe('3.8.2');
  });

  test('should detect ERN 3.8.2 from MessageSchemaVersionId', () => {
    const xml = '<NewReleaseMessage MessageSchemaVersionId="ern/382">';
    expect(detectVersion(xml)).toBe('3.8.2');
  });

  test('should detect ERN 4.3 from namespace URI', () => {
    const xml = '<NewReleaseMessage xmlns:ern="http://ddex.net/xml/ern/43">';
    expect(detectVersion(xml)).toBe('4.3');
  });

  test('should throw on unrecognized version', () => {
    expect(() => detectVersion('<foo/>')).toThrow();
  });
});
