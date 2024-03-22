# Omni Tokenizers

A Node based tokenizer for open source models hosted on HuggingFace.

## Installation

```bash
npm install omni-tokenizer
```

## Usage

```js
const { Tokenizer } = require('../src/tokenizer');

const tokenizer = new Tokenizer('mistralai/Mixtral-8x7B-Instruct-v0.1');

// Load tokenizer files from HuggingFace.
await tokenizer.load();

const encoding = await tokenizer.encode('hey there how are you doing');
const decoded = await tokenizer.decode(encoding);

console.log(decoded); // 'hey there how are you doing'
```
