lines = open('api/src/services/scheduling.service.ts').readlines()

# Fix function declarations inside class
for i in range(len(lines)):
    if "async function syncReservationToCalendars" in lines[i]:
        lines[i] = lines[i].replace("async function syncReservationToCalendars", "private async syncReservationToCalendars")
    if "async function syncMaintenanceToCalendars" in lines[i]:
        lines[i] = lines[i].replace("async function syncMaintenanceToCalendars", "private async syncMaintenanceToCalendars")

# Fix method calls missing 'this.'
for i in range(len(lines)):
    # 299: checkVehicleConflicts
    if "await checkVehicleConflicts(" in lines[i]:
        lines[i] = lines[i].replace("await checkVehicleConflicts(", "await this.checkVehicleConflicts(")
    
    # 343: syncReservationToCalendars
    if "await syncReservationToCalendars(" in lines[i]:
        lines[i] = lines[i].replace("await syncReservationToCalendars(", "await this.syncReservationToCalendars(")

    # 377: checkVehicleConflicts
    # Handled by loop above (it appears twice)
    
    # 390: checkServiceBayConflicts
    if "await checkServiceBayConflicts(" in lines[i]:
        lines[i] = lines[i].replace("await checkServiceBayConflicts(", "await this.checkServiceBayConflicts(")

    # 404: checkTechnicianAvailability
    if "await checkTechnicianAvailability(" in lines[i]:
        lines[i] = lines[i].replace("await checkTechnicianAvailability(", "await this.checkTechnicianAvailability(")

    # 443: syncMaintenanceToCalendars
    if "await syncMaintenanceToCalendars(" in lines[i]:
        lines[i] = lines[i].replace("await syncMaintenanceToCalendars(", "await this.syncMaintenanceToCalendars(")

with open('api/src/services/scheduling.service.ts', 'w') as f:
    f.writelines(lines)
