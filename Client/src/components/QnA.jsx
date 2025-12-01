import { useState } from 'react';
import axios from 'axios';
// 🚨 Ensure you have created this component:
import ChatHistoryDisplay from './ChatHistoryDisplay.jsx'; 

const API_BASE = import.meta.env.VITE_RENDER_API_URL;

// Re-defining colors used for simple inline styling compatibility
const COLORS = {
  cardBackground: '#2d2d2d',
  text: '#e0e0e0',
  primary: '#4caf50',
  highlight: '#2196f3',
  border: '#444444',
};

function QnA({ documentName }) {
    const [question, setQuestion] = useState('');
    // 🚨 STATE CHANGE: This stores the conversation history
    // History format: [{type: 'human', content: 'Q'}, {type: 'ai', content: 'A'}]
    const [chatHistory, setChatHistory] = useState([]); 
    const [sources, setSources] = useState([]); 
    const [isAsking, setIsAsking] = useState(false);

    const handleAsk = async () => {
        const trimmedQuestion = question.trim();
        
        // Use documentName to check if a file is active
        if (!documentName || !trimmedQuestion) return;

        // 1. Prepare and update history with the new user question
        const newUserMessage = { type: 'human', content: trimmedQuestion };
        // Use the current state (chatHistory) to build the new array sent to the server
        const historyToSend = [...chatHistory, newUserMessage];
        
        // Immediately update the display state to show the user's message
        setChatHistory(historyToSend);
        setQuestion('');
        setIsAsking(true);
        setSources([]);

        // Add a temporary "Thinking" message for immediate feedback
        const tempThinkingMessage = { type: 'ai', content: '🔍 Thinking...' };
        setChatHistory(h => [...h, tempThinkingMessage]);

        try {
            const response = await axios.post(`${API_BASE}/ask-doc`, {
                document_name: documentName,
                question: trimmedQuestion,
                // 🚨 PASS THE FULL HISTORY ARRAY TO THE BACKEND
                chat_history: historyToSend, 
            });

            const aiAnswer = response.data.answer;

            // 2. Remove "Thinking" and add the final AI answer
            setChatHistory(h => {
                const updatedHistory = h.slice(0, -1); // Remove the temp message
                return [...updatedHistory, { type: 'ai', content: aiAnswer }];
            });
            setSources(response.data.sources || []);

        } catch (error) {
            console.error("Q&A error:", error);
            const errorMessage = `Error: Failed to get an answer. ${error.response?.data?.detail || error.message}`;
            
            // Handle error by replacing the "Thinking" message
            setChatHistory(h => {
                const updatedHistory = h.slice(0, -1);
                return [...updatedHistory, { type: 'ai', content: errorMessage, error: true }];
            });
            setSources([]);
        } finally {
            setIsAsking(false);
        }
    };

    return (
        <div className="card qna-card">
            <h2 style={{ marginTop: 0, color: COLORS.highlight }}>💬 Ask a Question</h2>
            <p className="active-doc-status" style={{ color: '#aaaaaa' }}>
                Active Document: 
                <strong className={documentName ? 'active' : 'inactive'} style={{marginLeft: '5px'}}>
                    {documentName || 'None'}
                </strong>
            </p>

            {/* 🚨 INTEGRATE NEW DISPLAY COMPONENT */}
            {(documentName || chatHistory.length > 0) && (
                <ChatHistoryDisplay chatHistory={chatHistory} sources={sources} />
            )}

            {/* --- Input Area (Kept as requested) --- */}
            <div className="action-group">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question here..."
                    disabled={!documentName || isAsking}
                    // Apply standard styling
                    style={{flexGrow: 1}}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isAsking) handleAsk();
                    }}
                />
                <button 
                    onClick={handleAsk} 
                    disabled={!documentName || isAsking || !question.trim()}
                    className="btn btn-secondary"
                    // Apply standard styling
                    style={{padding: '10px 20px'}}
                >
                    {isAsking ? 'Sending...' : 'Ask RAG'}
                </button>
            </div>
        </div>
    );
}

export default QnA;