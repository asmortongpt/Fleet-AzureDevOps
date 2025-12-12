import React from 'react';
import { Vehicle } from '../types/Vehicle';

interface VehicleListProps {
  vehicles: Vehicle[];
}

const VehicleList: React.FC<VehicleListProps> = ({ vehicles }) => {
  if (!vehicles || vehicles.length === 0) {
    return <div>No vehicles found.</div>;
  }

  return (
    <ul>
      {vehicles.map((vehicle, index) => (
        <li key={index}>{vehicle.name}</li>
      ))}
    </ul>
  );
};

export default VehicleList;