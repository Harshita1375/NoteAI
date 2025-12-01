import { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_RENDER_API_URL;

function QnA({ documentName }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('Ask a question once a document is uploaded.');
  const [sources, setSources] = useState([]); // <-- NEW STATE
  const [isAsking, setIsAsking] = useState(false);

  const handleAsk = async () => {
    if (!documentName) {
      alert("Please upload and process a document first.");
      return;
    }
    if (!question.trim()) {
      alert("Please enter a question.");
      return;
    }

    setIsAsking(true);
    setAnswer('Searching...');
    setSources([]); // Clear sources on new question
    
    try {
      const response = await axios.post(`${API_BASE}/ask-doc`, {
        document_name: documentName,
        question: question.trim()
      });

      // Extract both answer and sources from the backend response
      setAnswer(response.data.answer); 
      setSources(response.data.sources || []); // Safely set sources
    } catch (error) {
      console.error("Q&A error:", error);
      setAnswer(`Error: Failed to get an answer. ${error.response?.data?.detail || error.message}`);
      setSources([]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>💬 Ask a Question</h2>
      <p>Active Document: <strong>{documentName || 'None'}</strong></p>
      
      {/* Input and Button remain the same */}
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter your question here..."
        disabled={!documentName || isAsking}
        style={{ width: '80%', padding: '8px', marginRight: '10px' }}
      />
      <button 
        onClick={handleAsk} 
        disabled={!documentName || isAsking || !question.trim()}
      >
        {isAsking ? 'Searching...' : 'Ask RAG'}
      </button>

      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
        <h3>AI Answer:</h3>
        {/* Display the main answer/context */}
        <p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p>
        
        {/* Display Sources if available */}
        {sources.length > 0 && (
          <div style={{ marginTop: '15px', padding: '10px', borderLeft: '3px solid #007bff', backgroundColor: '#f0f8ff' }}>
            <strong>Sources:</strong>
            <ul>
              {sources.map((src, index) => (
                <li key={index} style={{ fontSize: '0.9em' }}>{src}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default QnA;