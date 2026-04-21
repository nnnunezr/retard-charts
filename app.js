// Global Error Logging to help diagnose issues
window.onerror = function(msg, url, line, col, error) {
    const errorMsg = `Global Error: ${msg} at ${line}:${col}`;
    console.error(errorMsg);
    const container = document.getElementById('stock-cards-container');
    if (container) {
        container.innerHTML = `<p style="color: #ef4444; padding: 20px;">${errorMsg}</p>`;
    }
    return false;
};

// Global State
let stocksData = [
    { symbol: 'NVDA', name: 'NVIDIA Corp', sector: 'Tech', price: 0, change: '0.00%', isUp: true, domain: 'nvidia.com', history: [], exchange: 'NASDAQ' },
    { symbol: 'LLY', name: 'Eli Lilly', sector: 'Pharma', price: 0, change: '0.00%', isUp: true, domain: 'lilly.com', history: [], exchange: 'NYSE' },
    { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finance', price: 0, change: '0.00%', isUp: true, domain: 'jpmorganchase.com', history: [], exchange: 'NYSE' },
    { symbol: 'AMD', name: 'Advanced Micro', sector: 'Tech', price: 0, change: '0.00%', isUp: true, domain: 'amd.com', history: [], exchange: 'NASDAQ' },
    { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', price: 0, change: '0.00%', isUp: true, domain: 'exxonmobil.com', history: [], exchange: 'NYSE' },
    { symbol: 'VRTX', name: 'Vertex Pharma', sector: 'Pharma', price: 0, change: '0.00%', isUp: true, domain: 'vrtx.com', history: [], exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms', sector: 'Tech', price: 0, change: '0.00%', isUp: true, domain: 'meta.com', history: [], exchange: 'NASDAQ' },
    { symbol: 'GS', name: 'Goldman Sachs', sector: 'Finance', price: 0, change: '0.00%', isUp: true, domain: 'goldmansachs.com', history: [], exchange: 'NYSE' },
];

let supabaseClient = null;
try {
    if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY && 
        window.SUPABASE_URL !== 'INSERT_YOUR_SUPABASE_URL_HERE' && 
        window.SUPABASE_URL.startsWith('http')) {
        supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
} catch (e) { console.error("Supabase fail:", e); }

let currentStock = stocksData[0];
let chartInstance = null;
let chatHistory = [];
let currentUser = null;
let userLists = { 'Main Watchlist': [] }; 
let currentListName = 'Main Watchlist';
let userWatchlist = []; 

// DOM Elements
const cardsContainer = document.getElementById('stock-cards-container');
const sectorFilters = document.querySelectorAll('#sector-filters li');
const chartTitle = document.getElementById('chart-title');
const searchInput = document.getElementById('ticker-search');
const searchResults = document.getElementById('search-results');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatMessages = document.getElementById('chat-messages');
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const authName = document.getElementById('auth-name');
const authConfirmPassword = document.getElementById('auth-confirm-password');
const nameGroup = document.getElementById('name-group');
const confirmPasswordGroup = document.getElementById('confirm-password-group');
const authSubmitText = document.getElementById('auth-submit-text');
const userProfile = document.getElementById('user-profile');
const displayEmail = document.getElementById('display-email');
const logoutBtn = document.getElementById('logout-btn');
const demoBypass = document.getElementById('demo-bypass');
const navDashboard = document.getElementById('nav-dashboard');
const dashboardView = document.getElementById('dashboard-view');
const navPortfolio = document.getElementById('nav-watchlist');
const portfolioView = document.getElementById('watchlist-view');
const portfolioList = document.getElementById('watchlist-items-list');
const watchlistCount = document.getElementById('watchlist-count');
const userListsContainer = document.getElementById('user-lists-container');
const addListBtn = document.getElementById('add-list-btn');
const chartSection = document.getElementById('chart-section');
const chartPlaceholder = document.getElementById('chart-placeholder');

const welcomeMsg = document.createElement('div');
welcomeMsg.className = 'toast-notification';
document.body.appendChild(welcomeMsg);

function showToast(message, isError = false) {
    welcomeMsg.textContent = message;
    welcomeMsg.style.background = isError ? '#ef4444' : '#10b981';
    welcomeMsg.classList.add('show');
    setTimeout(() => welcomeMsg.classList.remove('show'), 4000);
}

// --- Price Logic ---
function savePriceCache() {
    const cache = {};
    stocksData.forEach(s => {
        if (s.price > 0) cache[s.symbol] = { price: s.price, change: s.change, isUp: s.isUp };
    });
    localStorage.setItem('marketpulse_prices', JSON.stringify(cache));
}

function loadPriceCache() {
    try {
        const cache = JSON.parse(localStorage.getItem('marketpulse_prices'));
        if (cache) {
            stocksData.forEach(s => {
                if (cache[s.symbol]) {
                    s.price = cache[s.symbol].price;
                    s.change = cache[s.symbol].change;
                    s.isUp = cache[s.symbol].isUp;
                }
            });
        }
    } catch (e) {}
}

async function fetchLivePrice(symbol) {
    try {
        const url = `https://api.cors.lol/?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&_t=${Date.now()}`)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.chart?.result) {
            const meta = data.chart.result[0].meta;
            return { price: meta.regularMarketPrice, prevClose: meta.chartPreviousClose || meta.previousClose };
        }
    } catch(e) { return null; }
}

async function updateLivePrices() {
    console.log("Fetching primary prices from Yahoo Finance...");
    
    // We'll fetch in parallel for speed
    const fetchPromises = stocksData.map(async (stock) => {
        try {
            const data = await fetchLivePrice(stock.symbol);
            if (data) {
                stock.price = data.price;
                const changeNum = ((data.price - data.prevClose) / data.prevClose * 100);
                stock.change = (changeNum >= 0 ? '+' : '') + changeNum.toFixed(2) + '%';
                stock.isUp = changeNum >= 0;
                return true;
            }
        } catch (e) { return false; }
        return false;
    });

    const results = await Promise.all(fetchPromises);
    const successCount = results.filter(Boolean).length;

    if (successCount > 0) {
        console.log(`Yahoo Finance: Updated ${successCount} stocks.`);
        savePriceCache();
        renderCards(document.querySelector('#sector-filters li.active')?.dataset.sector || 'All');
        renderWatchlistView();
    } else {
        console.warn("Yahoo Finance failed or rate limited, falling back to TradingView...");
        await updateLivePricesTV();
    }
}

async function updateLivePricesTV() {
    const tickers = stocksData.map(s => {
        const nasdaqTickers = ['NVDA', 'AMD', 'META', 'TSLA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NFLX', 'QCOM', 'AVGO'];
        const exchange = s.exchange || (nasdaqTickers.includes(s.symbol) ? 'NASDAQ' : 'NYSE');
        return `${exchange}:${s.symbol}`;
    });

    try {
        const url = 'https://api.cors.lol/?url=' + encodeURIComponent('https://scanner.tradingview.com/america/scan');
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "symbols": { "tickers": tickers, "query": { "types": [] } },
                "columns": ["close", "change", "change_abs", "name"]
            })
        });
        const data = await res.json();
        if (data?.data) {
            data.data.forEach(entry => {
                const symbol = entry.s.split(':').pop();
                const stock = stocksData.find(s => s.symbol === symbol);
                if (stock) {
                    stock.price = entry.d[0];
                    stock.change = (entry.d[1] >= 0 ? '+' : '') + entry.d[1].toFixed(2) + '%';
                    stock.isUp = entry.d[1] >= 0;
                }
            });
            savePriceCache();
            renderCards(document.querySelector('#sector-filters li.active')?.dataset.sector || 'All');
            renderWatchlistView();
        }
    } catch (e) {
        console.error("All price sources failed.");
    }
}

// --- Rendering Logic ---
function renderCards(sector = 'All') {
    if (!cardsContainer) return;
    cardsContainer.innerHTML = '';
    const filtered = sector === 'All' ? stocksData.slice(0, 8) : stocksData.filter(s => s.sector === sector);
    
    filtered.forEach(stock => {
        const card = document.createElement('div');
        const isSelected = currentStock && stock.symbol === currentStock.symbol;
        card.className = `stock-card ${isSelected ? 'selected' : ''}`;
        card.onclick = () => selectStock(stock);
        card.innerHTML = `
            <div class="stock-header">
                <span class="stock-symbol">${stock.symbol}</span>
                <span class="stock-sector">${stock.sector}</span>
            </div>
            <div class="stock-price">${stock.price ? '$' + stock.price.toFixed(2) : 'Loading...'}</div>
            <div class="stock-change ${stock.isUp ? 'change-positive' : 'change-negative'}">
                <i class="fa-solid ${stock.isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
                ${stock.change}
            </div>
            <div style="margin-top: 12px;">
                <button class="buy-btn-small" onclick="event.stopPropagation(); toggleWatchlist('${stock.symbol}')">
                    <i class="fa-solid ${userWatchlist.includes(stock.symbol) ? 'fa-star' : 'fa-star-half-stroke'}"></i>
                    ${userWatchlist.includes(stock.symbol) ? 'Unwatch' : 'Watch'}
                </button>
            </div>
        `;
        cardsContainer.appendChild(card);
    });
}

function selectStock(stock) {
    currentStock = stock;
    if (chartSection) chartSection.style.display = 'block';
    if (chartPlaceholder) chartPlaceholder.style.display = 'none';
    renderCards(document.querySelector('#sector-filters li.active')?.dataset.sector || 'All');
    updateChart();
    chatMessages.innerHTML = '';
    chatHistory = [];
    triggerAIAnalysis(stock);
}

function updateChart() {
    if (!currentStock) return;
    chartTitle.textContent = `${currentStock.name} (${currentStock.symbol})`;
    document.getElementById('tv_chart_container').innerHTML = '';
    new TradingView.widget({
        "autosize": true,
        "symbol": currentStock.symbol,
        "interval": "D",
        "theme": "dark",
        "style": "1",
        "container_id": "tv_chart_container",
        "backgroundColor": "rgba(30, 41, 59, 0)",
        "gridColor": "rgba(255, 255, 255, 0.05)"
    });
}

// --- Watchlist Logic ---
function renderUserLists() {
    if (!userListsContainer) return;
    userListsContainer.innerHTML = '';
    Object.keys(userLists).forEach(name => {
        const li = document.createElement('li');
        li.className = name === currentListName ? 'active' : '';
        li.innerHTML = `
            <a href="#" onclick="switchList('${name}')"><i class="fa-solid fa-list-ul"></i> ${name}</a>
            ${name !== 'Main Watchlist' ? `<i class="fa-solid fa-trash" onclick="deleteList('${name}')" style="cursor:pointer; opacity:0.5"></i>` : ''}
        `;
        userListsContainer.appendChild(li);
    });
}

function switchList(name) {
    currentListName = name;
    userWatchlist = userLists[name] || [];
    renderUserLists();
    renderWatchlistView();
    showToast(`Switched to ${name}`);
}

function createNewList() {
    const name = prompt("List Name:");
    if (name && !userLists[name]) {
        userLists[name] = [];
        switchList(name);
        saveListsToDB();
    }
}

function deleteList(name) {
    if (confirm(`Delete ${name}?`)) {
        delete userLists[name];
        if (currentListName === name) switchList('Main Watchlist');
        renderUserLists();
        saveListsToDB();
    }
}

async function toggleWatchlist(symbol) {
    if (!userLists[currentListName]) userLists[currentListName] = [];
    if (userLists[currentListName].includes(symbol)) {
        userLists[currentListName] = userLists[currentListName].filter(s => s !== symbol);
        showToast(`Removed ${symbol}`, true);
    } else {
        userLists[currentListName].push(symbol);
        showToast(`Added ${symbol}`);
    }
    userWatchlist = userLists[currentListName];
    saveListsToDB();
    renderCards(document.querySelector('#sector-filters li.active')?.dataset.sector || 'All');
    renderWatchlistView();
}

function renderWatchlistView() {
    if (!portfolioList) return;
    portfolioList.innerHTML = '';
    const list = userLists[currentListName] || [];
    if (list.length === 0) {
        portfolioList.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px">Empty List</td></tr>';
        watchlistCount.textContent = '0 Stocks';
        return;
    }
    list.forEach(sym => {
        const s = stocksData.find(st => st.symbol === sym) || { symbol: sym, name: sym, price: 0, change: '0%', isUp: true };
        const row = document.createElement('tr');
        const priceStr = s.price ? '$' + s.price.toFixed(2) : 'Loading...';
        row.innerHTML = `
            <td><strong>${s.symbol}</strong></td>
            <td>${s.name}</td>
            <td>${priceStr}</td>
            <td class="${s.isUp ? 'change-positive' : 'change-negative'}">${s.change || '0%'}</td>
            <td><button class="logout-btn" onclick="event.stopPropagation(); toggleWatchlist('${s.symbol}')">Remove</button></td>
        `;
        row.onclick = () => selectStock(s);
        portfolioList.appendChild(row);
    });
    watchlistCount.textContent = `${list.length} Stocks`;
}

function saveListsToDB() {
    localStorage.setItem('marketpulse_lists', JSON.stringify(userLists));
}

function loadListsFromDB() {
    const saved = localStorage.getItem('marketpulse_lists');
    if (saved) {
        userLists = JSON.parse(saved);
        userWatchlist = userLists[currentListName] || [];
    }
}

// --- AI Logic ---
async function callGroqAPI(prompt) {
    let directKey = localStorage.getItem('MP_GROQ_KEY');
    if (!directKey) {
        directKey = prompt("Please enter your Groq API Key to enable AI analysis. It will be saved locally in your browser.");
        if (directKey) localStorage.setItem('MP_GROQ_KEY', directKey);
    }
    
    if (!directKey) return "⚠️ Groq API Key missing. Please provide it to enable analysis.";
    const payload = {
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: "Expert financial AI analyst. Provide concise, actionable summaries (under 4 sentences). Use emojis." },
            ...chatHistory,
            { role: "user", content: prompt }
        ]
    };

    try {
        // Try local proxy first
        const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            const data = await res.json();
            const reply = data.choices[0].message.content;
            chatHistory.push({ role: "user", content: prompt }, { role: "assistant", content: reply });
            return reply;
        }
        throw new Error("Proxy failed");
    } catch (e) {
        console.warn("Proxy failed, using direct API call (local/demo mode)");
        try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${directKey}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            const reply = data.choices[0].message.content;
            chatHistory.push({ role: "user", content: prompt }, { role: "assistant", content: reply });
            return reply;
        } catch (err) {
            return "⚠️ AI service is currently unavailable. Please check your connection.";
        }
    }
}

async function handleChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    addMessage(text, true);
    
    // Show Loading
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message loading';
    loadingDiv.innerHTML = '<p>Analyzing market data...</p>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const resp = await callGroqAPI(text);
    
    loadingDiv.remove();
    addMessage(resp);
}

function addMessage(content, isUser = false) {
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    div.innerHTML = `<p>${content.replace(/\n/g, '<br>')}</p>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function triggerAIAnalysis(stock) {
    // Show Loading
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message loading';
    loadingDiv.innerHTML = `<p>Gathering insights for ${stock.symbol}...</p>`;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const resp = await callGroqAPI(`Quick analysis for ${stock.symbol} at $${stock.price}. Give me a summary of what to buy, seek for discounts, and the upcoming outlook.`);
    
    loadingDiv.remove();
    const html = `
        <div class="analysis-header">
            <strong>${stock.symbol}</strong> Analysis
        </div>
        <div class="analysis-text">
            ${resp.replace(/\n/g, '<br>')}
        </div>
    `;
    addMessage(html);
}

// --- Search Logic ---
let sp500Data = [];
fetch("https://pkgstore.datahub.io/core/s-and-p-500-companies/constituents_json/data/297344d8dc0a9d86b8d107449c851cc8/constituents_json.json")
    .then(r => r.json()).then(data => sp500Data = data.map(i => ({ symbol: i.Symbol, name: i.Name })));

function renderSearchResults(results) {
    searchResults.innerHTML = '';
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No results</div>';
    } else {
        results.forEach(i => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `<strong>${i.symbol}</strong> - ${i.name}`;
            div.onclick = () => handleStockSelection(i.symbol, i.name);
            searchResults.appendChild(div);
        });
    }
    searchResults.classList.add('active');
}

async function handleStockSelection(symbol, name) {
    let s = stocksData.find(st => st.symbol === symbol);
    if (!s) {
        s = { symbol, name, sector: 'Search', price: 0, change: '0%', isUp: true, domain: `${symbol.toLowerCase()}.com` };
        stocksData.unshift(s);
        const p = await fetchLivePrice(symbol);
        if (p) { s.price = p.price; s.change = '+0.00%'; }
    }
    dashboardView.style.display = 'block';
    portfolioView.style.display = 'none';
    navDashboard.classList.add('active');
    navPortfolio.classList.remove('active');
    searchResults.classList.remove('active');
    searchInput.value = '';
    selectStock(s);
}

// --- Auth Mock ---
let isSignUp = false;
async function handleAuth(e) {
    if (e) e.preventDefault();
    authModal.style.display = 'none';
    userProfile.style.display = 'block';
    displayEmail.textContent = authEmail.value || 'guest@marketpulse.app';
    showToast("Signed in as Guest");
}

function setupEventListeners() {
    if (tabLogin) tabLogin.onclick = () => { isSignUp = false; tabLogin.classList.add('active'); tabSignup.classList.remove('active'); nameGroup.style.display = 'none'; };
    if (tabSignup) tabSignup.onclick = () => { isSignUp = true; tabSignup.classList.add('active'); tabLogin.classList.remove('active'); nameGroup.style.display = 'block'; };
    if (authForm) authForm.onsubmit = handleAuth;
    if (demoBypass) demoBypass.onclick = handleAuth;
    if (logoutBtn) logoutBtn.onclick = () => window.location.reload();

    if (navDashboard) navDashboard.onclick = () => {
        dashboardView.style.display = 'block';
        portfolioView.style.display = 'none';
        navDashboard.classList.add('active');
        navPortfolio.classList.remove('active');
    };
    if (navPortfolio) navPortfolio.onclick = () => {
        dashboardView.style.display = 'none';
        portfolioView.style.display = 'block';
        navPortfolio.classList.add('active');
        navDashboard.classList.remove('active');
        renderWatchlistView();
    };

    sectorFilters.forEach(f => {
        f.onclick = () => {
            sectorFilters.forEach(el => el.classList.remove('active'));
            f.classList.add('active');
            renderCards(f.dataset.sector);
        };
    });

    if (searchInput) {
        searchInput.oninput = (e) => {
            const q = e.target.value.trim().toLowerCase();
            if (q.length < 1) { searchResults.classList.remove('active'); return; }
            const res = sp500Data.filter(i => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)).slice(0, 5);
            renderSearchResults(res);
        };
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                const s = searchInput.value.trim().toUpperCase();
                if (s) handleStockSelection(s, s);
            }
        };
    }

    if (addListBtn) addListBtn.onclick = createNewList;
    if (sendChatBtn) sendChatBtn.onclick = handleChat;
    if (chatInput) chatInput.onkeypress = (e) => { if (e.key === 'Enter') handleChat(); };

    document.addEventListener('click', (e) => { if (!e.target.closest('.search-box')) searchResults.classList.remove('active'); });
}

// --- Init ---
async function init() {
    setupEventListeners();
    loadPriceCache();
    loadListsFromDB();
    renderUserLists();
    renderCards();
    updateLivePrices();
    setInterval(updateLivePrices, 30000);
}

init();
