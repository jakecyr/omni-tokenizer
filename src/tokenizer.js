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
    // Initial tokenization: split the text into characters
    let tokens = text
      .split(' ')
      .map((word) => word.split(''))
      .flat();

    // Convert characters to tokens based on the vocab
    tokens = tokens.map((char) => (this.vocab[char] ? char : '<unk>'));

    // Apply merges
    let canMerge = true;
    while (canMerge) {
      canMerge = false;
      for (let i = 0; i < tokens.length - 1; i++) {
        const mergeCandidate = tokens[i] + ' ' + tokens[i + 1];
        if (this.mergesMap.has(mergeCandidate)) {
          tokens.splice(i, 2, tokens[i] + tokens[i + 1]);
          canMerge = true;
          break; // Start over after each merge
        }
      }
    }

    // Convert tokens to IDs
    return tokens.map((token) => this.vocab[token] || this.vocab['<unk>']);
  }

  async decode(tokenIds) {
    // Convert token IDs back to tokens
    const tokens = tokenIds.map(id => this.reverseVocab[id] || '<unk>');
  
    // Simple approach to improve readability by removing unnecessary spaces
    // Note: This does not accurately reverse BPE merges
    let text = tokens.join('');
    text = text.replace(/<unk>/g, ' '); // Replace <unk> with space for readability
    // Further processing could be added here to handle other special tokens and formatting
  
    return text;
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
