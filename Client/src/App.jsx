import { useState } from 'react'
import axios from 'axios'

// Get the API URL from the environment (Vite exposes VITE_ prefixed variables)
const API_BASE = import.meta.env.VITE_RENDER_API_URL;

function App() {
  const [file, setFile] = useState(null)

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    
    const formData = new FormData();
    formData.append('files', file); 
    
    try {
        // Now using the environment variable for the API call
        const response = await axios.post(`${API_BASE}/process-docs`, formData);
        alert(`Success! Response: ${response.data.message}`);
    } catch (error) {
        alert("Upload failed. Check console and ensure backend is running.");
        console.error("Upload error:", error);
    }
  }

  return (
    <div>
      <h1>RAG Notebook (API: {API_BASE})</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload & Process</button>
    </div>
  )
}

export default App