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
    <main className="min-h-screen bg-[#F4F2EC] text-[#1B1D1C] px-6 py-16">
      <div className="max-w-3xl mx-auto">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#5A5F5C]
            hover:text-[#3C403E] transition-colors duration-200 mb-8"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
            bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-[#1F5C4A] text-xs font-medium mb-4">
            AURI Blog
          </div>
          <h1 className="font-heading text-4xl font-bold text-lp-ink tracking-tight mb-3">
            Career Resources
          </h1>
          <p className="text-[#3C403E] text-lg leading-relaxed">
            Career advice, job search tips, and product updates from the AURI team.
          </p>
        </div>

        {/* Post list */}
        {posts.length === 0 ? (
          <p className="text-[#5A5F5C] text-sm">No posts yet. Check back soon.</p>
        ) : (
          <ul className="space-y-5">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0
                    hover:border-lp-rule transition-colors duration-200">
                    <div className="rounded-[10px]  bg-[#FFFFFF] p-6">
                      <div>
                        <h2 className="font-heading text-xl font-semibold text-lp-ink
                          group-hover:text-[#1F5C4A] transition-colors duration-200 mb-2 leading-snug">
                          {post.title}
                        </h2>
                        <p className="text-[#3C403E] text-sm leading-relaxed mb-4">
                          {post.description}
                        </p>
                        {/* Tags */}
                        {post.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-0.5 rounded-full text-xs font-medium
                                  bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-[#1F5C4A]"
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
