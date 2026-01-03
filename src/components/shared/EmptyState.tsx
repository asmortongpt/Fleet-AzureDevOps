import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty State Component
 * Visual Quality: Beautiful empty state design for lists/grids
 * Nielsen's Heuristic #6: Recognition rather than recall
 * Provides clear guidance when no data is available
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  const defaultIcon = (
    <svg
      className="mx-auto h-12 w-12 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
      />
    </svg>
  );

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500 font-normal">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center h-11 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
