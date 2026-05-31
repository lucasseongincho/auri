import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: { absolute: 'Blog — AURI' },
  description: 'Career advice, resume tips, and job search strategies from the AURI team.',
  openGraph: {
    title: 'Blog — AURI',
    description: 'Career advice, resume tips, and job search strategies from the AURI team.',
    type: 'website',
    url: 'https://www.auri-resume.com/blog',
  },
  alternates: {
    canonical: 'https://www.auri-resume.com/blog',
  },
}


export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-[#F8F8FF] px-6 py-16">
      <div className="max-w-3xl mx-auto">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#60607A]
            hover:text-[#A0A0B8] transition-colors duration-200 mb-8"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
            bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#818CF8] text-xs font-medium mb-4">
            AURI Blog
          </div>
          <h1 className="font-heading text-4xl font-bold text-white tracking-tight mb-3">
            Career Resources
          </h1>
          <p className="text-[#A0A0B8] text-lg leading-relaxed">
            Career advice, job search tips, and product updates from the AURI team.
          </p>
        </div>

        {/* Post list */}
        {posts.length === 0 ? (
          <p className="text-[#60607A] text-sm">No posts yet. Check back soon.</p>
        ) : (
          <ul className="space-y-5">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1
                    hover:border-white/[0.15] transition-colors duration-200">
                    <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
                      <div>
                        <h2 className="font-heading text-xl font-semibold text-white
                          group-hover:text-[#818CF8] transition-colors duration-200 mb-2 leading-snug">
                          {post.title}
                        </h2>
                        <p className="text-[#A0A0B8] text-sm leading-relaxed mb-4">
                          {post.description}
                        </p>
                        {/* Tags */}
                        {post.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-0.5 rounded-full text-xs font-medium
                                  bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#818CF8]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
