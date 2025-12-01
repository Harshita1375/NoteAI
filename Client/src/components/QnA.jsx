import { useState } from 'react';
import axios from 'axios';
import ChatHistoryDisplay from './ChatHistoryDisplay.jsx'; 
import './QnA.css'; 

const API_BASE = import.meta.env.VITE_RENDER_API_URL;

function QnA({ documentName }) {
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState([]); 
    const [sources, setSources] = useState([]); 
    const [isAsking, setIsAsking] = useState(false);

    const handleAsk = async () => {
        const trimmedQuestion = question.trim();
        
        if (!documentName || !trimmedQuestion) return;

        const newUserMessage = { type: 'human', content: trimmedQuestion };
        const historyToSend = [...chatHistory, newUserMessage];
        
        setChatHistory(historyToSend);
        setQuestion('');
        setIsAsking(true);
        setSources([]);

        const tempThinkingMessage = { type: 'ai', content: '🔍 Thinking...' };
        setChatHistory(h => [...h, tempThinkingMessage]);

        try {
            const response = await axios.post(`${API_BASE}/ask-doc`, {
                document_name: documentName,
                question: trimmedQuestion,
                chat_history: historyToSend, 
            });

            const aiAnswer = response.data.answer;

            setChatHistory(h => {
                const updatedHistory = h.slice(0, -1);
                return [...updatedHistory, { type: 'ai', content: aiAnswer }];
            });
            setSources(response.data.sources || []);

        } catch (error) {
            console.error("Q&A error:", error);
            const errorMessage = `Error: Failed to get an answer. ${error.response?.data?.detail || error.message}`;
            
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
            {/* Styles moved to CSS file under .qna-card h2 */}
            <h2>💬 Ask a Question</h2>
            
            {/* Styles moved to CSS file under .active-doc-status */}
            <p className="active-doc-status">
                Active Document: 
                <strong className={documentName ? 'active' : 'inactive'}>
                    {documentName || 'None'}
                </strong>
            </p>

            {(documentName || chatHistory.length > 0) && (
                <ChatHistoryDisplay chatHistory={chatHistory} sources={sources} />
            )}

            <div className="action-group">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question here..."
                    disabled={!documentName || isAsking}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isAsking) handleAsk();
                    }}
                />
                <button 
                    onClick={handleAsk} 
                    disabled={!documentName || isAsking || !question.trim()}
                    className="btn btn-secondary"
                >
                    {isAsking ? 'Sending...' : 'Ask RAG'}
                </button>
            </div>
        </div>
    );
}

export default QnA;