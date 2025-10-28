import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#161616' }}>
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4" style={{ color: '#FF8102' }}>
          404
        </h1>
        <p className="text-xl mb-2" style={{ color: '#FFFFFF' }}>
          Page not found
        </p>
        <p className="mb-6" style={{ color: '#676767' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded font-semibold transition hover:opacity-80"
          style={{ backgroundColor: '#FF8102', color: '#161616' }}
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
