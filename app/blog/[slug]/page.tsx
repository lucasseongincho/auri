import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug } from '@/lib/blog'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: `${post.title} — AURI Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-[#F8F8FF] px-6 py-16">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <a
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-[#60607A]
            hover:text-[#A0A0B8] transition-colors mb-10"
        >
          ← All posts
        </a>

        {/* Post header */}
        <header className="mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white
            tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <time dateTime={post.date} className="text-sm text-[#60607A]">
              {formatDate(post.date)}
            </time>
            {post.tags?.length > 0 && (
              <>
                <span className="text-[#3A3A4A]">·</span>
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
              </>
            )}
          </div>
        </header>

        {/* MDX content */}
        <div className="prose prose-invert prose-headings:font-heading prose-headings:font-bold
          prose-h2:text-xl prose-h3:text-lg
          prose-p:text-[#A0A0B8] prose-p:leading-relaxed
          prose-a:text-[#818CF8] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white prose-strong:font-semibold
          prose-li:text-[#A0A0B8]
          prose-ul:my-4 prose-ol:my-4
          prose-hr:border-white/10
          prose-code:text-[#818CF8] prose-code:bg-[#1C1C26] prose-code:px-1.5
          prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
          prose-pre:bg-[#13131A] prose-pre:border prose-pre:border-white/[0.08]
          prose-pre:rounded-xl
          max-w-none">
          <MDXRemote source={post.content} />
        </div>

        {/* Footer CTA */}
        <div className="mt-16 rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8 text-center">
            <h3 className="font-heading text-lg font-semibold text-white mb-2">
              Ready to fix your resume?
            </h3>
            <p className="text-[#A0A0B8] text-sm mb-5">
              AURI rewrites your resume with AI, optimizes it for ATS, and helps you land more interviews.
            </p>
            <a
              href="/dashboard/resume"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm
                shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                hover:scale-[1.02] transition-all duration-200"
            >
              Build my resume — free
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
