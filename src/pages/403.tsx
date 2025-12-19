/**
 * 403 Forbidden Page
 * CRIT-F-003: Unauthorized Access Page
 *
 * Displayed when a user attempts to access a resource they don't have permission for.
 * This prevents information disclosure by not revealing whether the resource exists.
 */

import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

export function Forbidden403Page() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 p-4">
              <ShieldX className="w-16 h-16 text-red-600" />
            </div>
          </div>

          {/* Error Code */}
          <h1 className="text-6xl font-bold text-gray-900 mb-2">403</h1>

          {/* Error Message */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Access Denied
          </h2>

          <p className="text-gray-600 mb-6">
            You don't have permission to access this resource.
            {user && (
              <span className="block mt-2 text-sm">
                Current role: <span className="font-medium text-gray-800">{user.role}</span>
              </span>
            )}
          </p>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-left">
            <p className="font-medium text-blue-900 mb-2">What can I do?</p>
            <ul className="text-blue-800 space-y-1 list-disc list-inside">
              <li>Contact your administrator to request access</li>
              <li>Verify you're using the correct account</li>
              <li>Return to a page you have access to</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </button>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 mt-6">
            If you believe this is an error, please contact support with error code: 403
          </p>
        </div>
      </div>
    </div>
  );
}

export default Forbidden403Page;
