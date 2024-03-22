import { Tokenizer } from '../src/tokenizer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

describe('Tokenizer', () => {
  describe('load', () => {
    it('creates a new directory for the model repo', async () => {
      const repoName = 'mistralai/Mixtral-8x7B-v0.1';
      const cacheFolder = './cache';
      const tokenizer = new Tokenizer(repoName, cacheFolder);
      const hash = crypto.createHash('md5').update(repoName).digest('hex');
      const localRepoPath = path.join(cacheFolder, hash);

      if (fs.existsSync(localRepoPath)) {
        fs.rmSync(localRepoPath, { recursive: true });
      }

      await tokenizer.load();

      expect(fs.existsSync(localRepoPath)).toBe(true);
    });

    it('saves the expected files', async () => {
      const repoName = 'mistralai/Mixtral-8x7B-v0.1';
      const cacheFolder = './cache';
      const tokenizer = new Tokenizer(repoName, cacheFolder);
      const hash = crypto.createHash('md5').update(repoName).digest('hex');
      const localRepoPath = path.join(cacheFolder, hash);

      if (fs.existsSync(localRepoPath)) {
        fs.rmSync(localRepoPath, { recursive: true });
      }

      await tokenizer.load();

      expect(fs.existsSync(path.join(localRepoPath, 'tokenizer.json'))).toBe(true);
      expect(fs.existsSync(path.join(localRepoPath, 'special_tokens_map.json'))).toBe(true);
      expect(fs.existsSync(path.join(localRepoPath, 'tokenizer_config.json'))).toBe(true);
    });
  });

  describe('encode', () => {
    it('should return a non-empty encoding of ints', async () => {
      const repoName = 'mistralai/Mixtral-8x7B-v0.1';
      const cacheFolder = './cache';
      const tokenizer = new Tokenizer(repoName, cacheFolder);
      await tokenizer.load();

      const text = 'I congratulate you all';
      const encoding = tokenizer.encode(text);

      expect(encoding.length).toBeGreaterThan(0);
      expect(encoding.every((token) => Number.isInteger(token))).toBeTruthy();
    });
  });

  describe('decode', () => {
    it('should return a string', async () => {
      const repoName = 'mistralai/Mixtral-8x7B-v0.1';
      const cacheFolder = './cache';
      const tokenizer = new Tokenizer(repoName, cacheFolder);

      await tokenizer.load();

      const text = 'Merry Christmas to all and to all a good night';
      const encoding = tokenizer.encode(text);
      const decoded = tokenizer.decode(encoding);

      expect(typeof decoded).toBe('string');
    });

    it('should decode to the original text', async () => {
      const repoName = 'mistralai/Mixtral-8x7B-v0.1';
      const cacheFolder = './cache';
      const tokenizer = new Tokenizer(repoName, cacheFolder);

      await tokenizer.load();

      const text = 'Merry Christmas to all and to all a good night';
      const encoding = tokenizer.encode(text);
      const decoded = tokenizer.decode(encoding);

      expect(decoded).toBe(text);
    });
  });
});
