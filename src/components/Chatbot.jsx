import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
} from 'lucide-react';

import { getBotResponse } from '../data/chatbotKnowledge';

export default function Chatbot({
  sensors,
  studentsPresent,
  teachersPresent,
  connected,
  mode,
}) {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hello! 👋 I am your Smart Campus Assistant. Ask me about the project, sensors, temperature, humidity, air quality, attendance, or ESP32.'
    }
  ]);

  const [input, setInput] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);

  const handleSend = () => {
    const question = input.trim();

    if (!question) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: question,
    };

    const context = {
      sensors,
      studentsPresent,
      teachersPresent,
      connected,
      mode,
    };

    const response = getBotResponse(
      question,
      context
    );

    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      text: response.text,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      botMessage,
    ]);

    setInput('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbot-wrapper">

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">

          {/* Header */}
          <div className="chatbot-header">

            <div className="chatbot-title">
              <div className="chatbot-avatar">
                <Bot size={20} />
              </div>

              <div>
                <h3>Smart Campus AI</h3>
                <span>
                  Your Campus Assistant
                </span>
              </div>
            </div>

            <button
              className="chatbot-close"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>

          </div>

          {/* Messages */}
          <div className="chatbot-messages">

            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.type}`}
              >

                <div className="message-icon">
                  {message.type === 'bot'
                    ? <Bot size={16} />
                    : <User size={16} />
                  }
                </div>

                <div className="message-bubble">
                  {message.text}
                </div>

              </div>
            ))}

            <div ref={messagesEndRef} />

          </div>

          {/* Suggestions */}
          <div className="chatbot-suggestions">

            <button
              onClick={() =>
                setInput('What is the temperature?')
              }
            >
              Temperature
            </button>

            <button
              onClick={() =>
                setInput('How is the air quality?')
              }
            >
              Air Quality
            </button>

            <button
              onClick={() =>
                setInput('How many students are present?')
              }
            >
              Attendance
            </button>

          </div>

          {/* Input */}
          <div className="chatbot-input">

            <input
              type="text"
              placeholder="Ask about Smart Campus..."
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
            />

            <button
              onClick={handleSend}
            >
              <Send size={18} />
            </button>

          </div>

        </div>
      )}

      {/* Floating Button */}
      <button
        className="chatbot-button"
        onClick={() => setOpen(!open)}
      >
        {open
          ? <X size={24} />
          : <MessageCircle size={24} />
        }
      </button>

    </div>
  );
}