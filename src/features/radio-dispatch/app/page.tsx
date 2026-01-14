export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Radio Fleet Dispatch
          </h1>
          <p className="text-xl text-slate-700 dark:text-gray-300 mb-8">
            AI-powered radio transcription and fleet dispatch management
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ✅ Deployment Successful!
            </h2>
            <p className="text-slate-700 dark:text-gray-300 mb-4">
              All production runtime errors have been fixed:
            </p>
            <ul className="text-left max-w-2xl mx-auto space-y-2 text-gray-700 dark:text-gray-300">
              <li>✅ Error boundaries prevent white screens</li>
              <li>✅ Safe data handling prevents crashes</li>
              <li>✅ CORS properly configured</li>
              <li>✅ Loading and error states everywhere</li>
              <li>✅ Retry logic for failed requests</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Radio Monitoring</h3>
              <p className="text-slate-700 dark:text-gray-300 text-sm">
                Real-time transcription and analysis
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Fleet Management</h3>
              <p className="text-slate-700 dark:text-gray-300 text-sm">
                Track and coordinate your assets
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Incident Response</h3>
              <p className="text-slate-700 dark:text-gray-300 text-sm">
                Automated dispatch and coordination
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
