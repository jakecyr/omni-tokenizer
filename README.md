# Omni Tokenizers

A Node based tokenizer for open source models hosted on HuggingFace.

Specify the model repo and the tokenizer configuration files will be automatically downloaded from HuggingFace and used to encode provided text.

**This has only been tested on Mixtral, Mistral, and Gemma models!! Please submit issues if you encounter problems with other models or feel free to contribute.**

## Installation

```bash
npm install omni-tokenizer
```

## Usage

```ts
const { Tokenizer } = require('../src/tokenizer');

const tokenizer = new Tokenizer('mistralai/Mixtral-8x7B-Instruct-v0.1');

// Load tokenizer files from HuggingFace.
await tokenizer.load();

const text = 'hey there how are you doing';
const encoding: number[] = await tokenizer.encode(text);

console.log('Token Count', encoding.length);

const decoded: string = await tokenizer.decode(encoding);

console.log(decoded); // 'hey there how are you doing'
```
