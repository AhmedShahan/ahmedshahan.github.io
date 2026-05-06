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

  // Load Marked.js for perfect markdown rendering
  if (typeof marked === 'undefined') {
    const markedScript = document.createElement('script');
    markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    document.head.appendChild(markedScript);
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
  let isTyping = false;

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

  const appendUserMessage = (text) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'user');
    msgDiv.textContent = text;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const createBotMessageNode = () => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot');
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgDiv;
  };

  // Simulate streaming by typing out the Markdown source, then rendering
  // Or stream raw markdown out and render on every step
  const typeWriterEffect = async (node, text, speed = 15) => {
    let currentText = "";
    isTyping = true;
    for (let i = 0; i < text.length; i++) {
      currentText += text.charAt(i);
      
      // If marked is loaded, parse the partial text to HTML
      if (typeof marked !== 'undefined') {
        node.innerHTML = marked.parse(currentText);
      } else {
        // Fallback formatting
        let formatted = currentText.replace(/\\n/g, '\n');
        formatted = formatted.replace(/\n/g, '<br>');
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        node.innerHTML = formatted;
      }

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Randomize speed slightly for realistic typing
      await new Promise(r => setTimeout(r, speed + Math.random() * 10));
    }
    isTyping = false;
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
    if (isTyping) return; // Prevent sending while typing response
    
    const text = inputField.value.trim();
    if (!text) return;

    appendUserMessage(text);
    inputField.value = '';
    
    showTypingIndicator();

    try {
      // POST request to backend
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
      
      const botNode = createBotMessageNode();
      await typeWriterEffect(botNode, botReply, 10);
      
    } catch (error) {
      console.error('Chatbot API Error:', error);
      removeTypingIndicator();
      const errNode = createBotMessageNode();
      errNode.textContent = "Sorry, I am having trouble connecting to my knowledge base right now. Please try again later.";
    }
  };

  sendBtn.addEventListener('click', handleSend);
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  });

})();
