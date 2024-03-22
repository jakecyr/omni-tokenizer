import { listFiles, downloadFile } from '@huggingface/hub';
import fs from 'fs/promises';
import crypto from 'crypto';
import { fileExists } from './utils';
import path from 'path';
import { TokenizerConfig } from './TokenizerConfig';

const TOKENIZER_FILES = {
  'tokenizer.json': 1,
  'tokenizer_config.json': 1,
  'vocab.json': 1,
  'merges.txt': 1,
  'special_tokens_map.json': 1,
  'added_tokens.json': 1,
};

export class Tokenizer {
  cacheFolderPath: string;
  repoName: string;
  dirName: string;
  dirPath: string;
  tokenizerSettings: Record<string, any>;
  tokenizerConfig: TokenizerConfig;
  vocab: Record<string, number>;
  reverseVocab: Record<number, string>;
  mergesMap: Map<string, string>;

  constructor(repoName: string, cacheFolderPath: string = './cache') {
    this.cacheFolderPath = cacheFolderPath;
    this.repoName = repoName;
    this.dirName = crypto.createHash('md5').update(repoName).digest('hex');
    this.dirPath = path.join(this.cacheFolderPath, this.dirName);
    this.tokenizerSettings = null;
    this.vocab = null;
    this.reverseVocab = null;
  }

  async initializeFromHuggingFace(accessToken?: string): Promise<void> {
    await fs.mkdir(this.dirPath, { recursive: true });

    for await (const file of listFiles({
      repo: this.repoName,
      credentials: { accessToken },
    })) {
      if (file.path in TOKENIZER_FILES) {
        const downloadedFile = await (
          await downloadFile({
            repo: this.repoName,
            path: file.path,
            credentials: { accessToken },
          })
        )?.text();

        await fs.writeFile(path.join(this.dirPath, file.path), downloadedFile);
      }
    }
  }

  async load(accessToken = null): Promise<void> {
    if (!(await fileExists(this.dirPath))) {
      await this.initializeFromHuggingFace(accessToken);
    }

    // Load tokenizer settings.
    this.tokenizerSettings = JSON.parse(
      await fs.readFile(path.join(this.dirPath, 'tokenizer.json'), 'utf8'),
    );

    // Load tokenizer config file.
    this.tokenizerConfig = JSON.parse(
      await fs.readFile(path.join(this.dirPath, 'tokenizer_config.json'), 'utf8'),
    );

    // Load vocab
    this.vocab = this.tokenizerSettings.model.vocab;

    // Load merges
    const merges = this.tokenizerSettings.model.merges.map((merge) => merge.split(' '));
    this.mergesMap = new Map(merges);

    // Load reverse vocab
    this.reverseVocab = Object.fromEntries(Object.entries(this.vocab).map(([k, v]) => [v, k]));
  }

  encode(text: string): number[] {
    const bosToken = this.tokenizerSettings.add_bos_token
      ? this.tokenizerConfig.bos_token || '<s>'
      : '';
    const eosToken = this.tokenizerSettings.add_eos_token
      ? this.tokenizerConfig.eos_token || '</s>'
      : '';

    text = bosToken + text + eosToken;

    // Normalize text by replacing spaces with "▁" as per tokenizer configuration
    const normalizedText = text.replace(/ /g, '▁');

    // Initial tokenization: Instead of splitting into characters directly,
    // start with the normalized text which includes "▁" for spaces.
    const tokens = normalizedText.split('');

    // Apply merges based on the mergesMap
    let canMerge = true;
    while (canMerge) {
      canMerge = false;
      for (let i = 0; i < tokens.length - 1; i++) {
        // Generate merge candidates based on the current and next token.
        // This now respects the "▁" character used for spaces.
        const mergeCandidate = tokens[i] + tokens[i + 1];

        // Check if this mergeCandidate exists in our merges map.
        // Since we're directly concatenating tokens[i] and tokens[i + 1],
        // there's no need to insert a space between them in this lookup.
        if (this.mergesMap.has(mergeCandidate)) {
          // Perform the merge by replacing the two tokens with their merged form
          tokens.splice(i, 2, mergeCandidate);
          canMerge = true; // Allow the process to continue
          break; // Exit the loop to start the merge process from the beginning
        }
      }
    }

    // Convert tokens to IDs, handling unknown tokens with '<unk>'
    return tokens.map((token) => this.vocab[token] || this.vocab['<unk>']);
  }

  decode(tokenIds: number[]): string {
    // Convert token IDs back to tokens
    const tokens = tokenIds.map((id) => this.reverseVocab[id] || '<unk>');

    // Initialize an array to accumulate the decoded tokens
    const decodedTokens = [];

    tokens.forEach((token) => {
      if (token === '<unk>') {
        // Handle unknown tokens. You can choose to ignore, replace with a placeholder, or keep as is.
        decodedTokens.push('UNKNOWN');
      } else if (token !== '<s>' && token !== '</s>') {
        // Ignore start and end tokens in the decoded text, or handle them according to your needs.
        // If you decide to keep <s> and </s> tokens for any reason, just remove or adjust this condition.
        decodedTokens.push(token);
      }
      // Note: If there are other special tokens you wish to handle differently, add conditions here.
    });

    // Join the processed tokens into a single string
    let decodedText = decodedTokens.join('');

    // Replace "▁" with a space as part of the decoding process
    decodedText = decodedText.replace(/▁/g, ' ');

    // Optional: Post-processing to clean up the text
    // This includes trimming whitespace from the start and end of the text,
    // and replacing instances of multiple spaces with a single space.
    decodedText = decodedText.trim().replace(/\s+/g, ' ');

    return decodedText;
  }
}
