/**
 * Synchronization layer between Markdown (raw) and BlockNote (rich) editors.
 * Simplified version of Tolaria's editorRawModeSync.ts for M3Flow.
 *
 * M3Flow doesn't use frontmatter YAML or wikilinks, so this is much simpler.
 */

import type { useCreateBlockNote } from '@blocknote/react'
import { compactMarkdown } from './compact-markdown.ts'
import { serializeMermaidAwareBlocks } from './mermaid-markdown.ts'
import { preProcessMathMarkdown } from './math-markdown.ts'
import { preProcessMermaidMarkdown, injectMermaidInBlocks } from './mermaid-markdown.ts'
import { injectMathInBlocks } from './math-markdown.ts'

type BlockNoteEditor = ReturnType<typeof useCreateBlockNote>

/**
 * Convert Markdown string → BlockNote blocks (for loading into rich editor).
 * Pre-processes mermaid and math tokens so BlockNote can parse them as custom blocks.
 */
export async function markdownToBlocks(editor: BlockNoteEditor, markdown: string): Promise<unknown[]> {
  // Pre-process: replace mermaid fences and math delimiters with tokens
  const preprocessed = preProcessMermaidMarkdown({
    markdown: preProcessMathMarkdown({ markdown })
  })

  // Let BlockNote parse the preprocessed markdown
  const blocks = await editor.tryParseMarkdownToBlocks(preprocessed)

  // Post-process: convert token paragraphs into custom block types
  const withMermaid = injectMermaidInBlocks(blocks)
  const withMath = injectMathInBlocks(withMermaid)

  return withMath
}

/**
 * Convert BlockNote blocks → Markdown string (for saving to DB / switching to raw).
 * Serializes custom blocks (mermaid, math) back to standard Markdown fences.
 */
export function blocksToMarkdown(editor: BlockNoteEditor): string {
  const blocks = editor.document
  return compactMarkdown(serializeMermaidAwareBlocks(editor, blocks))
}
