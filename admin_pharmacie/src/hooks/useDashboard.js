import { useState } from 'react';

// Custom hook to manage dashboard state and logic
export const useDashboard = () => {
  const [activeNav, setActiveNav] = useState('hifi');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedValidation, setSelectedValidation] = useState([]);

  const [processingQueue] = useState([
    { id: 1, fileName: 'pharmacies_paris.csv', status: 'completed', progress: 100, lines: 234, errors: 5 },
    { id: 2, fileName: 'pharmacies_lyon.csv', status: 'geocoding', progress: 65, lines: 156, errors: 2 },
    { id: 3, fileName: 'pharmacies_marseille.csv', status: 'raw', progress: 0, lines: 0, errors: 0 }
  ]);

  const [validationData] = useState([
    { id: 1, name: 'Pharmacie du Centre', city: 'Paris', phone: '0142345678', email: 'contact@centre.fr', status: 'complete' },
    { id: 2, name: 'Pharmacie de la Gare', city: 'Paris', phone: '', email: 'gare@pharm.fr', status: 'warning' },
    { id: 3, name: 'Pharmacie Belleville', city: 'Paris', phone: '0145678901', email: '', status: 'warning' },
    { id: 4, name: 'Pharmacie St-Michel', city: 'Paris', phone: '0148901234', email: 'stmichel@pharm.fr', status: 'complete' },
    { id: 5, name: 'Pharmacie Marais', city: 'Paris', phone: '0143012345', email: 'marais@pharm.fr', status: 'complete' }
  ]);

  const [directoryData] = useState([
    { id: 1, name: 'Pharmacie de la Nuit', city: 'Paris', phone: '0142345678', guardType: 'Weekend', published: '2024-01-15' },
    { id: 2, name: 'Pharmacie 24H', city: 'Lyon', phone: '0478901234', guardType: '24h', published: '2024-01-14' },
    { id: 3, name: 'Pharmacie Emergency', city: 'Marseille', phone: '0491234567', guardType: 'Night', published: '2024-01-13' },
    { id: 4, name: 'Pharmacie Weekend', city: 'Toulouse', phone: '0561234567', guardType: 'Weekend', published: '2024-01-12' },
    { id: 5, name: 'Pharmacie Express', city: 'Nice', phone: '0493345678', guardType: 'Night', published: '2024-01-11' }
  ]);

  const [recentActivities] = useState([
    { id: 1, action: 'File Uploaded', file: 'pharmacies_paris.csv', time: '2 hours ago' },
    { id: 2, action: 'Geocoding Completed', file: 'pharmacies_lyon.csv', time: '4 hours ago' },
    { id: 3, action: 'Data Published', records: 234, time: '1 day ago' },
    { id: 4, action: 'Validation Started', file: 'pharmacies_marseille.csv', time: '2 days ago' }
  ]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = [...e.dataTransfer.files];
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024).toFixed(2),
      uploadedAt: new Date().toLocaleTimeString(),
      status: 'uploaded'
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  return {
    activeNav,
    setActiveNav,
    uploadedFiles,
    setUploadedFiles,
    dragActive,
    setDragActive,
    selectedValidation,
    setSelectedValidation,
    processingQueue,
    validationData,
    directoryData,
    recentActivities,
    handleDrag,
    handleDrop
  };
};
