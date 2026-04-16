import React from 'react';
import { mainContentStyles, cardStyles, buttonStyles, queueStyles, statusStyles } from '../../styles/dashboard.styles';

const Processing = ({ processingQueue }) => {
  return (
    <div style={mainContentStyles.mainContent}>
      {/* Page Header */}
      <div style={mainContentStyles.topHeader}>
        <div>
          <h1 style={mainContentStyles.pageTitle}>Traitement & Géocodage</h1>
          <p style={mainContentStyles.pageSubtitle}>Gérez la file d'attente de traitement et les opérations de géocodage</p>
        </div>
        <button style={buttonStyles.buttonPrimary}>🚀 Lancer le Géocodage</button>
      </div>

      {/* Queue Table */}
      <div style={cardStyles.card}>
        <h2 style={cardStyles.cardTitle}>File d'Attente de Traitement</h2>
        <div style={queueStyles.queueTable}>
          {processingQueue.map((item) => (
            <div
              key={item.id}
              style={queueStyles.queueRow}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
                  {item.fileName}
                </p>
                <div style={queueStyles.queueRow}>
                  <div style={{ ...queueStyles.progressBar, marginLeft: 0 }}>
                    <div style={{ ...queueStyles.progressFill, width: `${item.progress}%` }}></div>
                  </div>
                </div>
              </div>

              <div style={queueStyles.statusBadgeContainer}>
                <span
                  style={{
                    ...queueStyles.statusBadge,
                    backgroundColor:
                      item.status === 'completed'
                        ? '#d1fae5'
                        : item.status === 'geocoding'
                        ? '#fef3c7'
                        : '#f3f4f6',
                    color:
                      item.status === 'completed'
                        ? '#065f46'
                        : item.status === 'geocoding'
                        ? '#92400e'
                        : '#4b5563'
                  }}
                >
                  {item.status === 'completed'
                    ? '✓ TERMINÉ'
                    : item.status === 'geocoding'
                    ? '⟳ GÉOCODAGE EN COURS'
                    : '◯ BRUTE'}
                </span>
              </div>

              <div style={queueStyles.queueStats}>
                <span style={queueStyles.statBadge}>{item.lines} lignes</span>
                <span style={queueStyles.statBadge}>{item.errors} erreurs</span>
              </div>

              <button style={buttonStyles.buttonSmall}>⚙️</button>
            </div>
          ))}
        </div>
      </div>

      {/* Processing Status */}
      <div style={{ ...cardStyles.card, marginTop: '24px' }}>
        <h2 style={cardStyles.cardTitle}>État du Système</h2>
        <div style={statusStyles.statusList}>
          <div style={statusStyles.statusItem}>
            <span style={{ ...statusStyles.statusIndicator, backgroundColor: '#10b981' }} />
            <span>Service de Géocodage Actif</span>
          </div>
          <div style={statusStyles.statusItem}>
            <span style={{ ...statusStyles.statusIndicator, backgroundColor: '#10b981' }} />
            <span>Queue Traitée: 156/234 fichiers</span>
          </div>
          <div style={statusStyles.statusItem}>
            <span style={{ ...statusStyles.statusIndicator, backgroundColor: '#fbbf24' }} />
            <span>Temps d'Attente Estimé: 12 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Processing;
