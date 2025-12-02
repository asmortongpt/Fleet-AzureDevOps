import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import FleetDashboard from './components/modules/FleetDashboard';
import DriverPerformance from './components/modules/DriverPerformance';
import DataWorkbench from './components/modules/DataWorkbench';
import EVChargingManagement from './components/modules/EVChargingManagement';

/**
 * Main application component wrapped with Redux Provider for state management.
 */
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div>
        <FleetDashboard />
        <DriverPerformance />
        <DataWorkbench />
        <EVChargingManagement />
      </div>
    </Provider>
  );
};

export default App;