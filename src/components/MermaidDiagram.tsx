/**
 * MermaidDiagram component for BlockNote rich editor.
 * Renders mermaid diagrams as SVG within BlockNote blocks.
 *
 * Adapted from Tolaria (github.com/refactoringhq/tolaria) for M3Flow.
 * Simplified: removed shadcn Dialog/Button, uses plain HTML lightbox.
 */

import { useEffect, useId, useMemo, useState } from 'react'

type MermaidApi = typeof import('mermaid')['default']

interface MermaidDiagramProps {
  diagram: string
  source: string
}

interface RenderState {
  diagram: string
  svg: string
  error: boolean
}

let renderQueue = Promise.resolve()
let initialized = false

function renderIdFromReactId(reactId: string): string {
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, '')
  return `m3flow-mermaid-${safeId || 'diagram'}`
}

function initializeMermaid(mermaid: MermaidApi) {
  if (initialized) return
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'dark',
    fontFamily: 'inherit',
  })
  initialized = true
}

async function renderMermaidDiagram({
  diagram,
  renderId,
}: {
  diagram: string
  renderId: string
}): Promise<string> {
  const render = async () => {
    const mermaid = (await import('mermaid')).default
    initializeMermaid(mermaid)
    const result = await mermaid.render(renderId, diagram)
    return result.svg
  }
  const nextRender = renderQueue.then(render, render)
  renderQueue = nextRender.then(() => undefined, () => undefined)
  return nextRender
}

export function MermaidDiagram({ diagram, source }: MermaidDiagramProps) {
  const reactId = useId()
  const renderId = useMemo(() => renderIdFromReactId(reactId), [reactId])
  const [state, setState] = useState<RenderState>({ diagram: '', svg: '', error: false })

  useEffect(() => {
    let active = true
    if (!diagram.trim()) return () => { active = false }

    renderMermaidDiagram({ diagram, renderId })
      .then((svg) => {
        if (active) setState({ diagram, svg, error: false })
      })
      .catch(() => {
        if (active) setState({ diagram, svg: '', error: true })
      })

    return () => { active = false }
  }, [diagram, renderId])

  const currentState = state.diagram === diagram ? state : { diagram, svg: '', error: false }
  if (!diagram.trim() || currentState.error) {
    return (
      <figure className="mermaid-diagram mermaid-diagram--error" style={{
        padding: '16px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px',
        border: '1px solid rgba(255,0,0,0.15)', margin: '8px 0'
      }}>
        <figcaption style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px' }}>Mermaid diagram unavailable</figcaption>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}><code>{source}</code></pre>
      </figure>
    )
  }

  return (
    <figure className="mermaid-diagram" style={{
      padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.08)', margin: '8px 0', overflow: 'auto'
    }}>
      <div
        aria-label="Mermaid diagram"
        role="img"
        tabIndex={0}
        dangerouslySetInnerHTML={{ __html: currentState.svg }}
        style={{ display: 'flex', justifyContent: 'center' }}
      />
    </figure>
  )
}
