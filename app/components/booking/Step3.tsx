import React from 'react';
import { useFormContext } from '../../lib/FormContext';

const Step3: React.FC = () => {
  const { formData, setFormData } = useFormContext();

  const handleServiceTypeChange = (type: string) => {
    setFormData({ ...formData, serviceType: type });
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Select Service Type</h2>
      <div className="flex space-x-4">
        <button onClick={() => handleServiceTypeChange('moving')} className={`btn ${formData.serviceType === 'moving' ? 'btn-active' : ''}`}>Moving</button>
        <button onClick={() => handleServiceTypeChange('cleaning')} className={`btn ${formData.serviceType === 'cleaning' ? 'btn-active' : ''}`}>Cleaning</button>
      </div>
    </div>
  );
};

export default Step3; 