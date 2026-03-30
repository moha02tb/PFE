import React from 'react';
import { mainContentStyles, cardStyles, tableStyles, filterStyles } from '../../styles/dashboard.styles';

const Directory = ({ directoryData }) => {
  return (
    <div style={mainContentStyles.mainContent}>
      {/* Page Header */}
      <div style={mainContentStyles.topHeader}>
        <div>
          <h1 style={mainContentStyles.pageTitle}>Annuaire des Pharmacies</h1>
          <p style={mainContentStyles.pageSubtitle}>Liste des pharmacies de garde publiées et actives</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={filterStyles.filterBar}>
        <input
          type="text"
          placeholder="🔍 Rechercher une pharmacie..."
          style={filterStyles.searchInput}
        />
        <select style={filterStyles.filterSelect}>
          <option>Toutes les villes</option>
          <option>Paris</option>
          <option>Lyon</option>
          <option>Marseille</option>
          <option>Toulouse</option>
          <option>Nice</option>
        </select>
        <select style={filterStyles.filterSelect}>
          <option>Tous les types de garde</option>
          <option>24h</option>
          <option>Weekend</option>
          <option>Night</option>
        </select>
      </div>

      {/* Directory Table */}
      <div style={cardStyles.card}>
        <div style={tableStyles.tableHeader}>
          <span style={{ flex: 1.5, fontWeight: '600', color: '#374151' }}>Pharmacie</span>
          <span style={{ flex: 0.8, fontWeight: '600', color: '#374151' }}>Ville</span>
          <span style={{ flex: 1, fontWeight: '600', color: '#374151' }}>Téléphone</span>
          <span style={{ flex: 0.8, fontWeight: '600', color: '#374151' }}>Type de Garde</span>
          <span style={{ flex: 0.8, fontWeight: '600', color: '#374151' }}>Publié</span>
        </div>

        <div style={tableStyles.tableBody}>
          {directoryData.map((row) => (
            <div
              key={row.id}
              style={tableStyles.tableRow}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ flex: 1.5, color: '#1f2937', fontWeight: '500' }}>{row.name}</span>
              <span style={{ flex: 0.8, color: '#6b7280' }}>{row.city}</span>
              <span style={{ flex: 1, color: '#667eea', fontWeight: '500' }}>📞 {row.phone}</span>
              <span
                style={{
                  flex: 0.8,
                  display: 'inline-block',
                  padding: '7px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: row.guardType === '24h' ? '#dbeafe' : '#e9d5ff',
                  color: row.guardType === '24h' ? '#1e40af' : '#6b21a8'
                }}
              >
                {row.guardType}
              </span>
              <span style={{ flex: 0.8, color: '#9ca3af', fontSize: '13px' }}>{row.published}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Directory;
