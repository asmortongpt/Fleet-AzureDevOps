/**
 * 403 Forbidden Page
 * CRIT-F-003: Unauthorized Access Page
 *
 * Displayed when a user attempts to access a resource they don't have permission for.
 * This prevents information disclosure by not revealing whether the resource exists.
 */

import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/useAuth';

export function Forbidden403Page() {
  const navigate = useNavigate();
  const { navigateTo } = useNavigation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen cta-hub flex items-center justify-center px-2">
      <div className="max-w-md w-full">
        <div className="bg-[#1A0648]/90 text-white rounded-lg shadow-sm p-3 text-center border border-[rgba(0,204,254,0.08)]">
          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-[#FF4300]/20 p-2">
              <ShieldX className="w-16 h-16 text-[#FF4300]" />
            </div>
          </div>

          {/* Error Code */}
          <h1 className="text-6xl font-bold text-white mb-2">403</h1>

          {/* Error Message */}
          <h2 className="text-sm font-semibold text-white mb-2">
            Access Denied
          </h2>

          <p className="text-[rgba(255,255,255,0.40)] mb-3">
            You don't have permission to access this resource.
            {user && (
              <span className="block mt-2 text-sm">
                Current role: <span className="font-medium text-white">{user.role}</span>
              </span>
            )}
          </p>

          {/* Help Text */}
          <div className="bg-[#221060]/40 border border-[rgba(0,204,254,0.08)] rounded-lg p-2 mb-3 text-sm text-left">
            <p className="font-medium text-white mb-2">What can I do?</p>
            <ul className="text-[rgba(255,255,255,0.40)] space-y-1 list-disc list-inside">
              <li>Contact your administrator to request access</li>
              <li>Verify you're using the correct account</li>
              <li>Return to a page you have access to</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-2 py-2 bg-[#221060]/40 hover:bg-[#221060]/60 text-[rgba(255,255,255,0.40)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <button
              onClick={() => navigateTo('live-fleet-dashboard')}
              className="flex items-center justify-center gap-2 px-2 py-2 bg-[#00CCFE] hover:bg-[#00CCFE]/90 text-[#0D0320] rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </button>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-[rgba(255,255,255,0.40)] mt-3">
            If you believe this is an error, please contact support with error code: 403
          </p>
        </div>
      </div>
    </div>
  );
}

export default Forbidden403Page;
