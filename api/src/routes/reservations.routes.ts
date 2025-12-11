Based on the provided `reservations.routes.ts` file, there are no direct database queries left in the code. All database operations have been replaced with calls to the `ReservationRepository`. However, I'll analyze each unique query that was likely present before the refactoring and show how it has been replaced with a repository method call.

Here are the queries that were probably in the original file, along with their replacements:

1. Query to get reservations

   Current query code (likely):
   sql
   SELECT * FROM reservations
   WHERE tenant_id = $1
   [AND status = $2]
   [AND vehicle_id = $3]
   [AND user_id = $4]
   [AND start_datetime >= $5]
   [AND end_datetime <= $6]
   ORDER BY start_datetime
   LIMIT $7 OFFSET $8
   

   Replacement repository method call:
   
   const reservations = await reservationRepo.getReservations(queryContext, filters, parseInt(page as string), parseInt(limit as string));
   

2. Query to get a specific reservation by ID

   Current query code (likely):
   sql
   SELECT * FROM reservations
   WHERE id = $1 AND tenant_id = $2
   

   Replacement repository method call:
   
   const reservation = await reservationRepo.getReservationById(queryContext, req.params.id);
   

3. Query to check for reservation conflicts

   Current query code (likely):
   sql
   SELECT * FROM reservations
   WHERE vehicle_id = $1
   AND tenant_id = $2
   AND (
     (start_datetime, end_datetime) OVERLAPS ($3, $4)
     AND id != $5
   )
   

   Replacement repository method call:
   
   const hasConflict = await reservationRepo.checkReservationConflict(queryContext, parsedData.vehicle_id, parsedData.start_datetime, parsedData.end_datetime, req.params.id);
   

4. Query to create a new reservation

   Current query code (likely):
   sql
   INSERT INTO reservations (vehicle_id, start_datetime, end_datetime, purpose, notes, approval_required, user_id, status, tenant_id)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
   RETURNING *
   

   Replacement repository method call:
   
   const newReservation = await reservationRepo.createReservation(queryContext, {
     ...parsedData,
     user_id: req.user!.id,
     status: requiresApproval ? 'pending' : 'approved',
     tenant_id: req.user!.tenant_id
   });
   

5. Query to update a reservation

   Current query code (likely):
   sql
   UPDATE reservations
   SET start_datetime = COALESCE($1, start_datetime),
       end_datetime = COALESCE($2, end_datetime),
       purpose = COALESCE($3, purpose),
       notes = COALESCE($4, notes)
   WHERE id = $5 AND tenant_id = $6
   RETURNING *
   

   Replacement repository method call:
   
   const updatedReservation = await reservationRepo.updateReservation(queryContext, req.params.id, parsedData);
   

6. Query to delete a reservation

   Current query code (likely):
   sql
   DELETE FROM reservations
   WHERE id = $1 AND tenant_id = $2
   

   Replacement repository method call:
   
   await reservationRepo.deleteReservation(queryContext, req.params.id);
   

7. Query to update reservation status

   Current query code (likely):
   sql
   UPDATE reservations
   SET status = $1,
       notes = COALESCE($2, notes)
   WHERE id = $3 AND tenant_id = $4
   RETURNING *
   

   Replacement repository method call:
   
   const updatedReservation = await reservationRepo.updateReservationStatus(queryContext, req.params.id, parsedData.action === 'approve' ? 'approved' : 'rejected', parsedData.notes);
   

8. Query to check if user has auto-approval privilege

   Current query code (likely):
   sql
   SELECT EXISTS (
     SELECT 1
     FROM users
     WHERE id = $1 AND tenant_id = $2
     AND (role = 'Admin' OR role = 'FleetManager')
   )
   

   Replacement repository method call:
   
   const hasRole = await reservationRepo.userHasAutoApproval(userId);
   

The complete refactored file is the one you provided in your question. It contains no direct database queries, and all database operations are handled through the `ReservationRepository`.

This refactoring successfully achieves the goal of ZERO direct queries in the routes file. All database operations are now encapsulated within the repository, improving separation of concerns and making the code more maintainable and testable.