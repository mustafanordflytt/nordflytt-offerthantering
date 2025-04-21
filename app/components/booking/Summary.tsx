import React from 'react';
import { useFormContext } from '../../lib/FormContext';

const Summary: React.FC = () => {
  const { formData } = useFormContext();

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Summary</h2>
      <ul className="list-disc pl-5">
        <li>Customer Type: {formData.customerType}</li>
        <li>Name: {formData.name}</li>
        <li>Email: {formData.email}</li>
        <li>Phone: {formData.phone}</li>
        <li>Service Type: {formData.serviceType}</li>
        {/* Add more fields as necessary */}
      </ul>
    </div>
  );
};

export default Summary; 