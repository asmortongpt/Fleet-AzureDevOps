import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import { useTenantId } from '../../hooks/useTenantId';
import { logger } from '../../utils/logger';
import { validateLicenseData } from '../../utils/validation';

import { Alert } from './Alert';
import { AllocationAssignment } from './AllocationAssignment';
import { LicenseBar } from './LicenseBar';
import { RenewalCalendar } from './RenewalCalendar';

interface License {
  id: string;
  name: string;
  seatsUsed: number;
  totalSeats: number;
  renewalDate: string;
}

const LicenseManagement: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [error, setError] = useState<string | null>(null);
  const tenantId = useTenantId();

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await axios.get(`/api/licenses`, {
          params: { tenant_id: tenantId },
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });

        if (validateLicenseData(response?.data)) {
          setLicenses(response?.data as License[]);
        } else {
          throw new Error('Invalid license data received');
        }
      } catch (err) {
        logger.error('Error fetching licenses', err);
        setError('Failed to load licenses. Please try again later.');
      }
    };

    if (tenantId) {
      fetchLicenses();
    }
  }, [tenantId]);

  return (
    <>
      <Helmet>
        <title>License Management</title>
        <meta http-equiv="Content-Security-Policy" content="default-src 'self';" />
        <meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
      </Helmet>
      <div className="license-management">
        <h1>License Management</h1>
        {error && <Alert message={error} type="error" />}
        <div className="license-list">
          {licenses?.map((license) => (
            <div key={license?.id} className="license-item">
              <h2>{license?.name}</h2>
              <LicenseBar seatsUsed={license?.seatsUsed} totalSeats={license?.totalSeats} />
              <RenewalCalendar renewalDate={license?.renewalDate} />
              <AllocationAssignment licenseId={license?.id} />
              {license?.seatsUsed > license?.totalSeats && (
                <Alert message="Over allocation detected!" type="warning" />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default LicenseManagement;