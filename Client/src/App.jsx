import { useState } from 'react'
import FileUpload from './components/FileUpload.jsx';
import QnA from './components/QnA.jsx';
import './App.css'; 

const API_BASE = import.meta.env.VITE_RENDER_API_URL;

function App() {
  const [activeDocument, setActiveDocument] = useState(null);

  const handleUploadSuccess = (docName) => {
    setActiveDocument(docName);
  };

  return (
    <div className="app-container">
      <h1>Note AI</h1>
      {/* Added a class for styling the subtitle paragraph */}
      <p className="subtitle">
        This application uses FastAPI for the backend RAG pipeline and a React frontend for file upload and Q&A.
        <br />
        <h2>Upload a document and start asking questions!</h2>
      </p>
      
      <FileUpload onUploadSuccess={handleUploadSuccess} />

      <QnA documentName={activeDocument} />
    </div>
  )
}

export default App