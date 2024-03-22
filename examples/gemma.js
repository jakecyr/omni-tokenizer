const { Tokenizer } = require('../src/tokenizer');

(async () => {
  const tokenizer = new Tokenizer('google/gemma-2b');

  await tokenizer.load(process.env.ACCESS_TOKEN);

  const text = `I congratulate you all--not merely on your electoral victory but on your selected role in history. For you and I are privileged to serve the great Republic in what could be the most decisive decade in its long history. The choices we make, for good or ill, may well shape the state of the Union for generations yet to come.`;
  const encoding = tokenizer.encode(text);

  console.log(encoding.length);

  const decoded = tokenizer.decode(encoding);

  console.log(decoded);
})();
