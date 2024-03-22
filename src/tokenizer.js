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

    // Load reverse vocab
    this.reverseVocab = Object.fromEntries(Object.entries(this.vocab).map(([k, v]) => [v, k]));
  }

  async encode(text) {
    // Normalize text
    text = this.normalize(text, this.tokenizerSettings['normalizer']);

    // Simplified tokenization (a full BPE implementation would be required for a complete solution)
    const tokens = text.split(' '); // This is a placeholder

    // Apply post-processing (simplified version)
    text = `<s> ${tokens.join(' ')} </s>`;

    // Convert tokens to IDs (this requires a full BPE implementation and vocab mapping)
    return tokens.map((token) => this.vocab[token] || this.vocab['<unk>']); // Placeholder for actual token to ID conversion
  }

  async decode(tokenIds) {
    // Convert token IDs to tokens
    const text = tokenIds.map((id) => this.reverseVocab[id] || '<unk>').join(' '); // Placeholder

    // Normalize text (simplified)
    return this.denormalize(text, this.tokenizerSettings['decoder']);
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
