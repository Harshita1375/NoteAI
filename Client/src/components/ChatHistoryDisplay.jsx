import React, { useRef, useEffect } from 'react';

const COLORS = {
    text: '#f0f0f0',
    highlight: '#2196f3',
    answerBackground: '#333333',
    userMessage: '#4caf50',
    aiMessage: '#2d2d2d',
    border: '#444444',
};

// Component to display a single message
function Message({ message }) {
    const isUser = message.type === 'human';
    return (
        <div style={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            marginBottom: '10px',
        }}>
            <div style={{
                maxWidth: '75%',
                padding: '10px 15px',
                borderRadius: '15px',
                borderBottomLeftRadius: isUser ? '15px' : '3px',
                borderBottomRightRadius: isUser ? '3px' : '15px',
                backgroundColor: isUser ? COLORS.userMessage : COLORS.answerBackground,
                color: COLORS.text,
                fontSize: '0.95em',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                whiteSpace: 'pre-wrap',
            }}>
                <span style={{ fontWeight: isUser ? 'normal' : 'bold', color: isUser ? COLORS.text : COLORS.highlight }}>
                    {isUser ? 'You' : 'AI'}
                </span>
                <p style={{ margin: '5px 0 0 0', fontWeight: 'normal' }}>{message.content}</p>
            </div>
        </div>
    );
}

function ChatHistoryDisplay({ chatHistory, sources }) {
    const messagesEndRef = useRef(null);

    // Scroll to the bottom whenever history updates
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [chatHistory]);

    return (
        <>
            {/* Chat Display Area */}
            <div style={{
                height: '350px',
                overflowY: 'auto',
                padding: '15px',
                backgroundColor: COLORS.aiMessage,
                borderRadius: '8px',
                marginBottom: '20px',
                border: `1px solid ${COLORS.border}`
            }}>
                {chatHistory.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Ask a question to start the conversation.</p>
                ) : (
                    chatHistory.map((msg, index) => (
                        <Message key={index} message={msg} />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Sources Display Area */}
            {sources.length > 0 && (
                <div style={{ marginTop: '20px', borderTop: `1px solid ${COLORS.border}`, paddingTop: '15px' }}>
                    <h4 style={{ marginBottom: '10px', color: '#bdbdbd' }}>📄 Sources Retrieved:</h4>
                    <ul className="sources-list" style={{listStyle: 'none', padding: 0}}>
                        {sources.map((src, index) => (
                            <li key={index} style={{padding: '5px 0', fontSize: '0.9em', color: '#c0c0c0'}}>{src}</li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}

export default ChatHistoryDisplay;