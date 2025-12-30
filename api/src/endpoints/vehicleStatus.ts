import logger from '../config/logger'


// Wrap all endpoint handlers in try-catch
export async function getVehicleStatus(req, res) {
  try {
    const { vehicleId } = req.params;
    const status = await vehicleService.getStatus(vehicleId, req.user.tenant_id);
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Error fetching vehicle status', {
      error: error.message,
      stack: error.stack,
      vehicleId: req.params.vehicleId,
      tenantId: req.user?.tenant_id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle status',
      requestId: req.id
    });
  }
}
