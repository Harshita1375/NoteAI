import { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_RENDER_API_URL;

function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file); 
    
    try {
      const response = await axios.post(`${API_BASE}/process-docs`, formData);
      alert(`Success! ${response.data.message}`);
      onUploadSuccess(response.data.document_name);
      setFile(null); 
    } catch (error) {
      alert("Upload failed. Check console and ensure backend is running.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
      <h2>📚 Document Upload</h2>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])} 
        disabled={isUploading}
      />
      <button 
        onClick={handleUpload} 
        disabled={isUploading || !file}
        style={{ marginLeft: '10px' }}
      >
        {isUploading ? 'Processing...' : 'Upload & Process'}
      </button>
      {file && <p>Selected File: <strong>{file.name}</strong></p>}
    </div>
  );
}

export default FileUpload;