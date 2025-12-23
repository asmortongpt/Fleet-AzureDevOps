export interface VehicleMessage {
    type: 'SUBSCRIBE_VEHICLE' | 'UNSUBSCRIBE_VEHICLE';
    vehicleId: string;
    roomId: string;
}

export interface AlertMessage {
    type: 'ALERT';
    vehicleId: string;
    alertType: string;
    alertMessage: string;
}

export interface PingPongMessage {
    type: 'PING' | 'PONG';
}
