/**
 * Minimal Markdown → HTML converter for PDF reports.
 * Handles: ## headings, **bold**, *italic*, - bullet lists, numbered lists, blank line paragraphs.
 */
export function mdToHtml(md: string): string {
  if (!md) return ''

  const lines = md.split('\n')
  const out: string[] = []
  let inList = false
  let inOl = false

  const inline = (s: string) =>
    s
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')

  const closeList = () => {
    if (inList) { out.push('</ul>'); inList = false }
    if (inOl)   { out.push('</ol>'); inOl = false }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    // H2
    if (/^## /.test(line)) {
      closeList()
      out.push(`<h3 class="md-h2">${inline(line.replace(/^## /, ''))}</h3>`)
      continue
    }
    // H3
    if (/^### /.test(line)) {
      closeList()
      out.push(`<h4 class="md-h3">${inline(line.replace(/^### /, ''))}</h4>`)
      continue
    }
    // Bullet list
    if (/^[-*] /.test(line)) {
      if (inOl) { out.push('</ol>'); inOl = false }
      if (!inList) { out.push('<ul class="md-ul">'); inList = true }
      out.push(`<li>${inline(line.replace(/^[-*] /, ''))}</li>`)
      continue
    }
    // Numbered list
    if (/^\d+\. /.test(line)) {
      if (inList) { out.push('</ul>'); inList = false }
      if (!inOl) { out.push('<ol class="md-ol">'); inOl = true }
      out.push(`<li>${inline(line.replace(/^\d+\. /, ''))}</li>`)
      continue
    }
    // Blank line
    if (line.trim() === '') {
      closeList()
      out.push('<br>')
      continue
    }
    // Normal paragraph line
    closeList()
    out.push(`<p class="md-p">${inline(line)}</p>`)
  }

  closeList()
  return out.join('\n')
}

/** CSS to inject into PDF HTML <style> blocks */
export const mdCss = `
  .md-h2 { font-size: 11.5pt; font-weight: 800; color: #1e1b4b; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: 0.03em; border-left: 3px solid #6366f1; padding-left: 10px; }
  .md-h3 { font-size: 10.5pt; font-weight: 700; color: #334155; margin: 14px 0 6px; }
  .md-ul, .md-ol { margin: 6px 0 10px 20px; }
  .md-ul li, .md-ol li { margin-bottom: 4px; color: #475569; font-size: 9.5pt; line-height: 1.6; }
  .md-p { margin: 4px 0; color: #334155; font-size: 9.5pt; line-height: 1.7; }
`
