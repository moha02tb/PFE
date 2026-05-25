import React, { useState } from 'react';
import { mainContentStyles, cardStyles, buttonStyles, tableStyles, mapButtonStyles } from '../../styles/dashboard.styles';

const Validation = ({ validationData, selectedValidation, setSelectedValidation, onPublish, onReject }) => {
  const [mapPharmacy, setMapPharmacy] = useState(null);

  const handleSelectAll = (checked) => {
    setSelectedValidation(checked ? validationData.map(d => d.id) : []);
  };

  return (
    <div style={mainContentStyles.mainContent}>
      {/* Page Header */}
      <div style={mainContentStyles.topHeader}>
        <div>
          <h1 style={mainContentStyles.pageTitle}>Validation & Publication</h1>
          <p style={mainContentStyles.pageSubtitle}>Vérifiez et publiez les données des pharmacies</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          style={{
            ...buttonStyles.buttonPrimary,
            opacity: selectedValidation.length === 0 ? 0.5 : 1,
            cursor: selectedValidation.length === 0 ? 'not-allowed' : 'pointer',
          }}
          disabled={selectedValidation.length === 0}
          onClick={() => onPublish?.(selectedValidation)}
        >
          ✓ Publier la Sélection ({selectedValidation.length})
        </button>
        <button
          style={{
            ...buttonStyles.buttonSecondary,
            opacity: selectedValidation.length === 0 ? 0.5 : 1,
            cursor: selectedValidation.length === 0 ? 'not-allowed' : 'pointer',
          }}
          disabled={selectedValidation.length === 0}
          onClick={() => onReject?.(selectedValidation)}
        >
          ✕ Rejeter ({selectedValidation.length})
        </button>
      </div>

      {/* Validation Table */}
      <div style={cardStyles.card}>
        <div style={tableStyles.tableHeader}>
          <input
            type="checkbox"
            onChange={(e) => handleSelectAll(e.target.checked)}
            checked={selectedValidation.length === validationData.length}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ flex: 1, fontWeight: '600', color: '#374151' }}>Pharmacie</span>
          <span style={{ flex: 0.8, fontWeight: '600', color: '#374151' }}>Ville</span>
          <span style={{ flex: 1, fontWeight: '600', color: '#374151' }}>Contact</span>
          <span style={{ flex: 0.8, fontWeight: '600', color: '#374151' }}>Statut</span>
          <span style={{ flex: 0.5, fontWeight: '600', color: '#374151' }}></span>
        </div>

        <div style={tableStyles.tableBody}>
          {validationData.map((row) => (
            <div
              key={row.id}
              style={{
                ...tableStyles.tableRow,
                backgroundColor: row.status === 'warning' ? '#fffbeb' : 'transparent',
                borderLeft: `4px solid ${row.status === 'warning' ? '#f59e0b' : '#e5e7eb'}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = row.status === 'warning' ? '#fef3c7' : '#f8fafc';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = row.status === 'warning' ? '#fffbeb' : 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <input
                type="checkbox"
                checked={selectedValidation.includes(row.id)}
                onChange={() =>
                  setSelectedValidation(
                    selectedValidation.includes(row.id)
                      ? selectedValidation.filter(id => id !== row.id)
                      : [...selectedValidation, row.id]
                  )
                }
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ flex: 1, color: '#1f2937', fontWeight: '500' }}>{row.name}</span>
              <span style={{ flex: 0.8, color: '#6b7280' }}>{row.city}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#1f2937' }}>
                  {row.phone || '❌ Manquant'}
                </p>
                <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>
                  {row.email || '❌ Manquant'}
                </p>
              </div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '7px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: row.status === 'warning' ? '#fed7aa' : '#dcfce7',
                  color: row.status === 'warning' ? '#92400e' : '#166534'
                }}
              >
                {row.status === 'warning' ? '⚠️ Attention' : '✓ Complet'}
              </span>
              <button style={mapButtonStyles.mapButton} onClick={() => setMapPharmacy(row)} title="Voir sur la carte">🗺️</button>
            </div>
          ))}
        </div>
      </div>
      {mapPharmacy && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setMapPharmacy(null)}
        >
          <div
            style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>🗺️ {mapPharmacy.name}</h3>
              <button onClick={() => setMapPharmacy(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}><strong>Ville :</strong> {mapPharmacy.city}</p>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}><strong>Téléphone :</strong> {mapPharmacy.phone || '—'}</p>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}><strong>Email :</strong> {mapPharmacy.email || '—'}</p>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(mapPharmacy.name + ' ' + mapPharmacy.city)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...buttonStyles.buttonPrimary, textDecoration: 'none', display: 'inline-block', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
            >
              Ouvrir dans Google Maps →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Validation;
