import { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf"; 
import ChatHistoryDisplay from './ChatHistoryDisplay.jsx'; 
import { IoSendSharp } from "react-icons/io5";
import { FaDownload } from "react-icons/fa"; 
import './QnA.css'; 

const API_BASE = import.meta.env.VITE_RENDER_API_URL;

function QnA({ documentName }) {
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState([]); 
    const [sources, setSources] = useState([]); 
    const [isAsking, setIsAsking] = useState(false);
    useEffect(() => {
        setChatHistory([]);
        setSources([]);
        setQuestion('');
    }, [documentName]);

    const handleDownloadPDF = () => {
        if (chatHistory.length === 0) {
            alert("No chat history to download yet!");
            return;
        }
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Note AI Chat: ${documentName || 'Untitled'}`, 10, 10);
        
        doc.setFontSize(12);
        let yPos = 20; 
        const pageHeight = doc.internal.pageSize.height;
        const margin = 10;
        const maxLineWidth = 180; 

        chatHistory.forEach((msg) => {
            if (msg.content === '🔍 Thinking...') return;
            const speaker = msg.type === 'human' ? "You" : "AI";
        
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFont("helvetica", "bold");
            doc.text(`${speaker}:`, margin, yPos);
            yPos += 7;

            doc.setFont("helvetica", "normal");
            const textLines = doc.splitTextToSize(msg.content, maxLineWidth);
            
            textLines.forEach(line => {
                if (yPos > pageHeight - 10) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, margin, yPos);
                yPos += 7; 
            });

            yPos += 5; 
        });

        doc.save(`chat_history_${documentName || 'doc'}.pdf`);
    };

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
                document_name: documentName,   // ⭐ ALWAYS latest uploaded doc
                question: trimmedQuestion
            });

            const aiAnswer = response.data.answer;

            setChatHistory(h => {
                const updated = h.slice(0, -1);
                return [...updated, { type: 'ai', content: aiAnswer }];
            });

            setSources(response.data.sources || []);

        } catch (error) {
            const errorMessage = `Error: Failed to get an answer. ${error.response?.data?.detail || error.message}`;
            
            setChatHistory(h => {
                const updated = h.slice(0, -1);
                return [...updated, { type: 'ai', content: errorMessage, error: true }];
            });

            setSources([]);
        } finally {
            setIsAsking(false);
        }
    };

    return (
        <div className="card qna-card">
            {/* Header Flex Container */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h2 style={{ margin: 0 }}>💬 Ask a Question</h2>

                <button 
                    onClick={handleDownloadPDF} 
                    disabled={chatHistory.length === 0}
                    title="Download Chat History as PDF"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: chatHistory.length === 0 ? '#ccc' : '#fff',
                        cursor: chatHistory.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '1.2rem',
                        padding: '5px'
                    }}
                >
                    <FaDownload />
                </button>
            </div>
            
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
                    {isAsking ? "Sending..." : <IoSendSharp size={22} />}
                </button>
            </div>
        </div>
    );
}

export default QnA;
