//
//  DateRange.swift
//  Fleet Manager
//
//  Date range model for filtering trips and reports
//

import Foundation

struct DateRange: Codable, Equatable {
    let start: Date
    let end: Date

    var duration: TimeInterval {
        end.timeIntervalSince(start)
    }

    var durationInDays: Int {
        Int(duration / (24 * 3600))
    }

    // Predefined ranges
    static var today: DateRange {
        let now = Date()
        let startOfDay = Calendar.current.startOfDay(for: now)
        return DateRange(start: startOfDay, end: now)
    }

    static var yesterday: DateRange {
        let now = Date()
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: now)!
        let startOfDay = Calendar.current.startOfDay(for: yesterday)
        let endOfDay = Calendar.current.date(byAdding: .day, value: 1, to: startOfDay)!
        return DateRange(start: startOfDay, end: endOfDay)
    }

    static var thisWeek: DateRange {
        let now = Date()
        let calendar = Calendar.current
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)!.start
        return DateRange(start: startOfWeek, end: now)
    }

    static var thisMonth: DateRange {
        let now = Date()
        let calendar = Calendar.current
        let startOfMonth = calendar.dateInterval(of: .month, for: now)!.start
        return DateRange(start: startOfMonth, end: now)
    }

    static var last30Days: DateRange {
        let now = Date()
        let start = Calendar.current.date(byAdding: .day, value: -30, to: now)!
        return DateRange(start: start, end: now)
    }

    static var last90Days: DateRange {
        let now = Date()
        let start = Calendar.current.date(byAdding: .day, value: -90, to: now)!
        return DateRange(start: start, end: now)
    }

    func contains(_ date: Date) -> Bool {
        return date >= start && date <= end
    }
}
