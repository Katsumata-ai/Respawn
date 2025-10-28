'use client';

/**
 * Discover View - App preview in marketplace
 * This page is shown in the Whop marketplace to preview the app
 * Path: /discover
 */

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Course Downloader
          </h1>
          <p className="text-gray-600 mt-2">
            Download and manage your course content with ease
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">📥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Easy Download
              </h3>
              <p className="text-gray-600">
                Download your course videos with just one click. Fast and reliable.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Analytics
              </h3>
              <p className="text-gray-600">
                Track downloads and user engagement with detailed analytics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Secure
              </h3>
              <p className="text-gray-600">
                Your data is encrypted and stored securely in the cloud.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Pricing</h2>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              One-Time Access
            </h3>
            <div className="text-5xl font-bold text-blue-600 mb-4">€10</div>
            <p className="text-gray-600 mb-6">
              Get lifetime access to download and manage your courses.
            </p>
            <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
              Get Started
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                  1
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Purchase Access
                </h3>
                <p className="mt-2 text-gray-600">
                  Pay €10 for lifetime access to the app.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                  2
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Upload Your Content
                </h3>
                <p className="mt-2 text-gray-600">
                  Upload your course videos and materials.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                  3
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Download Anytime
                </h3>
                <p className="mt-2 text-gray-600">
                  Download your content whenever you need it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

