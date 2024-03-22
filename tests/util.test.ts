import { fileExists, hashString } from '../src/utils';

describe('hashString', () => {
  it('should return a string', () => {
    const stringToHash = 'Merry Christmas to all and to all a good night';
    const hash = hashString(stringToHash);

    expect(typeof hash).toBe('string');
  });

  it('should return the same hash for the same string', () => {
    const stringToHash = 'Merry Christmas to all and to all a good night';
    const hash1 = hashString(stringToHash);
    const hash2 = hashString(stringToHash);

    expect(hash1).toBe(hash2);
  });
});

describe('fileExists', () => {
  it('should return true for an existing file', async () => {
    const filePath = './package.json';
    const exists = await fileExists(filePath);

    expect(exists).toBe(true);
  });

  it('should return false for a non-existing file', async () => {
    const filePath = './non-existing-file.txt';
    const exists = await fileExists(filePath);

    expect(exists).toBe(false);
  });
});
