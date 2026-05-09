import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen
      bg-[#0A0A0F] px-4 text-center">
      <p className="text-6xl font-bold text-white/10 mb-4">404</p>
      <h1 className="font-heading text-2xl font-bold text-white mb-2">
        Page not found
      </h1>
      <p className="text-sm text-[#60607A] mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/"
        className="px-5 py-2.5 rounded-xl text-sm font-semibold
          bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors">
        Go home
      </Link>
    </div>
  )
}
