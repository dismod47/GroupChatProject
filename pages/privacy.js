import Link from 'next/link';

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>

          <div className="prose prose-sm max-w-none text-neutral-700 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Your Privacy Matters</h2>
              <p>
                We take your privacy seriously. This policy explains how we handle your information when you use this study group platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Information We Collect</h2>
              <p>We collect only what's necessary:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your display name (used in groups and messages)</li>
                <li>Course enrollments and group memberships</li>
                <li>Messages you send in study groups</li>
                <li>Account creation timestamp</li>
              </ul>
              <p className="mt-3">
                <strong>We do NOT collect:</strong> your email address, phone number, or any personal identification beyond your chosen display name.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">How We Use Your Information</h2>
              <p>
                Your information is used only to provide the study group service:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Display your name in groups you join</li>
                <li>Show your messages in group chats</li>
                <li>Manage your group memberships</li>
                <li>Maintain course rosters</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Data Sharing</h2>
              <p>
                <strong>We do not sell your data.</strong> We do not share your information with third parties. Your data stays within this platform for academic purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">FERPA Compliance</h2>
              <p>
                This platform complies with FERPA (Family Educational Rights and Privacy Act). Educational records are protected and only used for legitimate academic purposes. No personally identifiable information beyond display names is stored or shared.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Display Name Privacy</h2>
              <p>
                On public pages, we show only your first name and last initial (e.g., "John D.") to protect privacy. Full names are stored securely and only visible to group members.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Data Security</h2>
              <p>
                Your password is hashed and encrypted. We use industry-standard security practices to protect your account information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Your Rights</h2>
              <p>You can:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Update your display name at any time</li>
                <li>Leave groups whenever you want</li>
                <li>Delete your account (contact administrator)</li>
                <li>Request information about your stored data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Contact</h2>
              <p>
                Questions about privacy? Please contact your course administrator or review our <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</Link>.
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

