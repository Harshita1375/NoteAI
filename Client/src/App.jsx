import { useState } from 'react'
import FileUpload from './components/FileUpload.jsx';
import QnA from './components/QnA.jsx';

const API_BASE = import.meta.env.VITE_RENDER_API_URL;

function App() {
  const [activeDocument, setActiveDocument] = useState(null);

  const handleUploadSuccess = (docName) => {
    setActiveDocument(docName);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>RAG Notebook (API: {API_BASE})</h1>
      <p>This application uses FastAPI for the backend RAG pipeline and a React frontend for file upload and Q&A.</p>
      
      {/* Upload Component */}
      <FileUpload onUploadSuccess={handleUploadSuccess} />

      <hr style={{ margin: '30px 0' }}/>

      {/* Q&A Component */}
      <QnA documentName={activeDocument} />
    </div>
  )
}

export default App