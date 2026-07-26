import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'g', 'defs', 'marker', 'foreignObject', 'style'],
    ADD_ATTR: ['viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'transform', 'text-anchor', 'dominant-baseline', 'font-size', 'font-family', 'class', 'id', 'marker-end', 'refX', 'refY', 'orient', 'markerWidth', 'markerHeight', 'points'],
    ALLOW_DATA_ATTR: true,
  });
}
