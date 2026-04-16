import React, { useState } from 'react';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) {
      setMessageType('error');
      setMessage('Veuillez sélectionner un fichier');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMessageType('success');
        setMessage('Fichier uploadé avec succès: ' + data.message);
        setFile(null);
      } else {
        const error = await response.json();
        setMessageType('error');
        setMessage('Erreur lors de l\'upload: ' + (error.detail || 'Erreur inconnue'));
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Erreur de connexion au serveur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Importer des Pharmacies</h1>
      <p>Uploadez un fichier CSV ou Excel contenant les données des pharmacies.</p>

      <div style={{
        border: '2px dashed #3498db',
        borderRadius: '8px',
        padding: '30px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        marginBottom: '20px'
      }}>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          style={{ marginBottom: '15px' }}
        />
        {file && <p style={{ color: '#27ae60', fontWeight: 'bold' }}>Fichier sélectionné: {file.name}</p>}
      </div>

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#95a5a6' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginRight: '10px'
        }}
      >
        {loading ? 'Upload en cours...' : 'Uploader'}
      </button>

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
          color: messageType === 'success' ? '#155724' : '#721c24',
          borderRadius: '4px',
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default UploadPage;
