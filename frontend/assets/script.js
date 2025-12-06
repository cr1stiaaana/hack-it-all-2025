// ====================================================================
// --- 1. MOCK DATA (DATE SIMULATE) ---
// ====================================================================

// Date pentru pagina de Profil
const mockUserPosts = [
    { id: 1, title: "I found a game on a 3.5 floppy disk!", date: "03.12.2025" },
    { id: 2, title: "Review: The new Synthwave X album!", date: "29.11.2025" },
    { id: 3, title: "For Sale: 56k Modem, working condition.", date: "25.11.2025" }
];

const mockUserFriends = [
    { username: "DataDiva", avatarPath: "assets/images/friend1.jpg" },
    { username: "MatrixKid", avatarPath: "assets/images/friend2.jpg" },
    { username: "RetroGod", avatarPath: "assets/images/friend3.jpg" },
    { username: "PixelPete", avatarPath: "assets/images/friend4.jpg" }
];

// Date pentru pagina de Activități (Local Board)
const mockLocalEvents = [
    { id: 101, title: "Arcade Gaming Tournament", date: "Sat, 19:00", location: "8km away", color: 'poster-yellow', distance: 8 },
    { id: 102, title: "90s Movie Night: Terminator", date: "Fri, 21:00", location: "2km away", color: 'poster-magenta', distance: 2 },
    { id: 103, title: "Vintage Computer Swap Meet", date: "Sun, 14:00", location: "15km away", color: 'poster-cyan', distance: 15 } // Prea departe
];

// ====================================================================
// --- 2. LOGICĂ GLOBALĂ (Atașarea evenimentelor) ---
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // A. LOGICĂ AUTENTIFICARE (Rulează pe auth.html)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // B. LOGICĂ CHATBOT DONNA (Rulează pe toate paginile autentificate)
    initDonnaChatbot();

    // C. LOGICĂ PAGINĂ PROFIL (Rulează pe profile.html)
    const profileMain = document.getElementById('profile-main');
    if (profileMain) {
        loadProfileData();
    }
    
    // D. LOGICĂ PAGINĂ ACTIVITIES (Rulează pe activities.html)
    const corkboard = document.getElementById('corkboard-grid');
    if (corkboard) {
        loadLocalActivities();
        const locationBtn = document.getElementById('update-location-btn');
        if (locationBtn) {
            locationBtn.addEventListener('click', () => {
                alert('Searching for nearby signals... Events updated!');
                loadLocalActivities(); 
            });
        }
    }
});


// ====================================================================
// --- 3. FUNCȚII DE AUTENTIFICARE (auth.html) ---
// ====================================================================

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // SIMULARE LOGIN (Ideal pentru Hackathon)
    if (username === 'test' && password === '123') {
        // În realitate: localStorage.setItem('userToken', 'YOUR_TOKEN');
        alert('Authentication Success! Welcome back, ' + username);
        // Redirecționare către pagina principală (Newsfeed)
        window.location.href = 'newsfeed.html'; 
    } else {
        alert('ACCESS DENIED: Credentials incorrect. Try: test / 123');
    }
}

// ====================================================================
// --- 4. FUNCȚII PROFIL (profile.html) ---
// ====================================================================

function loadProfileData() {
    // 1. Populează datele utilizatorului
    const displayName = document.getElementById('display-name');
    if(displayName) {
        displayName.textContent = "NeonCoder_2000"; // Simulează numele
        document.querySelector('.marquee-text').textContent = "HELLO, MY NAME IS NEONCODER_2000";
    }

    // 2. Populează postările
    loadUserPosts(mockUserPosts);

    // 3. Populează prietenii
    loadUserFriends(mockUserFriends);
}

function loadUserPosts(posts) {
    const postsList = document.getElementById('latest-posts-list');
    if (!postsList) return; 

    // Golește conținutul existent (mock-up-ul)
    postsList.innerHTML = ''; 

    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post-preview');

        postDiv.innerHTML = `
            <a href="#">${post.title}</a>
            <small>Posted: ${post.date}</small>
        `;

        const hr = document.createElement('hr');
        hr.classList.add('retro-hr');

        postsList.appendChild(postDiv);
        postsList.appendChild(hr); 
    });
}

function loadUserFriends(friends) {
    const friendsGrid = document.getElementById('friends-grid');
    if (!friendsGrid) return; 
    
    // Golește conținutul existent (mock-up-ul)
    friendsGrid.innerHTML = ''; 

    friends.forEach(friend => {
        const friendSlot = document.createElement('div');
        friendSlot.classList.add('friend-slot');

        friendSlot.innerHTML = `
            <img src="${friend.avatarPath}" alt="${friend.username} Avatar" class="friend-avatar">
            <small>${friend.username}</small>
        `;

        friendsGrid.appendChild(friendSlot);
    });
}

// ====================================================================
// --- 5. FUNCȚII ACTIVITIES (activities.html) ---
// ====================================================================

function loadLocalActivities() {
    const corkboard = document.getElementById('corkboard-grid');
    const locationDisplay = document.getElementById('current-location');

    if (!corkboard) return;
    
    // SIMULARE GEOLOCALIZARE ȘI LOCAȚIE
    locationDisplay.textContent = 'Bucharest, Sector 3 (Simulated GPS)';
    
    // Filtrare simulată: Afișează doar evenimentele în raza de 10km
    const nearbyEvents = mockLocalEvents.filter(e => e.distance <= 10); 

    corkboard.innerHTML = ''; 

    if (nearbyEvents.length === 0) {
        corkboard.innerHTML = "<p>No nearby retro events found within 10km radius. Try again later!</p>";
        return;
    }

    nearbyEvents.forEach(event => {
        const poster = document.createElement('div');
        poster.classList.add('event-poster', event.color);
        poster.setAttribute('data-event-id', event.id);
        
        poster.innerHTML = `
            <h3>${event.title}</h3>
            <p>📅 Date: ${event.date}</p>
            <p>📍 Distance: ${event.location}</p>
            <hr class="retro-hr">
            <p>Click for details!</p>
        `;
        
        poster.addEventListener('click', () => {
             alert(`Redirecting to Event Page for: ${event.title}`);
        });

        corkboard.appendChild(poster);
    });
}

// ====================================================================
// --- 6. FUNCȚII CHATBOT DONNA (Global) ---
// ====================================================================

function initDonnaChatbot() {
    const donnaBubbleHead = document.getElementById('donna-bubble-head');
    const chatbotWindow = document.getElementById('chatbot-window');
    const closeChatbot = document.getElementById('close-chatbot');
    const chatbotInput = document.getElementById('chatbot-input');

    if (donnaBubbleHead && chatbotWindow) {
        // Deschide/Închide fereastra la click pe Bubble Head
        donnaBubbleHead.addEventListener('click', () => {
            chatbotWindow.classList.toggle('hidden');
            if (!chatbotWindow.classList.contains('hidden')) {
                donnaBubbleHead.classList.add('active'); 
                chatbotInput.focus();
                // Mesaj de întâmpinare la prima deschidere
                if (document.querySelector('#chatbot-messages').children.length === 0) {
                    displayMessage("Hello! I am DONNA, your AI assistant. How can I help you?", 'donna');
                }
            } else {
                donnaBubbleHead.classList.remove('active');
            }
        });

        // Închide fereastra la click pe X
        closeChatbot.addEventListener('click', () => {
            chatbotWindow.classList.add('hidden');
            donnaBubbleHead.classList.remove('active');
        });

        // Logica de răspuns (Enter)
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage(chatbotInput.value);
                chatbotInput.value = '';
            }
        });
    }
}

function displayMessage(message, sender) {
    const chatbotMessages = document.getElementById('chatbot-messages');
    if (!chatbotMessages) return;

    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', `${sender}-message`);
    messageElement.innerHTML = message;
    
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function sendMessage(userMessage) {
    if (userMessage.trim() === '') return;

    displayMessage(userMessage, 'user');

    // RĂSPUNS SIMULAT DONNA (Timeout pentru efect retro de "gândire")
    setTimeout(() => {
        const donnaResponse = generateDonnaResponse(userMessage);
        displayMessage(donnaResponse, 'donna');
    }, 1000); 
}

function generateDonnaResponse(message) {
    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes('summarize') || lowerCaseMessage.includes('rezuma')) {
        return "Summarization Mode Active. Please provide a link. Simulated result: The article states that 90s nostalgia is peaking and CRTs are making a comeback.";
    }
    
    if (lowerCaseMessage.includes('recommend') || lowerCaseMessage.includes('post') || lowerCaseMessage.includes('blog')) {
        return "Recommendation: Check the 'EXPLORE' section for our Top Pick: 'Cyber Racer 3000' and the latest Music Charts!";
    }

    if (lowerCaseMessage.includes('location') || lowerCaseMessage.includes('events')) {
        return "Local Board Status: Active! I detected a *Hackathon* and a *90s Movie Night* within 10km. Check the 'LOCAL BOARD' page for full details.";
    }

    if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi') || lowerCaseMessage.includes('hail')) {
        return "Greetings, cybernaut. I am DONNA. Ready to assist with information retrieval or content recommendations.";
    }

    return "Error 404 - Command Not Understood. I am a retro AI, please use simple keywords like 'summarize' or 'recommend'.";
}