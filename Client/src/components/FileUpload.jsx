import { useState } from 'react';
import axios from 'axios';
import './FileUpload.css';

const API_BASE = import.meta.env.VITE_RENDER_API_URL;

function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); 

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    
    setUploadStatus('Uploading...');
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file); 
    
    try {
      const response = await axios.post(`${API_BASE}/process-docs`, formData);
      setUploadStatus(`✅ Success! Document "${response.data.document_name}" processed.`);
      onUploadSuccess(response.data.document_name);
      setFile(null); 
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Check console and ensure backend is running.";
      setUploadStatus(`❌ Upload failed: ${errorMessage}`);
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card file-upload-card">
      <h2>📚 Document Upload</h2>
        
      <div className="action-group">
        {/* File input is styled by the global CSS for type="file" */}
        <input 
          type="file" 
          onChange={(e) => {
            setFile(e.target.files[0]);
            setUploadStatus('');
          }} 
          disabled={isUploading}
        />
        <button 
          onClick={handleUpload} 
          disabled={isUploading || !file}
          className="btn btn-primary"
        >
          {isUploading ? 'Processing...' : 'Upload & Process'}
        </button>
      </div>
      
      {file && !isUploading && (
        <p style={{ fontSize: '0.9em', color: '#aaaaaa' }}>Selected: <strong>{file.name}</strong></p>
      )}
      {uploadStatus && (
        <p className={`upload-status ${uploadStatus.startsWith('❌') ? 'error' : 'success'}`}>
          {uploadStatus}
        </p>
      )}
    </div>
  );
}

export default FileUpload;