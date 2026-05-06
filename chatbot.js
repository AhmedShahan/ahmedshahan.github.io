// chatbot.js
(function() {
  // Load CSS dynamically
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'chatbot.css';
  document.head.appendChild(link);

  // Load Boxicons if not already loaded
  if (!document.querySelector("link[href*='boxicons']")) {
    const boxicons = document.createElement('link');
    boxicons.rel = 'stylesheet';
    boxicons.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
    document.head.appendChild(boxicons);
  }

  // Inject Widget HTML
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'chatbot-widget';
  
  widgetContainer.innerHTML = `
    <div id="chatbot-window">
      <div class="chatbot-header">
        <div class="chatbot-avatar"><i class='bx bx-bot'></i></div>
        <div class="chatbot-title-container">
          <h3 class="chatbot-title">AI Assistant</h3>
          <p class="chatbot-status">Online</p>
        </div>
      </div>
      <div class="chatbot-messages" id="chatbot-messages">
        <div class="message bot">Hello! I am Ahmed's AI Assistant. Ask me anything about Ahmed's skills, projects, or background!</div>
      </div>
      <div class="chatbot-input-container">
        <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Ask me something..." autocomplete="off">
        <button id="chatbot-send-btn" class="chatbot-send-btn"><i class='bx bx-send'></i></button>
      </div>
    </div>
    <button id="chatbot-toggle-btn"><i class='bx bx-message-rounded-dots'></i></button>
  `;
  
  document.body.appendChild(widgetContainer);

  // Widget Logic
  const toggleBtn = document.getElementById('chatbot-toggle-btn');
  const chatWindow = document.getElementById('chatbot-window');
  const sendBtn = document.getElementById('chatbot-send-btn');
  const inputField = document.getElementById('chatbot-input');
  const messagesContainer = document.getElementById('chatbot-messages');

  let isWindowOpen = false;

  toggleBtn.addEventListener('click', () => {
    isWindowOpen = !isWindowOpen;
    if (isWindowOpen) {
      chatWindow.classList.add('active');
      toggleBtn.classList.add('open');
      toggleBtn.innerHTML = "<i class='bx bx-x'></i>";
      setTimeout(() => inputField.focus(), 300);
    } else {
      chatWindow.classList.remove('active');
      toggleBtn.classList.remove('open');
      toggleBtn.innerHTML = "<i class='bx bx-message-rounded-dots'></i>";
    }
  });

  // Simple markdown parser for bold, lists, and newlines
  const formatText = (text) => {
    let formatted = text.replace(/\\n/g, '\n');
    formatted = formatted.replace(/\n/g, '<br>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return formatted;
  };

  const appendMessage = (text, sender) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    
    if (sender === 'bot') {
      msgDiv.innerHTML = formatText(text);
    } else {
      msgDiv.textContent = text;
    }
    
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const showTypingIndicator = () => {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot', 'message-typing');
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const removeTypingIndicator = () => {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
      typingDiv.remove();
    }
  };

  const handleSend = async () => {
    const text = inputField.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    inputField.value = '';
    
    showTypingIndicator();

    try {
      const response = await fetch("https://ahmedshahan-portfolio-knowledge-base.hf.space/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: text })
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      removeTypingIndicator();
      
      const botReply = data.answer || data.response || data.text || "I received a response, but I couldn't understand it.";
      appendMessage(botReply, 'bot');
      
    } catch (error) {
      console.error('Chatbot API Error:', error);
      removeTypingIndicator();
      appendMessage("Sorry, I am having trouble connecting to my knowledge base right now. Please try again later.", 'bot');
    }
  };

  sendBtn.addEventListener('click', handleSend);
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  });

})();
