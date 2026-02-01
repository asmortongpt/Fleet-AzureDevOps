import React from 'react';
import { useForm } from 'react-hook-form';
import logger from '@/utils/logger';

interface MileageData {
  startMileage: number;
  endMileage: number;
  purpose: string;
  date: string;
}

const MileageReimbursementForm: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MileageData>();
  
  const startMileage = watch('startMileage', 0);
  const endMileage = watch('endMileage', 0);
  const totalMiles = endMileage - startMileage;
  const reimbursement = totalMiles * 0.67; // FDOT rate
  
  const onSubmit = (data: MileageData) => {
    // logger.info('Mileage reimbursement:', { ...data, totalMiles, reimbursement });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-3 bg-gray-800 rounded-lg">
      <h2 className="text-base font-bold text-white mb-2">Mileage Reimbursement</h2>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-white mb-2">Start Mileage</label>
          <input 
            {...register('startMileage', { required: true, min: 0 })}
            type="number"
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        
        <div>
          <label className="block text-white mb-2">End Mileage</label>
          <input 
            {...register('endMileage', { required: true, min: 0 })}
            type="number"
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
      </div>
      
      <div className="mt-2">
        <label className="block text-white mb-2">Purpose</label>
        <input 
          {...register('purpose', { required: true })}
          type="text"
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
      </div>
      
      <div className="mt-2 p-2 bg-blue-900 rounded">
        <p className="text-white">Total Miles: {totalMiles}</p>
        <p className="text-white font-bold">Reimbursement: ${reimbursement.toFixed(2)}</p>
      </div>
      
      <button 
        type="submit"
        className="mt-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Submit Reimbursement Request
      </button>
    </form>
  );
};

export default MileageReimbursementForm;