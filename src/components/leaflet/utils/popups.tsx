/**
 * Popup HTML creation utilities for Leaflet markers
 * Extracted from LeafletMap.tsx for better maintainability
 */

import { VEHICLE_STATUS_COLORS, escapeHtml } from "./icons"

import type { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"

/**
 * Creates HTML content for vehicle marker popup
 */
export function createVehiclePopup(vehicle: Vehicle): string {
  const color = VEHICLE_STATUS_COLORS[vehicle.status] || VEHICLE_STATUS_COLORS.idle
  const statusLabel = vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)
  const typeLabel = vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 240px;">
      <div style="font-weight: 600; font-size: 16px; margin-bottom: 12px; color: #111827;">
        ${escapeHtml(vehicle.name)}
      </div>
      <div style="display: grid; gap: 8px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6b7280; font-weight: 500;">Type:</span>
          <span style="color: #111827;">${typeLabel}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6b7280; font-weight: 500;">Status:</span>
          <span style="color: ${color}; font-weight: 700; text-transform: capitalize;">${statusLabel}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6b7280; font-weight: 500;">Driver:</span>
          <span style="color: #111827;">${escapeHtml(vehicle.driver || "Unassigned")}</span>
        </div>
        ${
          vehicle.location?.address
            ? `
          <div style="margin-top: 8px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
            <div style="color: #6b7280; font-weight: 500; margin-bottom: 6px; font-size: 13px;">Location:</div>
            <div style="color: #111827; font-size: 13px; line-height: 1.4;">${escapeHtml(vehicle.location?.address)}</div>
          </div>
        `
            : vehicle.location?.lat && vehicle.location?.lng
              ? `
          <div style="margin-top: 8px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
            <div style="color: #9ca3af; font-size: 11px; font-family: 'Courier New', monospace;">
              ${vehicle.location?.lat.toFixed(6)}, ${vehicle.location?.lng.toFixed(6)}
            </div>
          </div>
        `
              : ""
        }
      </div>
    </div>
  `
}

/**
 * Creates HTML content for facility marker popup
 */
export function createFacilityPopup(facility: GISFacility): string {
  const statusColor =
    facility.status === "operational" ? "#10b981" : facility.status === "maintenance" ? "#f59e0b" : "#6b7280"
  const statusLabel = facility.status.charAt(0).toUpperCase() + facility.status.slice(1)
  const typeLabel = facility.type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 240px;">
      <div style="font-weight: 600; font-size: 16px; margin-bottom: 12px; color: #111827;">
        ${escapeHtml(facility.name)}
      </div>
      <div style="display: grid; gap: 8px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6b7280; font-weight: 500;">Type:</span>
          <span style="color: #111827;">${typeLabel}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6b7280; font-weight: 500;">Status:</span>
          <span style="color: ${statusColor}; font-weight: 700;">${statusLabel}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6b7280; font-weight: 500;">Capacity:</span>
          <span style="color: #111827; font-weight: 600;">${facility.capacity} vehicles</span>
        </div>
        <div style="margin-top: 8px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <div style="color: #6b7280; font-weight: 500; margin-bottom: 6px; font-size: 13px;">Address:</div>
          <div style="color: #111827; font-size: 13px; line-height: 1.4;">${escapeHtml(facility.address)}</div>
        </div>
      </div>
    </div>
  `
}

/**
 * Creates HTML content for camera marker popup
 */
export function createCameraPopup(camera: TrafficCamera): string {
  const statusColor = camera.operational ? "#10b981" : "#ef4444"
  const statusText = camera.operational ? "Operational" : "Offline"

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 260px; max-width: 340px;">
      <div style="font-weight: 600; font-size: 16px; margin-bottom: 12px; color: #111827;">
        ${escapeHtml(camera.name)}
      </div>
      <div style="display: grid; gap: 8px; font-size: 14px;">
        ${
          camera.address
            ? `
          <div>
            <div style="color: #6b7280; font-weight: 500; margin-bottom: 4px; font-size: 13px;">Address:</div>
            <div style="color: #111827; font-size: 13px; line-height: 1.4;">${escapeHtml(camera.address)}</div>
          </div>
        `
            : ""
        }
        ${
          camera.crossStreets
            ? `
          <div>
            <div style="color: #6b7280; font-weight: 500; margin-bottom: 4px; font-size: 13px;">Cross Streets:</div>
            <div style="color: #111827; font-size: 13px; line-height: 1.4;">${escapeHtml(camera.crossStreets)}</div>
          </div>
        `
            : ""
        }
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
          <span style="color: #6b7280; font-weight: 500;">Status:</span>
          <span style="color: ${statusColor}; font-weight: 700;">${statusText}</span>
        </div>
        ${
          camera.cameraUrl
            ? `
          <div style="margin-top: 12px;">
            <a
              href="${escapeHtml(camera.cameraUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background-color: #3b82f6;
                color: white;
                padding: 10px 18px;
                border-radius: 6px;
                text-decoration: none;
                font-size: 14px;
                font-weight: 600;
                transition: background-color 0.2s;
                width: 100%;
                justify-content: center;
              "
              onmouseover="this.style.backgroundColor='#2563eb'"
              onmouseout="this.style.backgroundColor='#3b82f6'"
            >
              <span role="img" aria-hidden="true">📹</span>
              <span>View Live Feed</span>
            </a>
          </div>
        `
            : ""
        }
        ${
          camera.latitude && camera.longitude
            ? `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
            <div style="color: #9ca3af; font-size: 11px; font-family: 'Courier New', monospace; text-align: center;">
              ${camera.latitude.toFixed(6)}, ${camera.longitude.toFixed(6)}
            </div>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `
}
