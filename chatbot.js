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
        <div class="chatbot-header-actions">
          <button id="chatbot-minimize-btn" title="Minimize"><i class='bx bx-minus'></i></button>
          <button id="chatbot-close-btn" title="Close"><i class='bx bx-x'></i></button>
        </div>
      </div>
      <div class="chatbot-messages" id="chatbot-messages">
        <div class="message bot">Hello! I am Ahmed's AI Assistant. Ask me anything about Ahmed's skills, projects, or background!</div>
      </div>
      <div class="chatbot-input-container">
        <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Ask me something..." autocomplete="off">
        <button id="chatbot-send-btn" class="chatbot-send-btn"><i class='bx bx-send'></i></button>
      </div>

      <!-- Confirmation Popup -->
      <div id="chatbot-confirm-popup" class="chatbot-popup">
        <p>Closing the chat will erase all text history. Are you sure?</p>
        <div class="chatbot-popup-actions">
          <button id="chatbot-popup-cancel">Cancel</button>
          <button id="chatbot-popup-confirm">Close & Erase</button>
        </div>
      </div>
    </div>
    
    <button id="chatbot-toggle-btn">
      <span style="margin-right:5px;">CHATBOT</span>
      <i class='bx bx-support' style="font-size:24px;"></i>
    </button>
  `;
  
  document.body.appendChild(widgetContainer);

  // Widget Elements
  const toggleBtn = document.getElementById('chatbot-toggle-btn');
  const chatWindow = document.getElementById('chatbot-window');
  const sendBtn = document.getElementById('chatbot-send-btn');
  const inputField = document.getElementById('chatbot-input');
  const messagesContainer = document.getElementById('chatbot-messages');
  
  const minimizeBtn = document.getElementById('chatbot-minimize-btn');
  const closeBtn = document.getElementById('chatbot-close-btn');
  const confirmPopup = document.getElementById('chatbot-confirm-popup');
  const cancelCloseBtn = document.getElementById('chatbot-popup-cancel');
  const confirmCloseBtn = document.getElementById('chatbot-popup-confirm');

  let isWindowOpen = false;
  let isTyping = false;

  const openChat = () => {
    isWindowOpen = true;
    chatWindow.classList.add('active');
    toggleBtn.classList.add('hidden'); // Hide the pill button when chat is open
    setTimeout(() => inputField.focus(), 300);
  };

  const minimizeChat = () => {
    isWindowOpen = false;
    chatWindow.classList.remove('active');
    toggleBtn.classList.remove('hidden'); // Bring back the pill button
  };

  // Event Listeners for Opening/Closing
  toggleBtn.addEventListener('click', openChat);
  minimizeBtn.addEventListener('click', minimizeChat);

  closeBtn.addEventListener('click', () => {
    // Show confirmation popup
    confirmPopup.classList.add('active');
  });

  cancelCloseBtn.addEventListener('click', () => {
    // Hide popup
    confirmPopup.classList.remove('active');
  });

  confirmCloseBtn.addEventListener('click', () => {
    // Erase text history and close
    confirmPopup.classList.remove('active');
    messagesContainer.innerHTML = '<div class="message bot">Hello! I am Ahmed\'s AI Assistant. Ask me anything about Ahmed\'s skills, projects, or background!</div>';
    minimizeChat();
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

  const typeWriterEffect = async (node, text, speed = 15) => {
    let currentText = "";
    isTyping = true;
    for (let i = 0; i < text.length; i++) {
      currentText += text.charAt(i);
      
      if (typeof marked !== 'undefined') {
        node.innerHTML = marked.parse(currentText);
      } else {
        let formatted = currentText.replace(/\\n/g, '\n');
        formatted = formatted.replace(/\n/g, '<br>');
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        node.innerHTML = formatted;
      }

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      await new Promise(r => setTimeout(r, speed + Math.random() * 10));
    }
    isTyping = false;
  };

  const showTypingIndicator = () => {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot', 'message-typing');
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<div class="chatbot-loader"><div class="loader-bar"></div><div class="loader-bar"></div><div class="loader-bar"></div><div class="loader-bar"></div><div class="loader-bar"></div></div>';
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
