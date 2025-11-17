/**
 * DocumentMapPopup Component
 *
 * Displays document preview in map popup when marker is clicked.
 * Shows key information and provides quick actions.
 */

import { DocumentGeoData } from '@/lib/types'

export interface DocumentMapPopupProps {
  document: DocumentGeoData
  onView?: () => void
  onDownload?: () => void
}

/**
 * Format file size to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format distance to human-readable string
 */
function formatDistance(meters?: number): string {
  if (!meters) return ''

  if (meters < 1000) {
    return `${Math.round(meters)}m away`
  }

  const km = meters / 1000
  if (km < 10) {
    return `${km.toFixed(1)}km away`
  }

  return `${Math.round(km)}km away`
}

/**
 * DocumentMapPopup - Preview document information in map popup
 */
export function DocumentMapPopup({ document, onView, onDownload }: DocumentMapPopupProps) {
  return (
    <div className="document-map-popup min-w-[280px] max-w-[320px]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* File icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: document.categoryColor || '#3B82F6' }}
        >
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M4 3C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H16C17.1046 17 18 16.1046 18 15V5C18 3.89543 17.1046 3 16 3H4ZM4 5H16V7H4V5ZM4 9H16V15H4V9Z" />
          </svg>
        </div>

        {/* Document info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate mb-1">
            {document.fileName}
          </h3>

          {document.categoryName && (
            <div className="flex items-center gap-1 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: document.categoryColor || '#3B82F6' }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {document.categoryName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      {document.location?.address && (
        <div className="flex items-start gap-2 mb-3 text-sm">
          <svg
            className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
            {document.location.address}
          </span>
        </div>
      )}

      {/* City, State */}
      {(document.location?.city || document.location?.state) && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>
            {document.location.city}
            {document.location.city && document.location.state && ', '}
            {document.location.state}
          </span>
        </div>
      )}

      {/* Distance (if provided) */}
      {document.distanceMeters !== undefined && document.distanceMeters > 0 && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <span>{formatDistance(document.distanceMeters)}</span>
        </div>
      )}

      {/* Coordinates */}
      {document.location && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-500 font-mono">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span>
            {document.location.lat.toFixed(4)}, {document.location.lng.toFixed(4)}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onView}
          className="flex-1 px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View
        </button>

        <button
          onClick={onDownload}
          className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
      </div>
    </div>
  )
}
