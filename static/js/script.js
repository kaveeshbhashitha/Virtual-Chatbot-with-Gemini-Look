const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

// State variables
let userMessage = null;
let isResponseGenerating = false;

// Load theme and chat data from local storage on page load
const loadDataFromLocalstorage = () => {
    const savedChats = localStorage.getItem("saved-chats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    // Apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    // Restore saved chats or clear the chat container
    chatContainer.innerHTML = savedChats || '';
    document.body.classList.toggle("hide-header", !!savedChats);

    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
};

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Show typing effect (optional, included for animation consistency)
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];

        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            localStorage.setItem("saved-chats", chatContainer.innerHTML); // Save chats to local storage
        }
        chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
    }, 75);
};

// Fetch response from your chatbot backend
const generateBotResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text"); // Getting text element

    try {
        const response = await fetch("/get_response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error fetching bot response");

        const botResponse = data.bot_response; // Adjusted to your backend response format
        showTypingEffect(botResponse, textElement, incomingMessageDiv); // Show typing effect
    } catch (error) {
        isResponseGenerating = false;
        textElement.innerText = "Sorry, something went wrong.";
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
};

// Show a loading animation while waiting for the bot's response
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                    <img class="avatar" src="../static/img/gemini.svg" alt="Bot avatar">
                    <p class="text"></p>
                    <div class="loading-indicator">
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                    </div>
                  </div>
                  <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatContainer.appendChild(incomingMessageDiv);

    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
    generateBotResponse(incomingMessageDiv);
};

// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return; // Exit if there is no message or response is generating

    isResponseGenerating = true;

    const html = `<div class="message-content">
                    <img class="avatar" src="../static/img/me.jpeg" alt="User avatar">
                    <p class="text"></p>
                  </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatContainer.appendChild(outgoingMessageDiv);

    typingForm.reset(); // Clear input field
    document.body.classList.add("hide-header");
    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
    setTimeout(showLoadingAnimation, 500); // Show loading animation after a delay
};

// Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all the chats?")) {
        localStorage.removeItem("saved-chats");
        loadDataFromLocalstorage();
    }
});

// Handle outgoing chat on form submission
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});

// Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

// Load data from local storage on page load
loadDataFromLocalstorage();
