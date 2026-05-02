/**
 * RichEditor — BlockNote WYSIWYG editor for M3Flow.
 * Replaces both CodeMirror and Preview panels when active.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import 'katex/dist/katex.min.css'
import { schema } from './editorSchema.tsx'
import { markdownToBlocks, blocksToMarkdown } from '../lib/editor-sync.ts'
import { THEMES } from '../themes'

interface RichEditorProps {
  content: string
  onChange: (markdown: string) => void
  fontSize: number
  themeName: string
}

const RichEditor = ({ content, onChange, fontSize, themeName }: RichEditorProps) => {
  const isInitialLoad = useRef(true)
  const lastSyncedContent = useRef(content)

  const editor = useCreateBlockNote({
    schema,
  })

  // Load markdown content into BlockNote on mount or when content changes externally
  useEffect(() => {
    const loadContent = async () => {
      if (!content && !isInitialLoad.current) return

      // Only reload if content changed externally (not from our own onChange)
      if (content === lastSyncedContent.current && !isInitialLoad.current) return

      try {
        const blocks = await markdownToBlocks(editor, content || '')
        editor.replaceBlocks(editor.document, blocks as any)
        lastSyncedContent.current = content
        isInitialLoad.current = false
      } catch (err) {
        console.error('[RichEditor] Failed to parse markdown:', err)
      }
    }

    loadContent()
  }, [content, editor])

  // Handle changes from BlockNote → serialize to Markdown
  const handleChange = useCallback(() => {
    try {
      const markdown = blocksToMarkdown(editor)
      lastSyncedContent.current = markdown
      onChange(markdown)
    } catch (err) {
      console.error('[RichEditor] Failed to serialize blocks:', err)
    }
  }, [editor, onChange])

  const isDark = (THEMES[themeName]?.isDark) !== false

  return (
    <div
      className="rich-editor-wrapper"
      style={{
        flex: 1,
        overflow: 'auto',
        fontSize: `${fontSize}px`,
        height: '100%',
      }}
    >
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme={isDark ? 'dark' : 'light'}
        data-theming-css-variables-demo
      />
    </div>
  )
}

export default RichEditor
