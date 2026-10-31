// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MediaModal from '../MediaModal'

vi.mock('../api', () => ({
  listMedia: vi.fn(async () => [
    { id: 1, url: '/a.jpg', alt: 'A' },
    { id: 2, url: '/b.jpg', alt: 'B' },
    { id: 3, url: '/c.jpg', alt: 'C' },
  ]),
  uploadMedia: vi.fn(),
}))

function imageButton(name: string) {
  return screen.getByAltText(name).closest('button') as HTMLButtonElement
}

describe('MediaModal', () => {
  it('preselects initial images and confirms in selection order', async () => {
    const onSelectMany = vi.fn()
    render(
      <MediaModal
        multiple
        title="编辑图集"
        initialImages={[{ src: '/b.jpg', alt: 'B' }]}
        confirmVerb="更新"
        onSelectMany={onSelectMany}
        onClose={() => {}}
      />,
    )

    await waitFor(() => expect(screen.getByAltText('A')).toBeTruthy())
    expect(screen.getAllByAltText('B')).toHaveLength(1)
    expect(imageButton('B').className).toContain('is-selected')
    expect(screen.getByText('更新 1 张')).toBeTruthy()

    fireEvent.click(imageButton('C'))
    expect(screen.getByText('更新 2 张')).toBeTruthy()
    fireEvent.click(screen.getByText('更新 2 张'))

    expect(onSelectMany).toHaveBeenCalledWith([
      expect.objectContaining({ url: '/b.jpg' }),
      expect.objectContaining({ url: '/c.jpg' }),
    ])
  })

  it('keeps initial images that are missing from the media library', async () => {
    render(
      <MediaModal
        multiple
        initialImages={[{ src: '/old.jpg', alt: 'Old' }]}
        confirmVerb="更新"
        onSelectMany={() => {}}
        onClose={() => {}}
      />,
    )

    await waitFor(() => expect(screen.getByAltText('A')).toBeTruthy())
    expect(screen.getByAltText('Old')).toBeTruthy()
    expect(screen.getByText('更新 1 张')).toBeTruthy()
  })

  it('highlights the current image in single mode and selects a replacement', async () => {
    const onSelect = vi.fn()
    render(
      <MediaModal
        initialImages={[{ src: '/a.jpg', alt: 'A' }]}
        onSelect={onSelect}
        onClose={() => {}}
      />,
    )

    await waitFor(() => expect(imageButton('A').className).toContain('is-selected'))
    fireEvent.click(imageButton('B'))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ url: '/b.jpg' }))
  })
})
