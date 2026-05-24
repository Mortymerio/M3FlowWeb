import { getEngine } from '../lib/webllm';
import { useStore } from '../store';

export interface AiRequestOptions {
  instruction: string;
  documentContext: string;
  notebookSystemPrompt?: string;
  vaultContext?: string;
  signal?: AbortSignal;
}

export async function executeAiPrompt(options: AiRequestOptions): Promise<string> {
  const state = useStore.getState();
  const { activeAiProvider, ollamaUrl, ollamaModel, openAiKey, lmStudioUrl, githubToken, azureUrl, azureKey, geminiKey, geminiModel, geminiApiVersion, claudeKey } = state;
  const { instruction, documentContext, notebookSystemPrompt, vaultContext, signal } = options;

  const now = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const baseSystemMessage = `You are an expert writing assistant and ghostwriter embedded in M3Flow, a Markdown knowledge vault. ${notebookSystemPrompt ? `Notebook context: ${notebookSystemPrompt}` : ''}
Current date: ${now}.

Important: Always write documents in fluent, natural language. Use Markdown formatting (headers, lists, bold, tables, blockquotes) to make content clear and beautiful.
CRITICAL RULE: NEVER modify, rewrite, or reformat any \`\`\`mermaid code blocks. Preserve every mermaid diagram EXACTLY as written in the original document, character by character. Only transform the surrounding prose and text content.`;

  const fullPromptContext = `Instruction: ${instruction}\n\nDocument Context:\n${documentContext}${vaultContext ? `\n\nVault Context:\n${vaultContext}` : ''}`;

  if (activeAiProvider === 'webllm') {
    const engine = getEngine();
    if (!engine) throw new Error("WebLLM Engine is not loaded.");
    const reply = await engine.chat.completions.create({
      messages: [
        { role: "system", content: baseSystemMessage },
        { role: "user", content: fullPromptContext }
      ]
    });
    return reply.choices[0]?.message.content || '';
  } else if (activeAiProvider === 'ollama') {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel || "llama3",
        system: baseSystemMessage,
        prompt: fullPromptContext,
        stream: false
      }),
      signal
    });
    const data = await res.json();
    return data.response;
  } else if (activeAiProvider === 'openai' || activeAiProvider === 'lmstudio' || activeAiProvider === 'github' || activeAiProvider === 'azure') {
    const isLocal = activeAiProvider === 'lmstudio';
    const isGithub = activeAiProvider === 'github';
    const isAzure = activeAiProvider === 'azure';

    let url = 'https://api.openai.com/v1/chat/completions';
    if (isLocal) url = `${lmStudioUrl}/v1/chat/completions`;
    if (isGithub) url = 'https://models.inference.ai.azure.com/chat/completions';
    if (isAzure) url = azureUrl;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isAzure) {
      headers['api-key'] = azureKey;
    } else {
      let token = openAiKey;
      if (isLocal) token = 'lm-studio';
      if (isGithub) token = githubToken;
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: isLocal ? "local-model" : "gpt-4o",
        messages: [
          { role: "system", content: baseSystemMessage },
          { role: "user", content: fullPromptContext }
        ]
      }),
      signal
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'API Error');
    return data.choices?.[0]?.message?.content || '';
  } else if (activeAiProvider === 'gemini') {
    const isBeta = geminiApiVersion === 'v1beta';
    const payload: any = {
      contents: [{
        parts: [{
          text: isBeta
            ? fullPromptContext
            : `System: ${baseSystemMessage}\n\n${fullPromptContext}`
        }]
      }]
    };

    if (isBeta) {
      payload.system_instruction = { parts: [{ text: baseSystemMessage }] };
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/${geminiApiVersion || 'v1'}/models/${geminiModel || 'gemini-3.1-pro'}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Gemini API Error');

    if (data.candidates && data.candidates.length > 0) {
      const cand = data.candidates[0];
      if (cand.content?.parts?.[0]?.text) {
        return cand.content.parts[0].text;
      } else if (cand.finishReason && cand.finishReason !== 'STOP') {
        throw new Error(`Gemini blocked response. Reason: ${cand.finishReason}`);
      }
    }
    return '';
  } else if (activeAiProvider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: baseSystemMessage,
        messages: [
          { role: 'user', content: fullPromptContext }
        ]
      }),
      signal
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Claude API Error');
    return data.content?.[0]?.text || '';
  }

  throw new Error(`Unsupported AI Provider: ${activeAiProvider}`);
}
