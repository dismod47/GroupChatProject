import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-6">
            Terms of Service
          </h1>

          <div className="prose prose-sm max-w-none text-neutral-700 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Acceptance of Terms</h2>
              <p>
                By using this study group platform, you agree to these terms. If you don't agree, please don't use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Use of Service</h2>
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the platform for academic study groups only</li>
                <li>Be respectful to other users</li>
                <li>Not share inappropriate content</li>
                <li>Keep your account information accurate</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">User Responsibilities</h2>
              <p>
                You are responsible for all activity under your account. Report any misuse or abuse to administrators.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Content Moderation</h2>
              <p>
                We reserve the right to remove content or suspend accounts that violate these terms or community guidelines.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of the service means you accept any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Contact</h2>
              <p>
                Questions about these terms? Please contact your course administrator or visit the <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</Link> page.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-200 text-sm text-neutral-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

