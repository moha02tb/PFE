// Component-Specific Styles
export const sidebarStyles = {
  sidebar: {
    width: '280px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
    overflowY: 'auto'
  },
  logo: {
    fontSize: '16px',
    fontWeight: '800',
    textAlign: 'center',
    padding: '28px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    marginBottom: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    letterSpacing: '-0.5px'
  },
  logoIcon: {
    fontSize: '32px'
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '16px 12px'
  },
  navItem: {
    padding: '12px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: 'white',
    fontWeight: '600',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
  },
  navIcon: {
    fontSize: '16px'
  },
  sidebarFooter: {
    padding: '16px 12px',
    borderTop: '1px solid rgba(255,255,255,0.12)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: '10px',
    transition: 'all 0.2s ease'
  },
  profileAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
  },
  profileInfo: {
    flex: 1
  },
  profileName: {
    margin: '0',
    fontSize: '12px',
    fontWeight: '700'
  },
  profileEmail: {
    margin: '0',
    fontSize: '11px',
    opacity: 0.8
  },
  logoutButton: {
    padding: '10px 14px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px',
    transition: 'all 0.3s ease'
  }
};

export const statCardStyles = {
  statCard: {
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '26px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, white 0%, rgba(102, 126, 234, 0.02) 100%)'
  },
  statIcon: {
    fontSize: '36px',
    marginBottom: '14px'
  },
  statLabel: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    margin: '0 0 10px 0',
    fontWeight: '700',
    letterSpacing: '0.8px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 8px 0'
  },
  statChange: {
    fontSize: '12px',
    fontWeight: '700'
  }
};

export const fileUploadStyles = {
  dragDropZone: {
    border: '3px dashed #cbd5e1',
    backgroundColor: '#f8fafc',
    padding: '80px 40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '14px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
  },
  dragDropZoneActive: {
    border: '3px dashed #667eea',
    backgroundColor: '#f0f4ff',
    transform: 'scale(1.02)',
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    border: '1px solid #e2e8f0'
  },
  fileIcon: {
    fontSize: '28px'
  },
  fileName: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a'
  },
  fileInfo: {
    margin: '0',
    fontSize: '12px',
    color: '#94a3b8'
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginLeft: '16px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '4px'
  },
  fileStatus: {
    color: '#10b981',
    fontSize: '18px',
    fontWeight: '700'
  }
};

export const summaryStyles = {
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '20px',
    marginBottom: '28px'
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a'
  }
};

export const queueStyles = {
  queueTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  queueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    borderLeft: '4px solid #667eea',
    transition: 'all 0.2s ease',
    border: '1px solid #e2e8f0'
  },
  statusBadgeContainer: {
    minWidth: '140px'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '7px 14px',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.2px'
  },
  queueStats: {
    display: 'flex',
    gap: '10px',
    minWidth: '140px'
  },
  statBadge: {
    padding: '6px 12px',
    backgroundColor: 'white',
    color: '#64748b',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    border: '1px solid #e2e8f0'
  }
};

export const activityStyles = {
  activityFeed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    paddingBottom: '18px',
    borderBottom: '1px solid #f1f5f9'
  },
  activityDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    marginTop: '5px',
    flexShrink: 0,
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
  },
  activityContent: {
    flex: 1
  },
  activityAction: {
    margin: '0 0 4px 0',
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a'
  },
  activityDetail: {
    margin: '0',
    fontSize: '13px',
    color: '#64748b'
  },
  activityTime: {
    fontSize: '12px',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
    fontWeight: '500'
  }
};

export const statusStyles = {
  statusList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
    border: '1px solid #e2e8f0'
  },
  statusIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
  }
};

export const mapButtonStyles = {
  mapButton: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    fontWeight: '500'
  }
};
