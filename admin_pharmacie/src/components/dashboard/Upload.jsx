import React from 'react';
import { mainContentStyles, cardStyles, buttonStyles, fileUploadStyles, summaryStyles } from '../../styles/dashboard.styles';

const Upload = ({ uploadedFiles, setUploadedFiles, dragActive, setDragActive, handleDrag, handleDrop }) => {
  return (
    <div style={mainContentStyles.mainContent}>
      {/* Page Header */}
      <div style={mainContentStyles.topHeader}>
        <div>
          <h1 style={mainContentStyles.pageTitle}>Import de Fichiers</h1>
          <p style={mainContentStyles.pageSubtitle}>Téléchargez vos fichiers CSV ou Excel de pharmacies</p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        style={{
          ...cardStyles.card,
          ...fileUploadStyles.dragDropZone,
          ...(dragActive ? fileUploadStyles.dragDropZoneActive : {})
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div style={{ fontSize: '56px', marginBottom: '20px', animation: dragActive ? 'popIn 0.3s ease-out' : 'none' }}>
          📤
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.3px' }}>
          Glissez et déposez vos fichiers ici
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0', fontWeight: '500' }}>
          ou cliquez pour parcourir (CSV, Excel, JSON)
        </p>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div style={{ ...cardStyles.card, marginTop: '24px' }}>
          <h2 style={cardStyles.cardTitle}>Fichiers Téléchargés</h2>
          <div style={fileUploadStyles.fileList}>
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                style={fileUploadStyles.fileItem}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={fileUploadStyles.fileIcon}>📄</span>
                <div style={{ flex: 1 }}>
                  <p style={fileUploadStyles.fileName}>{file.name}</p>
                  <p style={fileUploadStyles.fileInfo}>{file.size} KB · {file.uploadedAt}</p>
                </div>
                <div style={fileUploadStyles.progressBar}>
                  <div style={{ ...fileUploadStyles.progressFill, width: '100%' }}></div>
                </div>
                <span style={fileUploadStyles.fileStatus}>✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Summary */}
      {uploadedFiles.length > 0 && (
        <div style={{ ...cardStyles.card, marginTop: '24px', borderTop: '4px solid #10b981' }}>
          <h2 style={cardStyles.cardTitle}>Résumé de l'Import</h2>
          <div style={summaryStyles.summaryGrid}>
            <div style={summaryStyles.summaryItem}>
              <span style={summaryStyles.summaryLabel}>Fichiers Téléchargés</span>
              <span style={summaryStyles.summaryValue}>{uploadedFiles.length}</span>
            </div>
            <div style={summaryStyles.summaryItem}>
              <span style={summaryStyles.summaryLabel}>Lignes Totales</span>
              <span style={summaryStyles.summaryValue}>2,847</span>
            </div>
            <div style={summaryStyles.summaryItem}>
              <span style={summaryStyles.summaryLabel}>Lignes Valides</span>
              <span style={{ ...summaryStyles.summaryValue, color: '#10b981' }}>2,756</span>
            </div>
            <div style={summaryStyles.summaryItem}>
              <span style={summaryStyles.summaryLabel}>Erreurs</span>
              <span style={{ ...summaryStyles.summaryValue, color: '#ef4444' }}>91</span>
            </div>
          </div>
          <button
            style={{ ...buttonStyles.buttonPrimary, marginTop: '24px', width: '100%' }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.5)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)')}
          >
            Commencer le Géocodage →
          </button>
        </div>
      )}
    </div>
  );
};

export default Upload;
