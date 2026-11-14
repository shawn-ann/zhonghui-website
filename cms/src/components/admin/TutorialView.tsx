import React from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { loadTutorialChapters } from '../../lib/tutorial'
import './tutorial.css'

export default async function TutorialView() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    redirect('/admin/login?redirect=%2Fadmin%2Ftutorial')
  }

  const chapters = loadTutorialChapters()

  return (
    <div className="tutorial-page">
      <aside className="tutorial-nav">
        <a className="tutorial-back" href="/admin/collections/pages">← 返回后台</a>
        <div className="tutorial-nav-label">使用教程</div>
        {chapters.map((chapter) => (
          <a href={`#${chapter.id}`} key={chapter.id}>
            {chapter.title}
          </a>
        ))}
      </aside>

      <main className="tutorial-content">
        {chapters.map((chapter) => (
          <section
            className="tutorial-section"
            id={chapter.id}
            key={chapter.id}
            dangerouslySetInnerHTML={{ __html: chapter.html }}
          />
        ))}
      </main>
    </div>
  )
}
