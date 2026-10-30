import { renderToStaticMarkup } from 'react-dom/server'
import type { PageDoc, SiteConfig } from './types'
import { SiteDocument, type SiteAssets } from '../site/SiteDocument'

export type DocumentAssets = SiteAssets
export { PREVIEW_LOCK_LINKS } from '../site/SiteDocument'

export function renderDocument(page: PageDoc, assets: DocumentAssets, site?: SiteConfig): string {
  return `<!DOCTYPE html>\n${renderToStaticMarkup(<SiteDocument page={page} site={site} assets={assets} />)}`
}
