import { Router, Request, Response } from 'express'
import { getLegalContent } from './legal'
import { ALMA_LOGO_DATA_URI } from '../lib/logo'

const router = Router()

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderPage(opts: {
  title: string
  updatedAt: Date | null
  sections: { title: string; body: string }[]
  otherHref: string
  otherLabel: string
}): string {
  const { title, updatedAt, sections, otherHref, otherLabel } = opts

  const updatedLine = updatedAt
    ? `Last updated ${new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
    : ''

  const sectionsHtml = sections
    .map(
      (s) => `
      <section class="section">
        <h2>${escapeHtml(s.title)}</h2>
        <p>${escapeHtml(s.body).replace(/\n/g, '<br />')}</p>
      </section>`
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ALMA — ${escapeHtml(title)}</title>
<style>
  :root {
    color-scheme: light;
    --bg: #ffffff;
    --fg: #1a1a2e;
    --muted: #6b7280;
    --accent: #093373;
    --border: #e5e7eb;
    --card: #f9fafb;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
  }
  header {
    padding: 2.5rem 1.5rem 1.5rem;
    max-width: 720px;
    margin: 0 auto;
    border-bottom: 1px solid var(--border);
  }
  .logo {
    height: 36px;
    aspect-ratio: 958 / 206;
    display: block;
    background-color: var(--accent);
    -webkit-mask-image: url('${ALMA_LOGO_DATA_URI}');
    mask-image: url('${ALMA_LOGO_DATA_URI}');
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-position: left center;
    mask-position: left center;
  }
  h1 {
    font-size: 1.75rem;
    margin: 0.75rem 0 0.25rem;
  }
  .updated {
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0;
  }
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.5rem 1.5rem 3rem;
  }
  .section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
  }
  .section h2 {
    font-size: 1.05rem;
    margin: 0 0 0.5rem;
  }
  .section p {
    margin: 0;
    color: var(--fg);
    font-size: 0.95rem;
    word-wrap: break-word;
  }
  .switch {
    margin-top: 1rem;
    font-size: 0.9rem;
  }
  .switch a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
  }
  .switch a:hover { text-decoration: underline; }
</style>
</head>
<body>
  <header>
    <div class="logo" role="img" aria-label="ALMA"></div>
    <h1>${escapeHtml(title)}</h1>
    ${updatedLine ? `<p class="updated">${escapeHtml(updatedLine)}</p>` : ''}
    <div class="switch"><a href="${otherHref}">${escapeHtml(otherLabel)} →</a></div>
  </header>
  <main>
    ${sectionsHtml}
  </main>
</body>
</html>`
}

router.get('/terms', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { terms } = await getLegalContent()
    res.type('html').send(
      renderPage({
        title: 'Terms of Use',
        updatedAt: terms.updatedAt,
        sections: terms.sections,
        otherHref: '/legal/privacy',
        otherLabel: 'Privacy Policy',
      })
    )
  } catch (err) {
    console.error(err)
    res.status(500).type('html').send('<p>Something went wrong. Please try again later.</p>')
  }
})

router.get('/privacy', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { privacy } = await getLegalContent()
    res.type('html').send(
      renderPage({
        title: 'Privacy Policy',
        updatedAt: privacy.updatedAt,
        sections: privacy.sections,
        otherHref: '/legal/terms',
        otherLabel: 'Terms of Use',
      })
    )
  } catch (err) {
    console.error(err)
    res.status(500).type('html').send('<p>Something went wrong. Please try again later.</p>')
  }
})

export default router
