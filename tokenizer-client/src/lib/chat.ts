export type ChatMessage = { role: string; content: string; name: string };

/**
 * Render chat messages in the ChatML format the models see, so the token
 * count includes the per-message overhead.
 */
export function getChatGPTEncoding(messages: ChatMessage[], model: string) {
  const isGpt3 = model === "gpt-3.5-turbo";

  const msgSep = isGpt3 ? "\n" : "";
  const roleSep = isGpt3 ? "\n" : "<|im_sep|>";

  return [
    messages
      .map(({ name, role, content }) => {
        return `<|im_start|>${name || role}${roleSep}${content}<|im_end|>`;
      })
      .join(msgSep),
    `<|im_start|>assistant${roleSep}`,
  ].join(msgSep);
}
