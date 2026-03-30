import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Overview from '../components/dashboard/Overview';
import Upload from '../components/dashboard/Upload';
import Processing from '../components/dashboard/Processing';
import Validation from '../components/dashboard/Validation';
import Directory from '../components/dashboard/Directory';
import HiFiDashboard from './HiFiDashboard';
import { useDashboard } from '../hooks/useDashboard';

const Dashboard = ({ onLogout }) => {
  const {
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
  } = useDashboard();

  if (activeNav === 'hifi') {
    return <HiFiDashboard onBack={() => setActiveNav('overview')} onLogout={onLogout} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground font-sans">

      {/* Sidebar */}
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} onLogout={onLogout} />

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 w-full h-full overflow-hidden relative">
        {/* Header */}
        <Header activeNav={activeNav} />

        {/* Views Router */}
        {activeNav === 'overview' && <Overview recentActivities={recentActivities} />}
        {activeNav === 'import' && (
          <Upload
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            dragActive={dragActive}
            setDragActive={setDragActive}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
          />
        )}
        {activeNav === 'processing' && <Processing processingQueue={processingQueue} />}
        {activeNav === 'validation' && (
          <Validation
            validationData={validationData}
            selectedValidation={selectedValidation}
            setSelectedValidation={setSelectedValidation}
          />
        )}
        {activeNav === 'directory' && <Directory directoryData={directoryData} />}
      </div>
    </div>
  );
};

export default Dashboard;
