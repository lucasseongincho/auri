import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug } from '@/lib/blog'
import type { PostWithContent } from '@/lib/blog'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  const author = post.author ?? 'Lucas Cho'
  return {
    title: { absolute: `${post.title} — AURI Blog` },
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [author],
      images: [{ url: '/opengraph-image' }],
      url: `https://www.auri-resume.com/blog/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `https://www.auri-resume.com/blog/${slug}`,
    },
  }
}


function BlogPostContent({ post }: { post: PostWithContent }) {
  return (
    <main className="min-h-screen bg-[#F4F2EC] text-[#1B1D1C] px-6 py-16">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <a
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-[#5A5F5C]
            hover:text-[#3C403E] transition-colors mb-10"
        >
          ← All posts
        </a>

        {/* Post header */}
        <header className="mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-lp-ink
            tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
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
        </header>

        {/* MDX content */}
        <div className="prose prose-invert prose-headings:font-heading prose-headings:font-bold
          prose-h2:text-xl prose-h3:text-lg
          prose-p:text-[#3C403E] prose-p:leading-relaxed
          prose-a:text-[#1F5C4A] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-lp-ink prose-strong:font-semibold
          prose-li:text-[#3C403E]
          prose-ul:my-4 prose-ol:my-4
          prose-hr:border-lp-rule
          prose-code:text-[#1F5C4A] prose-code:bg-[#FFFFFF] prose-code:px-1.5
          prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
          prose-pre:bg-[#FFFFFF] prose-pre:border prose-pre:border-lp-rule
          prose-pre:rounded-xl
          max-w-none">
          <MDXRemote source={post.content} />
        </div>

        {/* Footer CTA */}
        <div className="mt-16 rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
          <div className="rounded-[10px]  bg-[#FFFFFF] p-8 text-center">
            <h3 className="font-heading text-lg font-semibold text-lp-ink mb-2">
              Ready to fix your resume?
            </h3>
            <p className="text-[#3C403E] text-sm mb-5">
              AURI rewrites your resume with AI, optimizes it for ATS, and helps you land more interviews.
            </p>
            <a
              href="/dashboard/resume"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[4px]
                bg-[#1F5C4A] text-white font-semibold text-sm
                 transition-all duration-200"
            >
              Build my resume — free
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()
  return <BlogPostContent post={post} />
}
