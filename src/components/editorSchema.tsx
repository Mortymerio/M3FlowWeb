/**
 * BlockNote editor schema for M3Flow.
 * Defines custom block types: Mermaid diagrams, LaTeX math (inline + block).
 *
 * Adapted from Tolaria's editorSchema.tsx, simplified (no WikiLinks).
 */

import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
} from '@blocknote/core'
import { createReactBlockSpec, createReactInlineContentSpec } from '@blocknote/react'
import { MATH_BLOCK_TYPE, MATH_INLINE_TYPE, renderMathToHtml } from '../lib/math-markdown.ts'
import { MERMAID_BLOCK_TYPE, mermaidFenceSource } from '../lib/mermaid-markdown.ts'
import { MermaidDiagram } from './MermaidDiagram.tsx'

// --- Math Rendering ---

function MathRender({ latex, displayMode }: { latex: string; displayMode: boolean }) {
  return (
    <span
      aria-label={`Math: ${latex}`}
      className={displayMode ? 'math math--block' : 'math math--inline'}
      data-latex={latex}
      role="img"
      title={displayMode ? `$$\n${latex}\n$$` : `$${latex}$`}
      dangerouslySetInnerHTML={{ __html: renderMathToHtml({ latex, displayMode }) }}
    />
  )
}

export const MathInline = createReactInlineContentSpec(
  {
    type: MATH_INLINE_TYPE,
    propSchema: {
      latex: { default: '' },
    },
    content: 'none',
  },
  {
    render: (props) => (
      <MathRender latex={props.inlineContent.props.latex} displayMode={false} />
    ),
  },
)

const MathBlock = createReactBlockSpec(
  {
    type: MATH_BLOCK_TYPE,
    propSchema: {
      latex: { default: '' },
    },
    content: 'none',
  },
  {
    render: (props) => (
      <div className="math-block-shell" style={{ margin: '16px 0', textAlign: 'center' }}>
        <MathRender latex={props.block.props.latex} displayMode />
      </div>
    ),
  },
)

// --- Mermaid Block ---

function readCodeElementLanguage(code: Element): string | null {
  const language = code.getAttribute('data-language')
    ?? Array.from(code.classList)
      .find(className => className.startsWith('language-'))
      ?.replace(/^language-/u, '')
  if (!language) return null
  return language.trim().split(/\s+/u)[0]?.toLowerCase() ?? null
}

function readMermaidPreElement(element: HTMLElement): { source: string; diagram: string } | undefined {
  if (element.tagName !== 'PRE') return undefined
  if (element.childElementCount !== 1 || element.firstElementChild?.tagName !== 'CODE') return undefined

  const code = element.firstElementChild
  if (readCodeElementLanguage(code) !== 'mermaid') return undefined

  const diagram = code.textContent?.endsWith('\n')
    ? code.textContent
    : `${code.textContent ?? ''}\n`
  return {
    diagram,
    source: mermaidFenceSource({ diagram }),
  }
}

const MermaidBlock = createReactBlockSpec(
  {
    type: MERMAID_BLOCK_TYPE,
    propSchema: {
      source: { default: '' },
      diagram: { default: '' },
    },
    content: 'none',
  },
  {
    runsBefore: ['codeBlock'],
    parse: readMermaidPreElement,
    render: (props) => (
      <MermaidDiagram
        diagram={props.block.props.diagram}
        source={props.block.props.source}
      />
    ),
  },
)

// --- Schema Assembly ---

const mathBlock = MathBlock()
const mermaidBlock = MermaidBlock()

export const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mathInline: MathInline,
  },
}).extend({
  blockSpecs: {
    mathBlock,
    mermaidBlock,
  },
})
