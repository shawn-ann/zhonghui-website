// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { SiteScripts } from '../SiteScripts'

afterEach(cleanup)

const click = (el: Element) => {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  return event
}

describe('preview link lock', () => {
  it('lets pagination links navigate but keeps the rest of the preview locked', () => {
    const { container } = render(
      <>
        <SiteScripts lockLinks />
        <a id="page-2" href="?page=2" data-preview-nav>2</a>
        <a id="site-nav" href="/about/">关于中惠</a>
      </>,
    )

    expect(click(container.querySelector('#page-2')!).defaultPrevented).toBe(false)
    expect(click(container.querySelector('#site-nav')!).defaultPrevented).toBe(true)
  })

  it('does not lock anything without lockLinks', () => {
    const { container } = render(
      <>
        <SiteScripts />
        <a id="site-nav" href="/about/">关于中惠</a>
      </>,
    )

    expect(click(container.querySelector('#site-nav')!).defaultPrevented).toBe(false)
  })
})
