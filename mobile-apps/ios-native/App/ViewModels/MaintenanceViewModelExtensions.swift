/**
 * MaintenanceViewModelExtensions.swift
 * Fleet Management - Notification Extensions
 *
 * Extensions for MaintenanceViewModel adding notification scheduling
 */

import Foundation
import UserNotifications

// MARK: - MaintenanceViewModel Notification Extensions
extension MaintenanceViewModel {

    /// Schedule a new maintenance record with notifications
    func scheduleMaintenanceWithNotification(
        vehicleId: String,
        type: MaintenanceType,
        category: MaintenanceCategory,
        scheduledDate: Date,
        description: String,
        priority: MaintenancePriority = .normal,
        daysBefore: Int = 1
    ) {
        guard let vehicle = vehicles.first(where: { $0.id == vehicleId }) else {
            print("❌ Vehicle not found: \(vehicleId)")
            return
        }

        // Create the maintenance record
        let newRecord = MaintenanceRecord(
            id: UUID().uuidString,
            vehicleId: vehicleId,
            vehicleNumber: vehicle.number,
            type: type,
            category: category,
            scheduledDate: scheduledDate,
            completedDate: nil,
            status: .scheduled,
            priority: priority,
            description: description,
            cost: nil,
            mileageAtService: vehicle.mileage,
            hoursAtService: vehicle.hoursUsed,
            servicedBy: nil,
            serviceProvider: nil,
            location: nil,
            notes: nil,
            parts: nil,
            attachments: nil,
            nextServiceMileage: nil,
            nextServiceDate: nil,
            createdAt: Date(),
            lastModified: Date()
        )

        // Add to records
        maintenanceRecords.append(newRecord)
        updateFilteredRecords()

        // Schedule notification
        Task {
            // Request permission if needed
            let authorized = await NotificationService.shared.requestAuthorization()
            if authorized {
                NotificationService.shared.scheduleMaintenanceReminder(for: newRecord, daysBefore: daysBefore)
                print("✅ Scheduled notification for maintenance: \(newRecord.id)")
            } else {
                print("⚠️ Notification permission denied")
            }
        }
    }

    /// Reschedule maintenance with updated notification
    func rescheduleMaintenanceWithNotification(_ record: MaintenanceRecord, newDate: Date, daysBefore: Int = 1) {
        // Cancel existing notification
        NotificationService.shared.cancelMaintenanceNotification(maintenanceId: record.id)

        // Update record
        if let index = maintenanceRecords.firstIndex(where: { $0.id == record.id }) {
            var updatedRecord = maintenanceRecords[index]
            updatedRecord = MaintenanceRecord(
                id: updatedRecord.id,
                vehicleId: updatedRecord.vehicleId,
                vehicleNumber: updatedRecord.vehicleNumber,
                type: updatedRecord.type,
                category: updatedRecord.category,
                scheduledDate: newDate,
                completedDate: updatedRecord.completedDate,
                status: .scheduled,
                priority: updatedRecord.priority,
                description: updatedRecord.description,
                cost: updatedRecord.cost,
                mileageAtService: updatedRecord.mileageAtService,
                hoursAtService: updatedRecord.hoursAtService,
                servicedBy: updatedRecord.servicedBy,
                serviceProvider: updatedRecord.serviceProvider,
                location: updatedRecord.location,
                notes: updatedRecord.notes,
                parts: updatedRecord.parts,
                attachments: updatedRecord.attachments,
                nextServiceMileage: updatedRecord.nextServiceMileage,
                nextServiceDate: updatedRecord.nextServiceDate,
                createdAt: updatedRecord.createdAt,
                lastModified: Date()
            )
            maintenanceRecords[index] = updatedRecord
            updateFilteredRecords()

            // Schedule new notification
            NotificationService.shared.scheduleMaintenanceReminder(for: updatedRecord, daysBefore: daysBefore)
            print("✅ Rescheduled maintenance and notification: \(record.id)")
        }
    }

    /// Complete maintenance and cancel notification
    func completeMaintenanceRecord(_ record: MaintenanceRecord, cost: Double? = nil, notes: String? = nil) {
        // Cancel notification
        NotificationService.shared.cancelMaintenanceNotification(maintenanceId: record.id)

        // Update record
        if let index = maintenanceRecords.firstIndex(where: { $0.id == record.id }) {
            var updatedRecord = maintenanceRecords[index]
            updatedRecord = MaintenanceRecord(
                id: updatedRecord.id,
                vehicleId: updatedRecord.vehicleId,
                vehicleNumber: updatedRecord.vehicleNumber,
                type: updatedRecord.type,
                category: updatedRecord.category,
                scheduledDate: updatedRecord.scheduledDate,
                completedDate: Date(),
                status: .completed,
                priority: updatedRecord.priority,
                description: updatedRecord.description,
                cost: cost ?? updatedRecord.cost,
                mileageAtService: updatedRecord.mileageAtService,
                hoursAtService: updatedRecord.hoursAtService,
                servicedBy: updatedRecord.servicedBy,
                serviceProvider: updatedRecord.serviceProvider,
                location: updatedRecord.location,
                notes: notes ?? updatedRecord.notes,
                parts: updatedRecord.parts,
                attachments: updatedRecord.attachments,
                nextServiceMileage: updatedRecord.nextServiceMileage,
                nextServiceDate: updatedRecord.nextServiceDate,
                createdAt: updatedRecord.createdAt,
                lastModified: Date()
            )
            maintenanceRecords[index] = updatedRecord
            updateFilteredRecords()
            print("✅ Completed maintenance and cancelled notification: \(record.id)")
        }
    }

    /// Cancel maintenance and notification
    func cancelMaintenanceRecord(_ record: MaintenanceRecord) {
        // Cancel notification
        NotificationService.shared.cancelMaintenanceNotification(maintenanceId: record.id)

        // Remove record
        maintenanceRecords.removeAll { $0.id == record.id }
        updateFilteredRecords()
        print("✅ Cancelled maintenance and notification: \(record.id)")
    }

    /// Schedule notifications for all upcoming maintenance
    func scheduleAllUpcomingNotifications(daysBefore: Int = 1) async {
        // Request authorization first
        let authorized = await NotificationService.shared.requestAuthorization()
        guard authorized else {
            print("⚠️ Notification permission denied")
            return
        }

        // Schedule for all scheduled maintenance
        let scheduledRecords = maintenanceRecords.filter { $0.status == .scheduled }
        for record in scheduledRecords {
            NotificationService.shared.scheduleMaintenanceReminder(for: record, daysBefore: daysBefore)
        }

        print("✅ Scheduled notifications for \(scheduledRecords.count) maintenance records")
    }

    /// Helper method to update filtered records (if not already defined)
    private func updateFilteredRecords() {
        // This would be implemented in the main MaintenanceViewModel
        // Just a placeholder for the extension
        print("🔄 Updating filtered records")
    }
}
