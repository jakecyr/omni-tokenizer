const { listFiles, downloadFile } = require('@huggingface/hub');
const fs = require('fs/promises');
const crypto = require('crypto');
const { fileExists } = require('./utils');

const TOKENIZER_FILES = {
  'tokenizer.json': 1,
  'tokenizer_config.json': 1,
  'vocab.json': 1,
  'merges.txt': 1,
  'special_tokens_map.json': 1,
  'added_tokens.json': 1,
};

class Tokenizer {
  constructor(repoName, cacheFolderPath = './cache') {
    this.cacheFolderPath = cacheFolderPath;
    this.repoName = repoName;
    this.dirname = crypto.createHash('md5').update(repoName).digest('hex');
    this.dirpath = `./${this.cacheFolderPath}/${this.dirname}`;
    this.tokenizerSettings = null;
    this.vocab = null;
    this.reverseVocab = null;
  }

  async initializeFromHuggingFace() {
    await fs.mkdir(this.dirpath, { recursive: true });

    for await (const file of listFiles({
      repo: this.repoName,
    })) {
      if (file.path in TOKENIZER_FILES) {
        const downloadedFile = await (
          await downloadFile({
            repo: this.repoName,
            path: file.path,
          })
        )?.text();

        await fs.writeFile(`./${this.dirpath}/${file.path}`, downloadedFile);
      }
    }
  }

  async load() {
    if (!(await fileExists(this.dirpath))) {
      await this.initializeFromHuggingFace();
    }

    // Load tokenizer settings.
    this.tokenizerSettings = JSON.parse(
      await fs.readFile(`./${this.dirpath}/tokenizer.json`, 'utf8'),
    );

    // Load vocab
    this.vocab = this.tokenizerSettings.model.vocab;

    // Load merges
    this.merges = this.tokenizerSettings.model.merges.map((merge) => merge.split(' '));
    this.mergesMap = new Map(this.merges);

    // Load reverse vocab
    this.reverseVocab = Object.fromEntries(Object.entries(this.vocab).map(([k, v]) => [v, k]));
  }

  encode(text) {
    // Normalize text by replacing spaces with "▁" as per tokenizer configuration
    let normalizedText = text.replace(/ /g, '▁');

    // Initial tokenization: Instead of splitting into characters directly,
    // start with the normalized text which includes "▁" for spaces.
    let tokens = normalizedText.split('');

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

  decode(tokenIds) {
    // Convert token IDs back to tokens
    const tokens = tokenIds.map((id) => this.reverseVocab[id] || '<unk>');

    // Join tokens to form a single string
    let decodedText = tokens.join('');

    // Apply decoding steps as specified in tokenizer.json
    // Specifically, replace "▁" with a space
    decodedText = decodedText.replace(/▁/g, ' ');

    // Optional: Post-processing to clean up the text
    decodedText = decodedText.trim().replace(/\s+/g, ' ');

    return decodedText;
  }

  normalize(text, normalizerSettings) {
    // Apply each normalization step
    normalizerSettings.normalizers.forEach((normalizer) => {
      if (normalizer.type === 'Replace' && normalizer.pattern.String === ' ') {
        text = text.replace(new RegExp(' ', 'g'), normalizer.content);
      }
      // Implement other normalizers as needed
    });
    return text;
  }

  denormalize(text, decoderSettings) {
    // Apply each decoding step
    decoderSettings.decoders.forEach((decoder) => {
      if (decoder.type === 'Replace' && decoder.pattern.String === '▁') {
        text = text.replace(new RegExp('▁', 'g'), decoder.content);
      }
      // Implement other decoders as needed
    });
    return text;
  }
}

module.exports = {
  Tokenizer,
};
