import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen
      bg-[#F4F2EC] px-4 text-center">
      <p className="text-6xl font-bold text-lp-muted mb-4">404</p>
      <h1 className="font-heading text-2xl font-bold text-lp-ink mb-2">
        Page not found
      </h1>
      <p className="text-sm text-[#5A5F5C] mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/"
        className="px-5 py-2.5 rounded-[4px] text-sm font-semibold
          bg-[#1F5C4A] text-white hover:bg-[#15443A] transition-colors">
        Go home
      </Link>
    </div>
  )
}
