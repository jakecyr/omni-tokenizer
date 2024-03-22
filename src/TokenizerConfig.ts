export interface TokenDecoder {
  content: string;
  lstrip: boolean;
  normalized: boolean;
  rstrip: boolean;
  single_word: boolean;
  special: boolean;
}

export interface TokenizerConfig {
  add_bos_token: boolean;
  add_eos_token: boolean;
  added_tokens_decoder: Record<string, TokenDecoder>;
  additional_special_tokens: unknown[];
  bos_token: string;
  clean_up_tokenization_spaces: boolean;
  eos_token: string;
  legacy: boolean;
  model_max_length: number;
  pad_token: unknown;
  sp_model_kwargs: Record<string, unknown>;
  spaces_between_special_tokens: boolean;
  tokenizer_class: string;
  unk_token: string;
  use_default_system_prompt: boolean;
  chat_template: string;
}
