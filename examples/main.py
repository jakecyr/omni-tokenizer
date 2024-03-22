from transformers import AutoTokenizer

model_id = "mistralai/Mixtral-8x7B-Instruct-v0.1"
tokenizer = AutoTokenizer.from_pretrained(model_id)

text = """I congratulate you all--not merely on your electoral victory but on your selected role in history. For you and I are privileged to serve the great Republic in what could be the most decisive decade in its long history. The choices we make, for good or ill, may well shape the state of the Union for generations yet to come."""
inputs = tokenizer.encode(text)

print(len(inputs))
print(inputs)
