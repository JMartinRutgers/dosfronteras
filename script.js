// Data Storage with enhanced persistence
let cart = [];
let adminMode = false;
let newsItems = [];
let events = [];
let featuredVideoUrl = null;
let latestEpisodeUrl = null;
let rssFeedUrl = 'https://mmajunkie.usatoday.com/feed';

// RSS Feeds Configuration
const RSS_FEEDS = [
  {
    name: 'MMA Junkie',
    url: 'https://mmajunkie.usatoday.com/feed',
    source: 'MMA Junkie',
    type: 'xml',
    fallback: true
  },
  {
    name: 'MMA Fighting',
    url: 'https://www.mmafighting.com/rss/current',
    source: 'MMA Fighting', 
    type: 'xml',
    fallback: true
  },
  {
    name: 'Bloody Elbow',
    url: 'https://www.bloodyelbow.com/rss/current',
    source: 'Bloody Elbow',
    type: 'xml',
    fallback: true
  },
  {
    name: 'ESPN MMA',
    url: 'https://www.espn.com/espn/rss/mma/news',
    source: 'ESPN',
    type: 'xml',
    fallback: true
  },
  {
    name: 'Sherdog',
    url: 'https://www.sherdog.com/rss/news',
    source: 'Sherdog',
    type: 'xml',
    fallback: true
  }
];

// Real-time Headlines from RSS feeds
let HEADLINES = [];

// Auto-refresh breaking news every 5 minutes
let headlinesRefreshInterval = null;

// Sample Products
const products = [
  { id: 1, name: 'Dos Fronteras T-Shirt', price: 29.99, icon: 'fa-tshirt', description: 'Premium cotton tee with official logo' },
  { id: 2, name: 'MMA Training Hat', price: 24.99, icon: 'fa-hat-cowboy', description: 'Adjustable cap for training sessions' },
  { id: 3, name: 'Fight Night Hoodie', price: 49.99, icon: 'fa-vest', description: 'Comfortable hoodie for fight nights' },
  { id: 4, name: 'DF Water Bottle', price: 19.99, icon: 'fa-bottle-water', description: 'Stay hydrated during training' },
  { id: 5, name: 'MMA Gym Bag', price: 39.99, icon: 'fa-bag-shopping', description: 'Spacious bag for all your gear' },
  { id: 6, name: 'Fight Sticker Pack', price: 9.99, icon: 'fa-star', description: 'Set of 10 vinyl stickers' }
];

// Sample Fighter Stats
const fighters = [
  { name: 'Alex "Thunder" Martinez', record: '15-3-0', wins: 15, losses: 3, country: 'Mexico' },
  { name: 'Jake "The Snake" Johnson', record: '12-5-1', wins: 12, losses: 5, country: 'USA' },
  { name: 'Carlos "El Toro" Rodriguez', record: '18-2-0', wins: 18, losses: 2, country: 'Mexico' },
  { name: 'Mike "Iron" Davis', record: '14-4-0', wins: 14, losses: 4, country: 'USA' },
  { name: 'Luis "Lightning" Garcia', record: '11-6-0', wins: 11, losses: 6, country: 'Mexico' }
];

// Enhanced data persistence functions
function saveToLocalStorage() {
  const data = {
    cart,
    newsItems,
    events,
    featuredVideoUrl,
    latestEpisodeUrl,
    rssFeedUrl,
    timestamp: new Date().getTime()
  };
  localStorage.setItem('dosFronterasData', JSON.stringify(data));
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('dosFronterasData');
    if (saved) {
      const data = JSON.parse(saved);
      
      // Check if data is not too old (7 days)
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (data.timestamp && (new Date().getTime() - data.timestamp) < oneWeek) {
        cart = data.cart || [];
        newsItems = data.newsItems || [];
        events = data.events || [];
        featuredVideoUrl = data.featuredVideoUrl || null;
        latestEpisodeUrl = data.latestEpisodeUrl || null;
        rssFeedUrl = data.rssFeedUrl || 'https://mmajunkie.usatoday.com/feed';
      }
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    // Reset to defaults if there's an error
    cart = [];
    newsItems = [];
    events = [];
    featuredVideoUrl = null;
    latestEpisodeUrl = null;
    rssFeedUrl = 'https://mmajunkie.usatoday.com/feed';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  initializeApp();
  loadSampleData();
  setupEventListeners();
  updateLastUpdated();
  setupMobileMenu();
  initBreakingNews();
  startHeadlinesAutoRefresh();
});

function initializeApp() {
  document.getElementById('year').textContent = new Date().getFullYear();
  renderProducts();
  renderFighterStats();
  renderQuickStats();
  renderEvents();
  setupThemeToggle();
  
  // Render saved videos
  renderFeaturedVideo();
  renderLatestEpisode();
  
  // Set RSS feed URL in admin tools
  document.getElementById('rssFeedUrl').value = rssFeedUrl;
}

// RSS Feed Functions
function startHeadlinesAutoRefresh() {
  // Clear any existing interval
  if (headlinesRefreshInterval) {
    clearInterval(headlinesRefreshInterval);
  }
  
  // Refresh every 5 minutes (300000 ms)
  headlinesRefreshInterval = setInterval(async () => {
    console.log('Auto-refreshing breaking news...');
    await initBreakingNews();
  }, 300000); // 5 minutes
  
  console.log('Headlines auto-refresh enabled (every 5 minutes)');
}

// Check if headlines need refresh on page load
function checkHeadlinesFreshness() {
  const lastUpdate = localStorage.getItem('dosfronteras_headlines_update');
  
  if (lastUpdate) {
    const lastUpdateTime = new Date(lastUpdate);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // If last update was more than 5 minutes ago, refresh
    if (lastUpdateTime < fiveMinutesAgo) {
      console.log('Headlines are stale, refreshing...');
      return true;
    }
  } else {
    // No previous update recorded
    return true;
  }
  
  return false;
}

// Render breaking news to the DOM
function renderBreakingNews(headlines) {
  const breakingNewsList = document.getElementById('breakingNewsList');
  
  if (!breakingNewsList) {
    console.error('Breaking news list element not found');
    return;
  }
  
  if (!headlines || headlines.length === 0) {
    breakingNewsList.innerHTML = `
      <li style="text-align: center; padding: 20px; color: var(--text-muted);">
        <i class="fas fa-exclamation-circle"></i> No headlines available
      </li>
    `;
    return;
  }
  
  breakingNewsList.innerHTML = '';
  
  headlines.forEach(headline => {
    const listItem = document.createElement('li');
    listItem.className = 'headline-item';
    
    const sourceSpan = document.createElement('span');
    // Create a safe CSS class name
    const safeSourceClass = headline.source.toLowerCase().replace(/\s+/g, '-');
    sourceSpan.className = `headline-source source-${safeSourceClass}`;
    sourceSpan.textContent = headline.source;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'headline-text';
    
    const link = document.createElement('a');
    link.className = 'headline-link';
    link.href = headline.url;
    link.textContent = headline.text;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    textDiv.appendChild(link);
    listItem.appendChild(sourceSpan);
    listItem.appendChild(textDiv);
    breakingNewsList.appendChild(listItem);
  });
  
  console.log(`Rendered ${headlines.length} headlines`);
}

// Enhanced RSS parsing function to handle XML directly
async function parseRSSFeed(xmlText, sourceName) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parsing error: ' + parseError.textContent);
    }
    
    // Try different RSS formats
    let items = xmlDoc.querySelectorAll('item');
    if (items.length === 0) {
      items = xmlDoc.querySelectorAll('entry'); // Atom format
    }
    
    const headlines = [];
    
    items.forEach((item, index) => {
      if (index >= 3) return; // Limit to 3 items per feed
      
      const title = item.querySelector('title')?.textContent || 
                   item.querySelector('title')?.textContent || 'No title';
      const link = item.querySelector('link')?.textContent || 
                  item.querySelector('link')?.getAttribute('href') || 
                  item.querySelector('id')?.textContent || '#';
      const pubDate = item.querySelector('pubDate')?.textContent || 
                     item.querySelector('published')?.textContent || 
                     item.querySelector('updated')?.textContent || 
                     new Date().toISOString();
      
      // Clean up title (remove CDATA if present)
      const cleanTitle = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
      
      if (cleanTitle && cleanTitle !== 'No title') {
        headlines.push({
          source: sourceName,
          text: cleanTitle.length > 100 ? cleanTitle.substring(0, 100) + '...' : cleanTitle,
          url: link,
          date: pubDate
        });
      }
    });
    
    return headlines;
  } catch (error) {
    console.error(`Error parsing RSS for ${sourceName}:`, error);
    return [];
  }
}

// Completely rewritten RSS fetching function with better error handling
async function fetchRealHeadlines() {
  const allHeadlines = [];
  const successfulFeeds = [];
  
  console.log('Starting enhanced RSS feed fetch...');
  
  for (const feed of RSS_FEEDS) {
    try {
      console.log(`Fetching from ${feed.name}...`);
      
      const response = await fetchWithTimeout(feed.url, 10000);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      
      if (!text || text.includes('Error') || text.includes('Not Found') || text.includes('403') || text.includes('404')) {
        throw new Error('Invalid response from feed');
      }
      
      let headlines = [];
      
      if (feed.type === 'xml') {
        // Parse XML directly
        headlines = await parseRSSFeed(text, feed.source);
      }
      
      if (headlines.length > 0) {
        allHeadlines.push(...headlines);
        successfulFeeds.push(feed.name);
        console.log(`✓ ${feed.name}: ${headlines.length} headlines`);
      } else {
        throw new Error('No valid headlines found');
      }
      
    } catch (error) {
      console.warn(`✗ ${feed.name}: ${error.message}`);
      
      // Use mock data for this feed if fallback is enabled
      if (feed.fallback) {
        const mockHeadlines = getMockHeadlines(feed.source);
        allHeadlines.push(...mockHeadlines);
        console.log(`✓ ${feed.name}: Using mock data (${mockHeadlines.length} headlines)`);
      }
    }
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`Completed: ${successfulFeeds.length}/${RSS_FEEDS.length} feeds successful`);
  console.log(`Total headlines: ${allHeadlines.length}`);
  
  // Remove duplicates based on title
  const uniqueHeadlines = allHeadlines.filter((headline, index, self) => 
    index === self.findIndex(h => 
      h.text === headline.text && h.source === headline.source
    )
  );
  
  return uniqueHeadlines.slice(0, 8); // Limit to 8 total headlines
}

// Enhanced fetchWithTimeout with better error handling
async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*'
      }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    } else if (error.name === 'TypeError') {
      throw new Error('Network error - CORS or connectivity issue');
    } else {
      throw error;
    }
  }
}

// Enhanced breaking news initialization with better error recovery
async function initBreakingNews() {
  const breakingNewsList = document.getElementById('breakingNewsList');
  
  if (!breakingNewsList) {
    console.error('Breaking news list element not found');
    return;
  }
  
  // Show loading state
  breakingNewsList.innerHTML = `
    <li style="text-align: center; padding: 20px;">
      <div class="loading">
        <div class="loading-spinner"></div>
        Loading real MMA headlines...
      </div>
    </li>
  `;
  
  try {
    console.log('Fetching breaking news from updated RSS feeds...');
    
    // Try to fetch real headlines first
    let headlines = await fetchRealHeadlines();
    
    // If no real headlines, use mock data
    if (headlines.length === 0) {
      console.log('No real headlines found, using mock data as fallback');
      headlines = getMockHeadlinesAll();
    }
    
    HEADLINES = headlines;
    renderBreakingNews(headlines);
    
    // Save headlines and last update time
    try {
      localStorage.setItem('dosfronteras_headlines', JSON.stringify(headlines));
      localStorage.setItem('dosfronteras_headlines_update', new Date().toISOString());
    } catch (storageError) {
      console.warn('Could not save to localStorage:', storageError);
    }
    
  } catch (error) {
    console.error('Critical error in initBreakingNews:', error);
    // Use mock data as final fallback
    const mockHeadlines = getMockHeadlinesAll();
    HEADLINES = mockHeadlines;
    renderBreakingNews(mockHeadlines);
  }
}

// Update the mock headlines to be more current
function getMockHeadlinesAll() {
  const currentDate = new Date().toISOString();
  return [
    {
      source: 'MMA Fighting',
      text: 'UFC 303: Pereira vs Prochazka 2 headlines International Fight Week',
      url: 'https://www.mmafighting.com/2024/5/15/ufc-303-pereira-prochazka',
      date: currentDate
    },
    {
      source: 'MMA Fighting', 
      text: 'Islam Makhachev confirms next title defense against Arman Tsarukyan',
      url: 'https://www.mmafighting.com/2024/5/15/makhachev-tsarukyan',
      date: currentDate
    },
    {
      source: 'MMA Junkie',
      text: 'Tom Aspinall set to defend interim heavyweight title at UFC 304',
      url: 'https://mmajunkie.usatoday.com/2024/5/aspinall-title-defense-ufc-304',
      date: currentDate
    },
    {
      source: 'MMA Junkie',
      text: 'PFL announces 2024 season schedule with new format changes',
      url: 'https://mmajunkie.usatoday.com/2024/5/pfl-2024-season-schedule',
      date: currentDate
    },
    {
      source: 'Bloody Elbow',
      text: 'Sean OMalleys next bantamweight title defense in the works',
      url: 'https://www.bloodyelbow.com/2024/5/omalley-next-defense',
      date: currentDate
    },
    {
      source: 'Bloody Elbow',
      text: 'Kayla Harrison makes successful UFC debut with dominant victory',
      url: 'https://www.bloodyelbow.com/2024/5/harrison-ufc-debut',
      date: currentDate
    },
    {
      source: 'ESPN',
      text: 'Conor McGregor announces return plans for 2024',
      url: 'https://www.espn.com/mma/story/_/id/mcgregor-return-2024',
      date: currentDate
    },
    {
      source: 'Sherdog',
      text: 'Bellator Champions Series launches with stacked London card',
      url: 'https://www.sherdog.com/news/news/bellator-champions-series-london',
      date: currentDate
    }
  ];
}

function getMockHeadlines(source) {
  const mockData = {
    'MMA Fighting': [
      {
        source: 'MMA Fighting',
        text: 'UFC 303: Pereira vs Prochazka 2 headlines International Fight Week',
        url: 'https://www.mmafighting.com/2024/5/15/ufc-303-pereira-prochazka',
        date: new Date().toISOString()
      },
      {
        source: 'MMA Fighting',
        text: 'Islam Makhachev confirms next title defense against Arman Tsarukyan', 
        url: 'https://www.mmafighting.com/2024/5/15/makhachev-tsarukyan',
        date: new Date().toISOString()
      }
    ],
    'MMA Junkie': [
      {
        source: 'MMA Junkie',
        text: 'Tom Aspinall set to defend interim heavyweight title at UFC 304',
        url: 'https://mmajunkie.usatoday.com/2024/5/aspinall-title-defense-ufc-304',
        date: new Date().toISOString()
      },
      {
        source: 'MMA Junkie',
        text: 'PFL announces 2024 season schedule with new format changes',
        url: 'https://mmajunkie.usatoday.com/2024/5/pfl-2024-season-schedule',
        date: new Date().toISOString()
      }
    ],
    'Bloody Elbow': [
      {
        source: 'Bloody Elbow', 
        text: 'Sean OMalleys next bantamweight title defense in the works',
        url: 'https://www.bloodyelbow.com/2024/5/omalley-next-defense',
        date: new Date().toISOString()
      },
      {
        source: 'Bloody Elbow',
        text: 'Kayla Harrison makes successful UFC debut with dominant victory',
        url: 'https://www.bloodyelbow.com/2024/5/harrison-ufc-debut',
        date: new Date().toISOString()
      }
    ],
    'ESPN': [
      {
        source: 'ESPN',
        text: 'Conor McGregor announces return plans for 2024',
        url: 'https://www.espn.com/mma/story/_/id/mcgregor-return-2024',
        date: new Date().toISOString()
      }
    ],
    'Sherdog': [
      {
        source: 'Sherdog',
        text: 'Bellator Champions Series launches with stacked London card',
        url: 'https://www.sherdog.com/news/news/bellator-champions-series-london',
        date: new Date().toISOString()
      }
    ]
  };
  
  return mockData[source] || [];
}

// Mobile Menu Functions
function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileCloseBtn = document.getElementById('mobileCloseBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.createElement('div');
  mobileOverlay.className = 'mobile-overlay';
  document.body.appendChild(mobileOverlay);

  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.add('active');
    mobileOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  mobileCloseBtn.addEventListener('click', closeMobileMenu);
  mobileOverlay.addEventListener('click', closeMobileMenu);

  // Close menu when clicking on links
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Mobile theme toggle
  document.getElementById('themeToggleMobile').addEventListener('click', () => {
    document.getElementById('themeToggle').click();
  });

  // Mobile cart
  document.getElementById('cartIconMobile').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#shop').scrollIntoView({ behavior: 'smooth' });
  });
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icons = document.querySelectorAll('#themeToggle i, #themeToggleMobile i');
  icons.forEach(icon => {
    if (theme === 'dark') {
      icon.className = 'fas fa-moon';
    } else {
      icon.className = 'fas fa-sun';
    }
  });
}

function loadSampleData() {
  // Only load sample data if no saved data exists
  if (newsItems.length === 0) {
    newsItems = [
      {
        title: 'Major UFC Card Announced for Mexico City',
        summary: 'The UFC has officially announced a stacked card coming to Mexico City Arena in March, featuring several top-ranked fighters.',
        date: '2024-11-10',
        tags: ['UFC', 'Mexico', 'Card Announcement'],
        image: null
      },
      {
        title: 'Rising Mexican Fighter Signs Multi-Fight Deal',
        summary: 'Promising lightweight contender signs exclusive contract with major promotion after impressive winning streak.',
        date: '2024-11-08',
        tags: ['Signing', 'Mexico', 'Lightweight'],
        image: null
      },
      {
        title: 'Cross-Border Training Camp Announced',
        summary: 'Elite fighters from USA and Mexico to train together in groundbreaking collaboration ahead of upcoming event.',
        date: '2024-11-05',
        tags: ['Training', 'USA', 'Mexico'],
        image: null
      }
    ];
  }

  if (events.length === 0) {
    events = [
      { date: '2024-12-15', match: 'Martinez vs Johnson' },
      { date: '2024-12-22', match: 'Rodriguez vs Davis' },
      { date: '2025-01-05', match: 'Garcia vs Thompson' }
    ];
  }

  renderNews();
  renderEvents();
  saveToLocalStorage();
}

function setupEventListeners() {
  // Admin toggle
  document.getElementById('adminToggle').addEventListener('click', toggleAdminMode);

  // Cart
  document.getElementById('cartIcon').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#shop').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (cart.length > 0) {
      alert('Checkout functionality would redirect to payment processor. Total: $' + calculateTotal().toFixed(2));
    }
  });

  // News admin
  document.getElementById('addNewsBtn').addEventListener('click', addNews);
  document.getElementById('newsImage').addEventListener('change', handleImageUpload);

  // Video admin
  document.getElementById('addVideoBtn').addEventListener('click', addFeaturedVideo);
  document.getElementById('removeFeaturedVideo').addEventListener('click', removeFeaturedVideo);

  // Latest episode admin
  document.getElementById('addLatestEpisodeBtn').addEventListener('click', addLatestEpisode);
  document.getElementById('removeLatestEpisode').addEventListener('click', removeLatestEpisode);

  // Events admin
  document.getElementById('addEventBtn').addEventListener('click', addEvent);

  // RSS Feed admin
  document.getElementById('saveRssFeedBtn').addEventListener('click', saveRssFeed);

  // Stats refresh
  document.getElementById('refreshStats').addEventListener('click', () => {
    document.getElementById('fighterStatsContainer').innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading fighter statistics...</div>';
    setTimeout(renderFighterStats, 1000);
  });

  // Breaking news refresh
  document.getElementById('refreshBreakingNews').addEventListener('click', refreshBreakingNews);
}

function toggleAdminMode() {
  adminMode = !adminMode;
  const btn = document.getElementById('adminToggle');
  btn.textContent = 'Admin Mode: ' + (adminMode ? 'ON' : 'OFF');
  btn.style.background = adminMode ? '#e63946' : '#457b9d';

  // Toggle all admin tools
  document.querySelectorAll('.admin-tools').forEach(el => {
    el.style.display = adminMode ? 'block' : 'none';
  });

  // Re-render news to show/hide remove buttons
  renderNews();
}

function saveRssFeed() {
  const url = document.getElementById('rssFeedUrl').value;
  if (url) {
    rssFeedUrl = url;
    saveToLocalStorage();
    refreshBreakingNews();
    alert('RSS Feed URL saved!');
  }
}

// Products
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-image">
        <i class="fas ${p.icon}" style="font-size: 48px;"></i>
      </div>
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-description">${p.description}</div>
        <div class="product-price">$${p.price.toFixed(2)}</div>
        <button class="add-to-cart" onclick="addToCart(${p.id})">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (product) {
    cart.push(product);
    updateCart();
    saveToLocalStorage();
    
    // Visual feedback
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Added!';
    btn.style.background = '#06d6a0';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
    }, 1500);
  }
}

function updateCart() {
  const count = document.getElementById('cartCount');
  const mobileCount = document.getElementById('cartCountMobile');
  const items = document.getElementById('cartItems');
  const total = document.getElementById('cartTotal');
  const checkout = document.getElementById('checkoutBtn');

  count.textContent = cart.length;
  mobileCount.textContent = cart.length;

  if (cart.length === 0) {
    items.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>Your cart is empty</p>
        <p class="small">Add some merchandise to get started!</p>
      </div>
    `;
    checkout.disabled = true;
  } else {
    items.innerHTML = cart.map((item, idx) => `
      <div class="cart-item">
        <div>
          <div style="font-weight: bold;">${item.name}</div>
          <div class="small">$${item.price.toFixed(2)}</div>
        </div>
        <button onclick="removeFromCart(${idx})" style="background: none; border: none; color: var(--primary); cursor: pointer;">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
    checkout.disabled = false;
  }

  total.textContent = '$' + calculateTotal().toFixed(2);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
  saveToLocalStorage();
}

function calculateTotal() {
  return cart.reduce((sum, item) => sum + item.price, 0);
}

// News
function renderNews() {
  const container = document.getElementById('newsContainer');
  
  if (newsItems.length === 0) {
    container.innerHTML = '<div class="small" style="text-align: center; padding: 40px; color: var(--text-muted);">No news items yet. Add one using admin mode.</div>';
    return;
  }

  container.innerHTML = newsItems.map((news, index) => `
    <div class="news-item">
      ${news.image ? `<img src="${news.image}" alt="${news.title}" class="news-thumbnail">` : ''}
      <div class="news-content">
        <div class="news-title">${news.title}</div>
        <div class="news-meta">
          <span><i class="fas fa-calendar"></i> ${news.date}</span>
        </div>
        <p class="small">${news.summary}</p>
        <div class="news-tags">
          ${news.tags.map(tag => `<span class="news-tag">${tag}</span>`).join('')}
        </div>
      </div>
      ${adminMode ? `
        <button class="remove-news-btn" onclick="removeNewsItem(${index})" title="Remove this story">
          <i class="fas fa-times"></i>
        </button>
      ` : ''}
    </div>
  `).join('');
}

function removeNewsItem(index) {
  if (confirm('Are you sure you want to remove this news story?')) {
    newsItems.splice(index, 1);
    renderNews();
    updateLastUpdated();
    saveToLocalStorage();
  }
}

function addNews() {
  const title = document.getElementById('newsTitle').value;
  const summary = document.getElementById('newsSummary').value;
  const date = document.getElementById('newsDate').value;
  const tags = document.getElementById('newsTags').value.split(',').map(t => t.trim());
  const preview = document.getElementById('imagePreview');
  const image = preview.classList.contains('active') ? preview.src : null;

  if (title && summary && date) {
    newsItems.unshift({ title, summary, date, tags, image });
    renderNews();
    
    // Clear inputs
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsSummary').value = '';
    document.getElementById('newsDate').value = '';
    document.getElementById('newsTags').value = '';
    preview.classList.remove('active');
    
    updateLastUpdated();
    saveToLocalStorage();
  }
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = document.getElementById('imagePreview');
      preview.src = event.target.result;
      preview.classList.add('active');
    };
    reader.readAsDataURL(file);
  }
}

// Videos
function addFeaturedVideo() {
  const url = document.getElementById('videoUrl').value;
  if (url) {
    const embedUrl = convertToEmbedUrl(url);
    if (embedUrl) {
      featuredVideoUrl = embedUrl;
      renderFeaturedVideo();
      document.getElementById('videoUrl').value = '';
      saveToLocalStorage();
    }
  }
}

function removeFeaturedVideo() {
  featuredVideoUrl = null;
  renderFeaturedVideo();
  saveToLocalStorage();
}

function renderFeaturedVideo() {
  const container = document.getElementById('videoContainer');
  const removeBtn = document.getElementById('removeFeaturedVideo');
  
  if (featuredVideoUrl) {
    container.innerHTML = `
      <div class="video-container">
        <iframe src="${featuredVideoUrl}" allowfullscreen></iframe>
      </div>
    `;
    removeBtn.style.display = 'block';
  } else {
    container.innerHTML = '<div class="small" id="videoPlaceholder">No featured video yet — add a YouTube or Rumble link below.</div>';
    removeBtn.style.display = 'none';
  }
}

function addLatestEpisode() {
  const url = document.getElementById('latestEpisodeUrl').value;
  if (url) {
    const embedUrl = convertToEmbedUrl(url);
    if (embedUrl) {
      latestEpisodeUrl = embedUrl;
      renderLatestEpisode();
      document.getElementById('latestEpisodeUrl').value = '';
      saveToLocalStorage();
    }
  }
}

function removeLatestEpisode() {
  latestEpisodeUrl = null;
  renderLatestEpisode();
  saveToLocalStorage();
}

function renderLatestEpisode() {
  const container = document.getElementById('latestEpisodeContainer');
  const removeBtn = document.getElementById('removeLatestEpisode');
  
  if (latestEpisodeUrl) {
    container.innerHTML = `
      <div class="video-container">
        <iframe src="${latestEpisodeUrl}" allowfullscreen></iframe>
      </div>
    `;
    removeBtn.style.display = 'block';
  } else {
    container.innerHTML = '<div class="small" id="latestEpisodePlaceholder">No latest episode video added yet.</div>';
    removeBtn.style.display = 'none';
  }
}

function convertToEmbedUrl(url) {
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('youtu.be') 
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }
  // Rumble
  if (url.includes('rumble.com')) {
    const videoId = url.split('/')[url.split('/').length - 1].split('.')[0];
    return `https://rumble.com/embed/${videoId}`;
  }
  return null;
}

// Fighter Stats
function renderFighterStats() {
  const container = document.getElementById('fighterStatsContainer');
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Fighter</th>
          <th>Record</th>
          <th>Country</th>
        </tr>
      </thead>
      <tbody>
        ${fighters.map(f => `
          <tr>
            <td><strong>${f.name}</strong></td>
            <td>${f.record}</td>
            <td>${f.country}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderQuickStats() {
  const container = document.getElementById('quickStatsContainer');
  const totalWins = fighters.reduce((sum, f) => sum + f.wins, 0);
  const totalFights = fighters.reduce((sum, f) => sum + f.wins + f.losses, 0);
  
  container.innerHTML = `
    <div style="display: grid; gap: 15px;">
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);">
        <span>Total Fighters</span>
        <strong>${fighters.length}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);">
        <span>Total Fights</span>
        <strong>${totalFights}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0;">
        <span>Total Wins</span>
        <strong style="color: var(--success)">${totalWins}</strong>
      </div>
    </div>
  `;
}

// Events
function renderEvents() {
  const tbody = document.querySelector('#eventsTable tbody');
  
  if (events.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No upcoming events</td></tr>';
    return;
  }

  tbody.innerHTML = events.map(e => `
    <tr>
      <td>${e.date}</td>
      <td><strong>${e.match}</strong></td>
    </tr>
  `).join('');
}

function addEvent() {
  const date = document.getElementById('evDate').value;
  const match = document.getElementById('evMatch').value;

  if (date && match) {
    events.push({ date, match });
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    renderEvents();
    
    document.getElementById('evDate').value = '';
    document.getElementById('evMatch').value = '';
    updateLastUpdated();
    saveToLocalStorage();
  }
}

// Breaking News with RSS Feed
async function refreshBreakingNews() {
  const breakingNewsList = document.getElementById('breakingNewsList');
  if (breakingNewsList) {
    breakingNewsList.innerHTML = `
      <li style="text-align: center; padding: 20px;">
        <div class="loading">
          <div class="loading-spinner"></div>
          Refreshing headlines...
        </div>
      </li>
    `;
  }
  
  await initBreakingNews();
}

function updateLastUpdated() {
  const now = new Date();
  const formatted = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  document.getElementById('lastUpdated').textContent = formatted;
}
