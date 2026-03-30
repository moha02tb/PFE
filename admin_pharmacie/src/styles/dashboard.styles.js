// Dashboard Container & Layout Styles
export const dashboardStyles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    overflow: 'hidden'
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  headerBar: {
    height: '72px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e8ecf1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: '40px',
    paddingRight: '40px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
  },
  headerBreadcrumb: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
    letterSpacing: '0.3px'
  },
  headerRight: {
    display: 'flex',
    gap: '12px'
  },
  headerButton: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.2s ease'
  }
};

export const mainContentStyles = {
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '40px',
    animation: 'slideUp 0.4s ease-out'
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '36px',
    gap: '20px',
    flexWrap: 'wrap'
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px'
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0',
    fontWeight: '500'
  }
};

export const cardStyles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    animation: 'slideUp 0.4s ease-out'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 28px 0',
    letterSpacing: '-0.3px'
  }
};

export const statsGridStyles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '22px',
    marginBottom: '36px'
  }
};

export const buttonStyles = {
  buttonPrimary: {
    padding: '13px 28px',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
    letterSpacing: '-0.2px'
  },
  buttonSecondary: {
    padding: '13px 28px',
    backgroundColor: 'white',
    color: '#ef4444',
    border: '2px solid #ef4444',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '-0.2px'
  },
  buttonSmall: {
    padding: '8px 14px',
    backgroundColor: 'white',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    transition: 'all 0.2s ease'
  }
};

export const tableStyles = {
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px 10px 0 0',
    borderBottom: '2px solid #e2e8f0',
    fontSize: '13px'
  },
  tableBody: {
    display: 'flex',
    flexDirection: 'column'
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    transition: 'all 0.2s ease'
  }
};

export const filterStyles = {
  filterBar: {
    display: 'flex',
    gap: '14px',
    marginBottom: '28px',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: '280px',
    padding: '11px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: 'white',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  filterSelect: {
    padding: '11px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  }
};
export const activityStyles = {
    activityFeed: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    activityItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px'
    },
    activityDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: '#667eea',
      marginTop: '6px'
    },
    activityContent: {
      flex: 1
    },
    activityAction: {
      margin: 0,
      fontWeight: '600',
      color: '#334155'
    },
    activityDetail: {
      margin: '4px 0 0',
      fontSize: '13px',
      color: '#64748b'
    },
    activityTime: {
      fontSize: '12px',
      color: '#94a3b8',
      fontWeight: '500'
    }
  };
  export const fileUploadStyles = {
    dragDropZone: {
      border: '2px dashed #e2e8f0',
      borderRadius: '14px',
      textAlign: 'center',
      padding: '48px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backgroundColor: '#f8fafc',
    },
    dragDropZoneActive: {
      borderColor: '#667eea',
      backgroundColor: 'white',
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
    },
    fileList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginTop: '24px'
    },
    fileItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '10px',
      transition: 'all 0.2s ease'
    },
    fileIcon: {
      fontSize: '24px'
    },
    fileName: {
      margin: 0,
      fontWeight: '600',
      color: '#334155',
      fontSize: '14px'
    },
    fileInfo: {
      margin: '4px 0 0',
      fontSize: '12px',
      color: '#64748b'
    },
    progressBar: {
      flex: 1,
      height: '6px',
      backgroundColor: '#e2e8f0',
      borderRadius: '3px',
      overflow: 'hidden',
      marginLeft: '16px',
      marginRight: '16px'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#10b981',
      borderRadius: '3px'
    },
    fileStatus: {
      fontSize: '20px',
      color: '#10b981'
    }
  };
  
    export const summaryStyles = {
  
      summaryGrid: {
  
        display: 'grid',
  
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  
        gap: '24px',
  
        paddingTop: '16px'
  
      },
  
      summaryItem: {
  
        display: 'flex',
  
        flexDirection: 'column',
  
        gap: '6px',
  
        backgroundColor: '#f8fafc',
  
        padding: '20px',
  
        borderRadius: '10px'
  
      },
  
      summaryLabel: {
  
        fontSize: '13px',
  
        color: '#64748b',
  
        fontWeight: '500'
  
      },
  
      summaryValue: {
  
        fontSize: '24px',
  
        fontWeight: '800',
  
        color: '#0f172a'
  
      }
  
    };
  
    export const queueStyles = {
  
      queueTable: {
  
        display: 'flex',
  
        flexDirection: 'column',
  
        gap: '12px',
  
      },
  
      queueRow: {
  
        display: 'flex',
  
        alignItems: 'center',
  
        padding: '16px',
  
        backgroundColor: '#f8fafc',
  
        borderRadius: '10px',
  
        transition: 'all 0.2s ease',
  
        gap: '16px',
  
      },
  
      progressBar: {
  
        flex: 1,
  
        height: '8px',
  
        backgroundColor: '#e2e8f0',
  
        borderRadius: '4px',
  
        overflow: 'hidden',
  
        minWidth: '100px',
  
      },
  
      progressFill: {
  
        height: '100%',
  
        backgroundColor: '#667eea',
  
        borderRadius: '4px',
  
      },
  
      statusBadgeContainer: {
  
        width: '180px',
  
        textAlign: 'center',
  
      },
  
      statusBadge: {
  
        display: 'inline-block',
  
        padding: '6px 14px',
  
        borderRadius: '9999px',
  
        fontSize: '11px',
  
        fontWeight: '700',
  
        letterSpacing: '0.5px',
  
      },
  
      queueStats: {
  
        display: 'flex',
  
        gap: '12px',
  
        alignItems: 'center',
  
      },
  
      statBadge: {
  
        padding: '4px 10px',
  
        backgroundColor: '#f1f5f9',
  
        borderRadius: '6px',
  
        fontSize: '12px',
  
        fontWeight: '600',
  
        color: '#475569',
  
      },
  
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
    
  
    export const statusStyles = {
  
      statusList: {
  
        display: 'flex',
  
        flexDirection: 'column',
  
        gap: '16px',
  
      },
  
      statusItem: {
  
        display: 'flex',
  
        alignItems: 'center',
  
        gap: '12px',
  
        fontSize: '14px',
  
        fontWeight: '500',
  
        color: '#334155',
  
      },
  
      statusIndicator: {
  
        width: '10px',
  
        height: '10px',
  
        borderRadius: '50%',
  
      },
  
    };
  
    
