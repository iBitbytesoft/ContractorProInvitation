import React, { useEffect, useState } from 'react';
import { getInvitationStatus } from '../lib/firebase';

interface EmployeeCardProps {
  email: string;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ email }) => {
  const [status, setStatus] = useState<string>('loading');

  useEffect(() => {
    const fetchStatus = async () => {
      const invitationStatus = await getInvitationStatus(email);
      setStatus(invitationStatus);
    };
    fetchStatus();
  }, []); // Removed email from dependency array

  return (
    <div className="employee-card">
      <h3>Employee: {email}</h3>
      <p>Status: {status}</p>
    </div>
  );
};

export default EmployeeCard;
