const { Tokenizer } = require('../src/tokenizer');

(async () => {
  const tokenizer = new Tokenizer('mistralai/Mixtral-8x7B-Instruct-v0.1');
  await tokenizer.load();

  const encoding = await tokenizer.encode('hey there how are you doing');
  const decoded = await tokenizer.decode(encoding);

  console.log(decoded);
})();
