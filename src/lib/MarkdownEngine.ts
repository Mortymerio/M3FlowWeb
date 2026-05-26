import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// Singleton instance to prevent re-initialization on every render
export const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) { }
    }
    return '';
  }
});

mdParser.renderer.rules.fence = (tokens: any[], idx: number, options: any, _env: any, _slf: any) => {
  const token = tokens[idx];
  const code = token.content.trim();
  if (token.info === 'mermaid') {
    const escapedCode = mdParser.utils.escapeHtml(code);
    return `<div class="mermaid" data-mermaid-src="${escapedCode}">${escapedCode}</div>`;
  }
  if (token.info) {
    const highlightedText = options.highlight?.(code, token.info, '') || mdParser.utils.escapeHtml(code);
    return `<pre><code class="hljs language-${token.info}">${highlightedText}</code></pre>`;
  }
  return `<pre><code class="hljs">${mdParser.utils.escapeHtml(code)}</code></pre>`;
};
