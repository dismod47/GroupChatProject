import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-neutral-100 border-t border-neutral-200 mt-auto">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-600">
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 rounded transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-neutral-400">•</span>
            <Link
              href="/privacy"
              className="hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 rounded transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
          <div className="text-neutral-500">
            © {new Date().getFullYear()} University of You Study Groups
          </div>
        </div>
      </div>
    </footer>
  );
}

