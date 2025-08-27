import React from 'react';
import { useState } from 'react';
import { useFormContext } from '../../lib/FormContext';

const Step1: React.FC = () => {
  const { formData, setFormData } = useFormContext();
  const [customerType, setCustomerType] = useState(formData.customerType);

  const handleCustomerTypeChange = (type: string) => {
    setCustomerType(type);
    setFormData({ ...formData, customerType: type });
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Select Customer Type</h2>
      <div className="flex space-x-4">
        <button onClick={() => handleCustomerTypeChange('individual')} className={`btn ${customerType === 'individual' ? 'btn-active' : ''}`}>Individual</button>
        <button onClick={() => handleCustomerTypeChange('business')} className={`btn ${customerType === 'business' ? 'btn-active' : ''}`}>Business</button>
      </div>
    </div>
  );
};

export default Step1; 