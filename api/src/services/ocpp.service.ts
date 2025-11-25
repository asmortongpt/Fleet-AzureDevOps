/**
 * OCPP 2.0.1 Service - Open Charge Point Protocol
 *
 * WebSocket-based service for managing EV charging stations.
 * Supports ChargePoint, EVBox, ABB, and other OCPP-compliant stations.
 *
 * Features:
 * - WebSocket client for OCPP 2.0.1 protocol
 * - Remote start/stop charging
 * - Real-time status monitoring
 * - Meter value collection
 * - Reservation management
 * - Smart charging profiles
 */

import WebSocket from 'ws';
import { Pool } from 'pg';
import { EventEmitter } from 'events';

// OCPP 2.0.1 Message Types
enum MessageType {
  CALL = 2,           // Request
  CALLRESULT = 3,     // Response
  CALLERROR = 4       // Error
}

// OCPP 2.0.1 Actions
enum OCPPAction {
  // Core
  Authorize = 'Authorize',
  BootNotification = 'BootNotification',
  Heartbeat = 'Heartbeat',
  StatusNotification = 'StatusNotification',

  // Transactions
  StartTransaction = 'StartTransaction',
  StopTransaction = 'StopTransaction',
  MeterValues = 'MeterValues',
  TransactionEvent = 'TransactionEvent',

  // Remote Control
  RemoteStartTransaction = 'RemoteStartTransaction',
  RemoteStopTransaction = 'RemoteStopTransaction',
  UnlockConnector = 'UnlockConnector',

  // Reservations
  ReserveNow = 'ReserveNow',
  CancelReservation = 'CancelReservation',

  // Smart Charging
  SetChargingProfile = 'SetChargingProfile',
  ClearChargingProfile = 'ClearChargingProfile',
  GetCompositeSchedule = 'GetCompositeSchedule',

  // Configuration
  GetConfiguration = 'GetConfiguration',
  ChangeConfiguration = 'ChangeConfiguration',
  Reset = 'Reset'
}

// Charging Station Status
enum ChargePointStatus {
  Available = 'Available',
  Preparing = 'Preparing',
  Charging = 'Charging',
  SuspendedEVSE = 'SuspendedEVSE',
  SuspendedEV = 'SuspendedEV',
  Finishing = 'Finishing',
  Reserved = 'Reserved',
  Unavailable = 'Unavailable',
  Faulted = 'Faulted'
}

interface OCPPMessage {
  messageTypeId: MessageType;
  messageId: string;
  action?: string;
  payload: any;
  errorCode?: string;
  errorDescription?: string;
}

interface ChargingStation {
  id: number;
  station_id: string;
  name: string;
  ws_url?: string;
  api_endpoint?: string;
  status: string;
  is_online: boolean;
}

interface StartTransactionRequest {
  stationId: string;
  connectorId: number;
  idTag: string;
  vehicleId: number;
  driverId?: number;
  meterStart?: number;
  reservationId?: number;
}

interface StopTransactionRequest {
  transactionId: string;
  meterStop?: number;
  reason?: string;
}

interface ReservationRequest {
  stationId: string;
  connectorId?: number;
  expiryDate: Date;
  idTag: string;
  reservationId: number;
}

interface ChargingProfile {
  chargingProfileId: number;
  stackLevel: number;
  chargingProfilePurpose: 'ChargePointMaxProfile' | 'TxDefaultProfile' | 'TxProfile';
  chargingProfileKind: 'Absolute' | 'Recurring' | 'Relative';
  recurrencyKind?: 'Daily' | 'Weekly';
  validFrom?: Date;
  validTo?: Date;
  chargingSchedule: {
    duration?: number;
    startSchedule?: Date;
    chargingRateUnit: 'W' | 'A';
    chargingSchedulePeriod: Array<{
      startPeriod: number;
      limit: number;
      numberPhases?: number;
    }>;
  };
}

class OCPPService extends EventEmitter {
  private db: Pool;
  private connections: Map<string, WebSocket>;
  private pendingCalls: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>;
  private messageIdCounter: number;

  constructor(db: Pool) {
    super();
    this.db = db;
    this.connections = new Map();
    this.pendingCalls = new Map();
    this.messageIdCounter = 0;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${++this.messageIdCounter}`;
  }

  /**
   * Connect to a charging station via WebSocket
   */
  async connectStation(stationId: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        'SELECT id, station_id, name, ws_url FROM charging_stations WHERE station_id = $1',
        [stationId]
      );

      if (result.rows.length === 0) {
        console.error(`Station ${stationId} not found in database`);
        return false;
      }

      const station = result.rows[0];

      if (!station.ws_url) {
        console.error(`Station ${stationId} has no WebSocket URL configured`);
        return false;
      }

      // Check if already connected
      if (this.connections.has(stationId)) {
        console.log(`Station ${stationId} already connected`);
        return true;
      }

      // Create WebSocket connection
      const ws = new WebSocket(station.ws_url, 'ocpp2.0.1');

      ws.on('open', () => {
        console.log(`✅ Connected to station ${stationId}`);
        this.connections.set(stationId, ws);
        this.updateStationStatus(stationId, { is_online: true, last_heartbeat: new Date() });
        this.emit('stationConnected', stationId);
      });

      ws.on('message', (data: Buffer) => {
        this.handleMessage(stationId, data.toString());
      });

      ws.on('close', () => {
        console.log(`❌ Disconnected from station ${stationId}`);
        this.connections.delete(stationId);
        this.updateStationStatus(stationId, { is_online: false });
        this.emit('stationDisconnected', stationId);

        // Attempt reconnection after 30 seconds
        setTimeout(() => this.connectStation(stationId), 30000);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for station ${stationId}:`, error.message);
        this.emit('stationError', { stationId, error: error.message });
      });

      return true;
    } catch (error: any) {
      console.error(`Error connecting to station ${stationId}:`, error.message);
      return false;
    }
  }

  /**
   * Handle incoming OCPP message
   */
  private async handleMessage(stationId: string, data: string) {
    try {
      const message: [number, string, any?, any?] = JSON.parse(data);
      const [messageTypeId, messageId, actionOrErrorCode, payload] = message;

      // Log message
      await this.logOCPPMessage(stationId, 'Inbound', messageTypeId, actionOrErrorCode, payload);

      switch (messageTypeId) {
        case MessageType.CALL:
          // Incoming request from station
          await this.handleCall(stationId, messageId, actionOrErrorCode as string, payload);
          break;

        case MessageType.CALLRESULT:
          // Response to our request
          this.handleCallResult(messageId, payload);
          break;

        case MessageType.CALLERROR:
          // Error response
          this.handleCallError(messageId, actionOrErrorCode as string, payload);
          break;
      }
    } catch (error: any) {
      console.error(`Error handling message from ${stationId}:`, error.message);
    }
  }

  /**
   * Handle CALL (request from station)
   */
  private async handleCall(stationId: string, messageId: string, action: string, payload: any) {
    let response: any;

    try {
      switch (action) {
        case OCPPAction.BootNotification:
          response = await this.handleBootNotification(stationId, payload);
          break;

        case OCPPAction.Heartbeat:
          response = await this.handleHeartbeat(stationId);
          break;

        case OCPPAction.StatusNotification:
          response = await this.handleStatusNotification(stationId, payload);
          break;

        case OCPPAction.TransactionEvent:
          response = await this.handleTransactionEvent(stationId, payload);
          break;

        case OCPPAction.MeterValues:
          response = await this.handleMeterValues(stationId, payload);
          break;

        default:
          console.warn(`Unhandled action: ${action}`);
          response = {};
      }

      // Send CALLRESULT
      this.sendCallResult(stationId, messageId, response);
    } catch (error: any) {
      // Send CALLERROR
      this.sendCallError(stationId, messageId, 'InternalError', error.message);
    }
  }

  /**
   * Handle BootNotification
   */
  private async handleBootNotification(stationId: string, payload: any): Promise<any> {
    console.log(`📡 Boot notification from ${stationId}:`, payload);

    // Update station info
    await this.db.query(
      `UPDATE charging_stations
       SET firmware_version = $1, model = $2, manufacturer = $3, is_online = true, last_heartbeat = NOW()
       WHERE station_id = $4`,
      [payload.chargingStation?.firmwareVersion, payload.chargingStation?.model,
       payload.chargingStation?.vendorName, stationId]
    );

    return {
      currentTime: new Date().toISOString(),
      interval: 300, // Heartbeat interval in seconds
      status: 'Accepted'
    };
  }

  /**
   * Handle Heartbeat
   */
  private async handleHeartbeat(stationId: string): Promise<any> {
    await this.db.query(
      'UPDATE charging_stations SET last_heartbeat = NOW() WHERE station_id = $1',
      [stationId]
    );

    return {
      currentTime: new Date().toISOString()
    };
  }

  /**
   * Handle StatusNotification
   */
  private async handleStatusNotification(stationId: string, payload: any): Promise<any> {
    const { connectorId, connectorStatus, evseId } = payload;

    console.log(`📊 Status update from ${stationId} connector ${connectorId}: ${connectorStatus}`);

    // Update connector status
    await this.db.query(
      `UPDATE charging_connectors
       SET status = $1, error_code = $2, updated_at = NOW()
       WHERE station_id = (SELECT id FROM charging_stations WHERE station_id = $3)
       AND connector_id = $4`,
      [connectorStatus, payload.errorCode, stationId, connectorId]
    );

    // Update station status (use worst connector status)
    await this.updateStationOverallStatus(stationId);

    this.emit('statusUpdate', { stationId, connectorId, status: connectorStatus });

    return {};
  }

  /**
   * Handle TransactionEvent (OCPP 2.0.1)
   */
  private async handleTransactionEvent(stationId: string, payload: any): Promise<any> {
    const { eventType, transactionInfo, meterValue, idToken } = payload;

    console.log(`💳 Transaction event from ${stationId}: ${eventType}`, transactionInfo);

    if (eventType === 'Started') {
      // Start new charging session
      const result = await this.db.query(
        `INSERT INTO charging_sessions
         (transaction_id, station_id, connector_id, vehicle_id, rfid_tag, start_time,
          meter_start, session_status, raw_ocpp_data)
         VALUES ($1, (SELECT id FROM charging_stations WHERE station_id = $2),
                 $3, $4, $5, NOW(), $6, 'Active', $7)
         RETURNING id',
        [
          transactionInfo.transactionId,
          stationId,
          payload.evse?.connectorId || 1,
          null, // Will be linked later based on RFID
          idToken?.idToken,
          meterValue?.[0]?.sampledValue?.[0]?.value || 0,
          JSON.stringify(payload)
        ]
      );

      this.emit('transactionStarted', {
        stationId,
        transactionId: transactionInfo.transactionId,
        sessionId: result.rows[0].id
      });
    } else if (eventType === 'Ended') {
      // Stop charging session
      const meterStop = meterValue?.[0]?.sampledValue?.[0]?.value || 0;

      await this.db.query(
        `UPDATE charging_sessions
         SET end_time = NOW(), meter_stop = $1, session_status = 'Completed',
             stop_reason = $2
         WHERE transaction_id = $3',
        [meterStop, transactionInfo.stoppedReason, transactionInfo.transactionId]
      );

      this.emit('transactionEnded', {
        stationId,
        transactionId: transactionInfo.transactionId
      });
    }

    return {};
  }

  /**
   * Handle MeterValues
   */
  private async handleMeterValues(stationId: string, payload: any): Promise<any> {
    const { evse, meterValue, transactionId } = payload;

    for (const meter of meterValue || []) {
      const timestamp = new Date(meter.timestamp);
      const values: any = {};

      // Parse sampled values
      for (const sample of meter.sampledValue || []) {
        switch (sample.measurand) {
          case 'Energy.Active.Import.Register':
            values.energy_active_import_wh = parseFloat(sample.value);
            break;
          case 'Power.Active.Import':
            values.power_active_import_w = parseFloat(sample.value);
            break;
          case 'Current.Import':
            values.current_import_amp = parseFloat(sample.value);
            break;
          case 'Voltage':
            values.voltage_v = parseFloat(sample.value);
            break;
          case 'SoC':
            values.soc_percent = parseFloat(sample.value);
            break;
        }
      }

      // Get session ID from transaction ID
      const sessionResult = await this.db.query(
        'SELECT id FROM charging_sessions WHERE transaction_id = $1',
        [transactionId]
      );

      if (sessionResult.rows.length > 0) {
        const sessionId = sessionResult.rows[0].id;

        // Insert meter values
        await this.db.query(
          `INSERT INTO charging_session_metrics
           (session_id, timestamp, energy_active_import_wh, power_active_import_w,
            current_import_amp, voltage_v, soc_percent, raw_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            sessionId,
            timestamp,
            values.energy_active_import_wh,
            values.power_active_import_w,
            values.current_import_amp,
            values.voltage_v,
            values.soc_percent,
            JSON.stringify(meter)
          ]
        );

        // Update session with latest values
        if (values.energy_active_import_wh) {
          const energyKwh = values.energy_active_import_wh / 1000;
          await this.db.query(
            `UPDATE charging_sessions
             SET energy_delivered_kwh = $1, avg_power_kw = $2, end_soc_percent = $3
             WHERE id = $4`,
            [
              energyKwh,
              values.power_active_import_w ? values.power_active_import_w / 1000 : null,
              values.soc_percent,
              sessionId
            ]
          );
        }
      }
    }

    return {};
  }

  /**
   * Remote start transaction
   */
  async remoteStartTransaction(request: StartTransactionRequest): Promise<any> {
    const { stationId, connectorId, idTag, vehicleId, driverId } = request;

    const payload = {
      idToken: {
        idToken: idTag,
        type: 'ISO14443'
      },
      evseId: connectorId,
      chargingProfile: null // Can add charging profile here
    };

    const response = await this.sendCall(stationId, OCPPAction.RemoteStartTransaction, payload);

    if (response.status === 'Accepted') {
      // Will create session when TransactionEvent is received
      console.log(`✅ Remote start accepted for station ${stationId}`);
    }

    return response;
  }

  /**
   * Remote stop transaction
   */
  async remoteStopTransaction(request: StopTransactionRequest): Promise<any> {
    const { transactionId } = request;

    // Get station ID from transaction
    const result = await this.db.query(
      `SELECT cs.transaction_id, cst.station_id
       FROM charging_sessions cs
       JOIN charging_stations cst ON cs.station_id = cst.id
       WHERE cs.transaction_id = $1',
      [transactionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    const { station_id } = result.rows[0];

    const response = await this.sendCall(station_id, OCPPAction.RemoteStopTransaction, {
      transactionId
    });

    return response;
  }

  /**
   * Create reservation
   */
  async createReservation(request: ReservationRequest): Promise<any> {
    const { stationId, connectorId, expiryDate, idTag, reservationId } = request;

    const payload = {
      id: reservationId,
      expiryDateTime: expiryDate.toISOString(),
      idToken: {
        idToken: idTag,
        type: 'ISO14443'
      },
      evseId: connectorId
    };

    const response = await this.sendCall(stationId, OCPPAction.ReserveNow, payload);

    if (response.status === 'Accepted') {
      // Update connector status
      await this.db.query(
        `UPDATE charging_connectors
         SET status = 'Reserved'
         WHERE station_id = (SELECT id FROM charging_stations WHERE station_id = $1)
         AND connector_id = $2',
        [stationId, connectorId]
      );
    }

    return response;
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(stationId: string, reservationId: number): Promise<any> {
    const response = await this.sendCall(stationId, OCPPAction.CancelReservation, {
      id: reservationId
    });

    return response;
  }

  /**
   * Set charging profile (Smart Charging)
   */
  async setChargingProfile(stationId: string, profile: ChargingProfile): Promise<any> {
    const response = await this.sendCall(stationId, OCPPAction.SetChargingProfile, {
      evseId: 1,
      chargingProfile: profile
    });

    return response;
  }

  /**
   * Send CALL message
   */
  private async sendCall(stationId: string, action: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const ws = this.connections.get(stationId);
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error(`Station ${stationId} not connected`));
        return;
      }

      const messageId = this.generateMessageId();
      const message = [MessageType.CALL, messageId, action, payload];

      // Set timeout
      const timeout = setTimeout(() => {
        this.pendingCalls.delete(messageId);
        reject(new Error(`Timeout waiting for response from ${stationId}`));
      }, 30000);

      this.pendingCalls.set(messageId, { resolve, reject, timeout });

      // Send message
      ws.send(JSON.stringify(message));

      // Log message
      this.logOCPPMessage(stationId, 'Outbound', MessageType.CALL, action, payload, messageId);
    });
  }

  /**
   * Send CALLRESULT
   */
  private sendCallResult(stationId: string, messageId: string, payload: any) {
    const ws = this.connections.get(stationId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const message = [MessageType.CALLRESULT, messageId, payload];
    ws.send(JSON.stringify(message));

    this.logOCPPMessage(stationId, 'Outbound', MessageType.CALLRESULT, '', payload, messageId);
  }

  /**
   * Send CALLERROR
   */
  private sendCallError(stationId: string, messageId: string, errorCode: string, errorDescription: string) {
    const ws = this.connections.get(stationId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const message = [MessageType.CALLERROR, messageId, errorCode, errorDescription, {}];
    ws.send(JSON.stringify(message));

    this.logOCPPMessage(stationId, 'Outbound', MessageType.CALLERROR, errorCode, { errorDescription }, messageId);
  }

  /**
   * Handle CALLRESULT
   */
  private handleCallResult(messageId: string, payload: any) {
    const pending = this.pendingCalls.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(payload);
      this.pendingCalls.delete(messageId);
    }
  }

  /**
   * Handle CALLERROR
   */
  private handleCallError(messageId: string, errorCode: string, errorDescription: any) {
    const pending = this.pendingCalls.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(`${errorCode}: ${errorDescription}`));
      this.pendingCalls.delete(messageId);
    }
  }

  /**
   * Update station status in database
   */
  private async updateStationStatus(stationId: string, updates: any) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }

    values.push(stationId);

    await this.db.query(
      'UPDATE charging_stations SET ${setClauses.join(', ')}, updated_at = NOW() WHERE station_id = $${paramIndex}',
      values
    );
  }

  /**
   * Update station overall status based on connector statuses
   */
  private async updateStationOverallStatus(stationId: string) {
    const result = await this.db.query(
      `SELECT status FROM charging_connectors
       WHERE station_id = (SELECT id FROM charging_stations WHERE station_id = $1)`,
      [stationId]
    );

    let worstStatus = 'Available';
    for (const row of result.rows) {
      if (row.status === 'Faulted') {
        worstStatus = 'Faulted';
        break;
      } else if (row.status === 'Charging' && worstStatus === 'Available') {
        worstStatus = 'Charging';
      } else if (row.status === 'Unavailable' && worstStatus === 'Available') {
        worstStatus = 'Unavailable';
      }
    }

    await this.db.query(
      'UPDATE charging_stations SET status = $1 WHERE station_id = $2',
      [worstStatus, stationId]
    );
  }

  /**
   * Log OCPP message
   */
  private async logOCPPMessage(
    stationId: string,
    direction: string,
    messageType: number,
    action: string,
    payload: any,
    messageId?: string
  ) {
    try {
      await this.db.query(
        `INSERT INTO ocpp_message_log
         (station_id, message_id, message_type, action, direction, payload)
         VALUES ((SELECT id FROM charging_stations WHERE station_id = $1), $2, $3, $4, $5, $6)`,
        [stationId, messageId, messageType === 2 ? 'CALL' : messageType === 3 ? 'CALLRESULT' : 'CALLERROR',
         action, direction, JSON.stringify(payload)]
      );
    } catch (error) {
      // Ignore logging errors
    }
  }

  /**
   * Get all connected stations
   */
  getConnectedStations(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Disconnect from station
   */
  disconnectStation(stationId: string) {
    const ws = this.connections.get(stationId);
    if (ws) {
      ws.close();
      this.connections.delete(stationId);
    }
  }

  /**
   * Disconnect all stations
   */
  disconnectAll() {
    for (const [stationId, ws] of this.connections) {
      ws.close();
    }
    this.connections.clear();
  }
}

export default OCPPService;
