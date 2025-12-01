import { useState } from 'react';
import axios from 'axios';
// No need for inline styles or color definitions here, relying on CSS classes

const API_BASE = import.meta.env.VITE_RENDER_API_URL;

function QnA({ documentName }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('Ask a question once a document is uploaded.');
  const [sources, setSources] = useState([]);
  const [isAsking, setIsAsking] = useState(false);

  const handleAsk = async () => {
    if (!documentName) {
      setAnswer("Error: Please upload and process a document first.");
      setSources([]);
      return;
    }
    if (!question.trim()) {
      setAnswer("Error: Please enter a question.");
      setSources([]);
      return;
    }

    setIsAsking(true);
    setAnswer('🔍 Searching and generating answer...');
    setSources([]);
    
    try {
      const response = await axios.post(`${API_BASE}/ask-doc`, {
        document_name: documentName,
        question: question.trim()
      });

      setAnswer(response.data.answer); 
      setSources(response.data.sources || []);
    } catch (error) {
      console.error("Q&A error:", error);
      setAnswer(`Error: Failed to get an answer. ${error.response?.data?.detail || error.message}`);
      setSources([]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="card qna-card">
      <h2>💬 Ask a Question</h2>
      <p className="active-doc-status" style={{ color: '#aaaaaa' }}>
        Active Document: 
        <strong className={documentName ? 'active' : 'inactive'}>
          {documentName || 'None'}
        </strong>
      </p>
      
      <div className="action-group">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question here (e.g., 'summarize' or 'what is the main topic?')"
          disabled={!documentName || isAsking}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && documentName && question.trim() && !isAsking) {
              handleAsk();
            }
          }}
        />
        <button 
          onClick={handleAsk} 
          disabled={!documentName || isAsking || !question.trim()}
          className="btn btn-secondary"
        >
          {isAsking ? 'Generating...' : 'Ask RAG'}
        </button>
      </div>

      <div className="answer-area">
        <h3>🤖 AI Answer:</h3>
        <div className="ai-answer-box">
          {answer}
        </div>
        
        {sources.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '10px' }}>📄 Retrieved Sources (Chunks):</h4>
            <ul className="sources-list">
              {sources.map((src, index) => (
                <li key={index}>
                  **Chunk {index + 1}:** {src}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default QnA;