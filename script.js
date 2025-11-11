// Site Configuration
const SITE = {
  payPalEmail: "donate@dosfronteras.example",
  countApiNamespace: "dos_fronteras",
  countApiKey: "visits"
};

// Data Management
let NEWS = [];
let EVENTS = [];
let FEATURED_VIDEO_URL = "";
let LATEST_EPISODE_URL = "";
let lastUpdateTime = null;
let adminMode = false;
let currentImageForCropping = null;
let croppedImageDataUrl = null;

// Real-time Headlines from RSS feeds
let HEADLINES = [];

// Enhanced RSS Feed Sources with CORS proxies
const RSS_FEEDS = [
  {
    name: 'MMA Fighting',
    url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.mmafighting.com/rss/current',
    source: 'MMA Fighting',
    fallback: true
  },
  {
    name: 'MMA Junkie', 
    url: 'https://api.rss2json.com/v1/api.json?rss_url=https://mmajunkie.usatoday.com/feed',
    source: 'MMA Junkie',
    fallback: true
  },
  {
    name: 'Bloody Elbow',
    url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.bloodyelbow.com/rss/current',
    source: 'Bloody Elbow',
    fallback: true
  }
];

// Improved RSS fetching with better error handling
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Enhanced breaking news initialization
async function initBreakingNews() {
  const breakingNewsList = document.getElementById('breakingNewsList');
  
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
    console.log('Fetching breaking news from RSS feeds...');
    
    // Try to fetch real headlines first
    let headlines = await fetchRealHeadlines();
    
    // If no real headlines, use mock data
    if (headlines.length === 0) {
      console.log('Using mock headlines as fallback');
      headlines = getMockHeadlinesAll();
    }
    
    HEADLINES = headlines;
    renderBreakingNews(headlines);
    
    // Save headlines and last update time
    localStorage.setItem('dosfronteras_headlines', JSON.stringify(headlines));
    localStorage.setItem('dosfronteras_headlines_update', new Date().toISOString());
    
  } catch (error) {
    console.error('Error in initBreakingNews:', error);
    // Use mock data as final fallback
    const mockHeadlines = getMockHeadlinesAll();
    HEADLINES = mockHeadlines;
    renderBreakingNews(mockHeadlines);
  }
}

// Auto-refresh breaking news every 5 minutes
let headlinesRefreshInterval = null;

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
  
  if (!headlines || headlines.length === 0) {
    breakingNewsList.innerHTML = `
      <li style="text-align: center; padding: 20px; color: var(--text-light);">
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

// Enhanced RSS fetching with multiple fallback strategies
async function fetchRealHeadlines() {
  const allHeadlines = [];
  const successfulFeeds = [];
  
  console.log('Starting RSS feed fetch...');
  
  for (const feed of RSS_FEEDS) {
    try {
      console.log(`Fetching from ${feed.name}...`);
      const response = await fetchWithTimeout(feed.url, 8000);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'ok' && data.items && data.items.length > 0) {
        // Get top 2 articles from each source
        const headlines = data.items.slice(0, 2).map(item => ({
          source: feed.source,
          text: item.title.length > 100 ? item.title.substring(0, 100) + '...' : item.title,
          url: item.link,
          date: item.pubDate
        }));
        
        allHeadlines.push(...headlines);
        successfulFeeds.push(feed.name);
        console.log(`✓ ${feed.name}: ${headlines.length} headlines`);
        
      } else {
        throw new Error('Invalid RSS data');
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
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`Completed: ${successfulFeeds.length}/${RSS_FEEDS.length} feeds successful`);
  console.log(`Total headlines: ${allHeadlines.length}`);
  
  return allHeadlines;
}

// Enhanced mock data
function getMockHeadlinesAll() {
  return [
    {
      source: 'MMA Fighting',
      text: 'UFC 302: Makhachev vs Poirier set for June 1st in Newark',
      url: 'https://www.mmafighting.com/2024/5/15/ufc-302-makhachev-poirier-announcement',
      date: new Date().toISOString()
    },
    {
      source: 'MMA Fighting', 
      text: 'Sean Strickland dominates Paulo Costa in main event decision',
      url: 'https://www.mmafighting.com/2024/5/15/strickland-costa-results',
      date: new Date().toISOString()
    },
    {
      source: 'MMA Junkie',
      text: 'Alex Pereira confirms move to heavyweight for title defense',
      url: 'https://mmajunkie.usatoday.com/2024/5/pereira-heavyweight-move',
      date: new Date().toISOString()
    },
    {
      source: 'MMA Junkie',
      text: 'Bellator announces partnership with PFL for champion vs champion events',
      url: 'https://mmajunkie.usatoday.com/2024/5/bellator-pfl-partnership',
      date: new Date().toISOString()
    },
    {
      source: 'Bloody Elbow',
      text: 'Jon Jones announces comeback fight for late 2024',
      url: 'https://www.bloodyelbow.com/2024/5/jon-jones-comeback',
      date: new Date().toISOString()
    },
    {
      source: 'Bloody Elbow',
      text: 'Rising star shows incredible knockout power in latest victory',
      url: 'https://www.bloodyelbow.com/2024/5/rising-star-knockout',
      date: new Date().toISOString()
    }
  ];
}

function getMockHeadlines(source) {
  const mockData = {
    'MMA Fighting': [
      {
        source: 'MMA Fighting',
        text: 'UFC 302: Makhachev vs Poirier set for June 1st in Newark',
        url: 'https://www.mmafighting.com/2024/5/15/ufc-302-makhachev-poirier-announcement',
        date: new Date().toISOString()
      },
      {
        source: 'MMA Fighting',
        text: 'Sean Strickland dominates Paulo Costa in main event decision', 
        url: 'https://www.mmafighting.com/2024/5/15/strickland-costa-results',
        date: new Date().toISOString()
      }
    ],
    'MMA Junkie': [
      {
        source: 'MMA Junkie',
        text: 'Alex Pereira confirms move to heavyweight for title defense',
        url: 'https://mmajunkie.usatoday.com/2024/5/pereira-heavyweight-move',
        date: new Date().toISOString()
      },
      {
        source: 'MMA Junkie',
        text: 'Bellator announces partnership with PFL for champion vs champion events',
        url: 'https://mmajunkie.usatoday.com/2024/5/bellator-pfl-partnership',
        date: new Date().toISOString()
      }
    ],
    'Bloody Elbow': [
      {
        source: 'Bloody Elbow', 
        text: 'Jon Jones announces comeback fight for late 2024',
        url: 'https://www.bloodyelbow.com/2024/5/jon-jones-comeback',
        date: new Date().toISOString()
      },
      {
        source: 'Bloody Elbow',
        text: 'Rising star shows incredible knockout power in latest victory',
        url: 'https://www.bloodyelbow.com/2024/5/rising-star-knockout',
        date: new Date().toISOString()
      }
    ]
  };
  
  return mockData[source] || [];
}

// Add manual refresh function for breaking news
function refreshBreakingNews() {
  const breakingNewsList = document.getElementById('breakingNewsList');
  breakingNewsList.innerHTML = `
    <li style="text-align: center; padding: 20px;">
      <div class="loading">
        <div class="loading-spinner"></div>
        Refreshing headlines...
      </div>
    </li>
  `;
  
  initBreakingNews();
}

// Fighter Statistics
const FIGHTER_STATS = [
  {
    id: "f1",
    name: "Islam Makhachev",
    record: "24-1-0",
    division: "Lightweight",
    country: "Russia",
    stats: {
      wins: 24, losses: 1, knockouts: 4, submissions: 11, decisions: 9,
      strikesPerMinute: 3.47, strikingAccuracy: 59, takedownsPerFight: 3.37,
      takedownAccuracy: 65, submissionAverage: 1.2
    }
  },
  {
    id: "f2",
    name: "Alex Pereira",
    record: "9-2-0",
    division: "Light Heavyweight",
    country: "Brazil",
    stats: {
      wins: 9, losses: 2, knockouts: 7, submissions: 0, decisions: 2,
      strikesPerMinute: 5.32, strikingAccuracy: 61, takedownsPerFight: 0.0,
      takedownAccuracy: 0, submissionAverage: 0.0
    }
  }
];

// E-commerce Data
const PRODUCTS = [
  {
    id: "prod-1",
    name: "Dos Fronteras T-Shirt",
    description: "Premium cotton t-shirt with exclusive Dos Fronteras design",
    price: 29.99,
    originalPrice: 34.99,
    image: "tshirt",
    badge: "Bestseller",
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing"
  },
  {
    id: "prod-2",
    name: "Fight Night Hoodie",
    description: "Comfortable hoodie perfect for fight nights and training sessions",
    price: 49.99,
    originalPrice: 59.99,
    image: "hoodie",
    badge: "New",
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "clothing"
  }
];

let shoppingCart = [];
let selectedSizes = {};

// DOM Utilities
function el(tag, props={}, ...children){
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k,v])=>{
    if(k === "class") node.className = v;
    else if(k === "html") node.innerHTML = v;
    else node.setAttribute(k,v);
  });
  children.forEach(c=> {
    if(typeof c === "string") node.appendChild(document.createTextNode(c));
    else if(c) node.appendChild(c);
  });
  return node;
}

// Data Persistence Functions
function saveDataToStorage() {
  try {
    localStorage.setItem('dosfronteras_news', JSON.stringify(NEWS));
    localStorage.setItem('dosfronteras_events', JSON.stringify(EVENTS));
    localStorage.setItem('dosfronteras_featured_video', FEATURED_VIDEO_URL);
    localStorage.setItem('dosfronteras_latest_episode', LATEST_EPISODE_URL);
    localStorage.setItem('dosfronteras_cart', JSON.stringify(shoppingCart));
    localStorage.setItem('dosfronteras_last_fetch', new Date().toISOString());
    console.log('Data saved to localStorage');
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
}

function loadDataFromStorage() {
  try {
    const savedNews = localStorage.getItem('dosfronteras_news');
    const savedEvents = localStorage.getItem('dosfronteras_events');
    const savedFeaturedVideo = localStorage.getItem('dosfronteras_featured_video');
    const savedLatestEpisode = localStorage.getItem('dosfronteras_latest_episode');
    const savedCart = localStorage.getItem('dosfronteras_cart');
    const lastFetch = localStorage.getItem('dosfronteras_last_fetch');
    
    if (savedNews) NEWS = JSON.parse(savedNews);
    if (savedEvents) EVENTS = JSON.parse(savedEvents);
    if (savedFeaturedVideo) FEATURED_VIDEO_URL = savedFeaturedVideo;
    if (savedLatestEpisode) LATEST_EPISODE_URL = savedLatestEpisode;
    if (savedCart) shoppingCart = JSON.parse(savedCart);
    
    // Check if we should refresh data (older than 1 hour)
    if (lastFetch) {
      const lastFetchTime = new Date(lastFetch);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (lastFetchTime < oneHourAgo) {
        // Data is stale, refresh it
        refreshAllData();
      }
    }
    
    console.log('Data loaded from localStorage');
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }
}

// Refresh all data from external sources
async function refreshAllData() {
  console.log('Refreshing data from external sources...');
  
  try {
    // Refresh breaking news
    await initBreakingNews();
    
    // Refresh news articles
    const freshNews = await fetchRealNews();
    if (freshNews.length > 0) {
      NEWS = freshNews;
      saveDataToStorage();
      renderNews(NEWS);
    }
    
    lastUpdateTime = new Date();
    document.getElementById('lastUpdated').textContent = lastUpdateTime.toLocaleString();
    
    // Update refresh button state
    const refreshBtn = document.getElementById('refreshStats');
    if (refreshBtn) {
      const originalHTML = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<i class="fas fa-check"></i> Updated!';
      refreshBtn.style.background = 'var(--accent)';
      
      setTimeout(() => {
        refreshBtn.innerHTML = originalHTML;
        refreshBtn.style.background = '';
      }, 2000);
    }
    
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
}

// Fetch real MMA news articles
async function fetchRealNews() {
  const allNews = [];
  
  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed.url);
      const data = await response.json();
      
      if (data.status === 'ok' && data.items) {
        // Get top 5 articles from each source
        const articles = data.items.slice(0, 5).map(item => {
          // Extract text from description (remove HTML tags)
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = item.description || '';
          const summary = tempDiv.textContent.substring(0, 200) + '...';
          
          return {
            id: 'news-' + (item.guid || item.link),
            title: item.title,
            summary: summary,
            date: new Date(item.pubDate).toLocaleDateString(),
            tags: [feed.source],
            thumb: item.thumbnail || item.enclosure?.link || '',
            url: item.link
          };
        });
        
        allNews.push(...articles);
      }
    } catch (error) {
      console.error(`Error fetching news from ${feed.name}:`, error);
      // Fallback to mock news
      allNews.push(...getMockNews(feed.source));
    }
  }
  
  // Sort by date (newest first)
  allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return allNews;
}

// Mock news as fallback
function getMockNews(source) {
  const mockNews = {
    'MMA Fighting': [
      {
        id: 'news-mmaf-1',
        title: 'UFC 302: Makhachev vs Poirier Championship Bout Confirmed',
        summary: 'The lightweight title fight is official for June 1st in Newark, New Jersey...',
        date: new Date().toLocaleDateString(),
        tags: ['UFC', 'Breaking'],
        thumb: '',
        url: 'https://www.mmafighting.com/2024/5/15/ufc-302'
      }
    ],
    'MMA Junkie': [
      {
        id: 'news-junkie-1',
        title: 'Sean Strickland Earns Decision Victory Over Paulo Costa',
        summary: 'In a tactical battle, Strickland utilized his jab and defense to secure a unanimous decision...',
        date: new Date().toLocaleDateString(),
        tags: ['UFC', 'Results'],
        thumb: '',
        url: 'https://mmajunkie.usatoday.com/2024/5/strickland-costa'
      }
    ],
    'Bloody Elbow': [
      {
        id: 'news-be-1',
        title: 'Patricio Pitbull Successfully Defends Bellator Title',
        summary: 'The featherweight champion showed his experience in a hard-fought battle...',
        date: new Date().toLocaleDateString(),
        tags: ['Bellator', 'Championship'],
        thumb: '',
        url: 'https://www.bloodyelbow.com/2024/5/pitbull-defense'
      }
    ]
  };
  
  return mockNews[source] || [];
}

// Rendering Functions
function renderNews(news) {
  const container = document.getElementById('newsContainer');
  
  if (!news || news.length === 0) {
    container.innerHTML = '<div class="data-error">No news available. <button class="refresh-btn" onclick="refreshAllData()"><i class="fas fa-sync-alt"></i> Refresh</button></div>';
    return;
  }
  
  let html = '';
  news.forEach(item => {
    const thumbContent = item.thumb 
      ? `<img src="${item.thumb}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
      : '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:var(--gradient);color:white;font-weight:bold;">DF</div>';
      
    html += `<div class="item" data-id="${item.id}">
              <div class="thumb">${thumbContent}</div>
              <div class="meta">
                <h3>${item.title}</h3>
                <p>${item.summary}</p>
                <div class="tags">
                  ${item.tags.map(tag => `<span class="tag-item">${tag}</span>`).join('')}
                </div>
                <div class="small">${item.date}</div>
                ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: none; font-weight: 600; margin-top: 8px; display: inline-block;">Read Full Article →</a>` : ''}
              </div>
              ${adminMode ? `<button class="remove-btn" onclick="removeNewsItem('${item.id}')"><i class="fas fa-times"></i></button>` : ''}
            </div>`;
  });
  
  container.innerHTML = html;
}

function renderFighterStats() {
  const container = document.getElementById('fighterStatsContainer');
  
  let html = '';
  FIGHTER_STATS.forEach(fighter => {
    html += `<div class="fighter-card">
              <div class="fighter-header">
                <div class="fighter-avatar">
                  <i class="fas fa-user"></i>
                </div>
                <div class="fighter-info">
                  <div class="fighter-name">${fighter.name}</div>
                  <div class="fighter-record">${fighter.record} | ${fighter.division} | ${fighter.country}</div>
                </div>
              </div>
              <div class="fighter-stats">
                <div class="stat-item">
                  <div class="stat-value">${fighter.stats.wins}</div>
                  <div class="stat-label">Wins</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${fighter.stats.knockouts}</div>
                  <div class="stat-label">KO/TKO</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${fighter.stats.submissions}</div>
                  <div class="stat-label">Submissions</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${fighter.stats.strikingAccuracy}%</div>
                  <div class="stat-label">Strike Acc</div>
                </div>
              </div>
            </div>`;
  });
  
  container.innerHTML = html;
}

function renderEvents(events) {
  const container = document.getElementById('eventsTable').querySelector('tbody');
  
  if (!events || events.length === 0) {
    container.innerHTML = '<tr><td colspan="2" style="text-align: center;">No upcoming events found</td></tr>';
    return;
  }
  
  let html = '';
  events.forEach(event => {
    html += `<tr>
              <td>${event.date}</td>
              <td>${event.match}</td>
            </tr>`;
  });
  
  container.innerHTML = html;
}

function renderQuickStats() {
  const container = document.getElementById('quickStatsContainer');
  
  const totalFighters = FIGHTER_STATS.length;
  const upcomingEvents = EVENTS.length;
  const totalKnockouts = FIGHTER_STATS.reduce((sum, fighter) => sum + fighter.stats.knockouts, 0);
  const newsCount = NEWS.length;
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      <div class="stat-item">
        <div class="stat-value">${totalFighters}</div>
        <div class="stat-label">Tracked Fighters</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${upcomingEvents}</div>
        <div class="stat-label">Upcoming Events</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalKnockouts}</div>
        <div class="stat-label">Total KOs</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${newsCount}</div>
        <div class="stat-label">News Articles</div>
      </div>
    </div>
  `;
}

// Video Handling Functions
function parseVideoURL(url){
  if(!url) return null;
  
  // YouTube
  const you = url.match(/(?:v=|\/v\/|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{6,})/);
  if(you){
    const id = you[1];
    const iframe = el("iframe",{
      width:"100%",
      height:"100%", 
      frameborder:"0", 
      allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", 
      allowfullscreen:"",
      style: "border: none;"
    });
    iframe.src = `https://www.youtube.com/embed/${id}`;
    return iframe;
  }
  
  // Rumble
  const rumble = url.match(/rumble\.com\/(?:v|embed)\/([A-Za-z0-9_-]+)/);
  if(rumble){
    const id = rumble[1];
    const iframe = el("iframe",{
      width:"100%",
      height:"100%", 
      frameborder:"0", 
      allowfullscreen:"",
      style: "border: none;"
    });
    iframe.src = `https://rumble.com/embed/${id}`;
    return iframe;
  }
  
  // Instagram
  const instagram = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  if(instagram){
    const id = instagram[1];
    const iframe = el("iframe",{
      width:"100%",
      height:"100%", 
      frameborder:"0", 
      allow:"autoplay; encrypted-media", 
      allowfullscreen:"",
      style: "border: none;"
    });
    iframe.src = `https://www.instagram.com/p/${id}/embed/`;
    return iframe;
  }
  
  return null;
}

function renderVideo(url, containerId){
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const videoElement = parseVideoURL(url);
  if(!videoElement){ 
    container.innerHTML = '<div class="small">Cannot parse the provided URL. Use YouTube / Rumble / Instagram links.</div>'; 
    return; 
  }
  const videoWrapper = el("div", {class: "video-container"});
  videoWrapper.appendChild(videoElement);
  container.appendChild(videoWrapper);
}

function renderLatestEpisode() {
  if (LATEST_EPISODE_URL) {
    renderVideo(LATEST_EPISODE_URL, "latestEpisodeContainer");
    document.getElementById("removeLatestEpisode").style.display = adminMode ? 'flex' : 'none';
  } else {
    document.getElementById("latestEpisodeContainer").innerHTML = 
      '<div class="small" id="latestEpisodePlaceholder">No latest episode video added yet.</div>';
    document.getElementById("removeLatestEpisode").style.display = 'none';
  }
}

function renderFeaturedVideo() {
  if (FEATURED_VIDEO_URL) {
    renderVideo(FEATURED_VIDEO_URL, "videoContainer");
    document.getElementById("removeFeaturedVideo").style.display = adminMode ? 'flex' : 'none';
  } else {
    document.getElementById("videoContainer").innerHTML = 
      '<div class="small" id="videoPlaceholder">No featured video yet — add a YouTube / Rumble / Instagram link below.</div>';
    document.getElementById("removeFeaturedVideo").style.display = 'none';
  }
}

// Store Functions
function renderProducts() {
  const container = document.getElementById('productsGrid');
  
  if (!PRODUCTS || PRODUCTS.length === 0) {
    container.innerHTML = '<div class="data-error">No products available</div>';
    return;
  }
  
  let html = '';
  PRODUCTS.forEach(product => {
    const badge = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
    
    html += `<div class="product-card" data-id="${product.id}">
              <div class="product-image">
                <i class="fas fa-${product.image === 'tshirt' ? 'tshirt' : 'hoodie'}" style="font-size: 48px;"></i>
                ${badge}
              </div>
              <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-price">
                  <span class="current-price">${product.price.toFixed(2)}</span>
                  ${product.originalPrice ? `<span class="original-price">${product.originalPrice.toFixed(2)}</span>` : ''}
                </div>
                <div class="size-selector" id="sizeSelector-${product.id}">
                  ${product.sizes.map(size => 
                    `<div class="size-option" data-size="${size}" data-product="${product.id}">${size}</div>`
                  ).join('')}
                </div>
                <button class="add-to-cart" data-product="${product.id}">
                  <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
              </div>
            </div>`;
  });
  
  container.innerHTML = html;
  
  // Add event listeners for size selection
  document.querySelectorAll('.size-option').forEach(option => {
    option.addEventListener('click', function() {
      const productId = this.getAttribute('data-product');
      const size = this.getAttribute('data-size');
      
      // Remove selected class from all options for this product
      document.querySelectorAll(`#sizeSelector-${productId} .size-option`).forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      this.classList.add('selected');
      
      // Store selected size
      selectedSizes[productId] = size;
    });
  });
  
  // Add event listeners for add to cart buttons
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
      const productId = this.getAttribute('data-product');
      addToCart(productId);
    });
  });
}

function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  // Check if size is selected for clothing items
  if (product.category === 'clothing' && (!selectedSizes[productId] || selectedSizes[productId] === '')) {
    alert('Please select a size before adding to cart');
    return;
  }
  
  // Check if item already exists in cart with same size
  const existingItemIndex = shoppingCart.findIndex(item => 
    item.id === productId && item.size === selectedSizes[productId]
  );
  
  if (existingItemIndex !== -1) {
    // Increment quantity
    shoppingCart[existingItemIndex].quantity += 1;
  } else {
    // Add new item
    shoppingCart.push({
      id: productId,
      name: product.name,
      price: product.price,
      size: selectedSizes[productId] || '',
      quantity: 1
    });
  }
  
  saveDataToStorage();
  updateCart();
  
  // Show success feedback
  const button = document.querySelector(`.add-to-cart[data-product="${productId}"]`);
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-check"></i> Added!';
  button.style.background = 'var(--accent)';
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.style.background = '';
  }, 1500);
}

function updateCart() {
  const cartItems = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  
  // Update cart count
  const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
  
  // Update cart items
  if (shoppingCart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>Your cart is empty</p>
        <p class="small">Add some merchandise to get started!</p>
      </div>
    `;
    checkoutBtn.disabled = true;
  } else {
    let html = '';
    let total = 0;
    
    shoppingCart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      
      html += `
        <div class="cart-item">
          <div class="cart-item-image">
            <i class="fas fa-${item.id === 'prod-1' ? 'tshirt' : 'hoodie'}"></i>
          </div>
          <div class="cart-item-details">
            <div class="cart-item-title">${item.name}</div>
            ${item.size ? `<div class="small">Size: ${item.size}</div>` : ''}
            <div class="cart-item-price">${item.price.toFixed(2)}</div>
          </div>
          <div class="cart-item-quantity">
            <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
            <button class="quantity-btn" onclick="removeFromCart(${index})" style="margin-left: 8px; color: var(--primary);">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });
    
    cartItems.innerHTML = html;
    cartTotal.textContent = `${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
  }
}

function updateQuantity(index, change) {
  shoppingCart[index].quantity += change;
  
  if (shoppingCart[index].quantity <= 0) {
    shoppingCart.splice(index, 1);
  }
  
  saveDataToStorage();
  updateCart();
}

function removeFromCart(index) {
  shoppingCart.splice(index, 1);
  saveDataToStorage();
  updateCart();
}

function showCartModal() {
  const modal = document.getElementById('cartModal');
  const modalContent = document.getElementById('cartModalContent');
  
  if (shoppingCart.length === 0) {
    modalContent.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>Your cart is empty</p>
        <p class="small">Add some merchandise to get started!</p>
      </div>
    `;
  } else {
    let html = '';
    let total = 0;
    
    shoppingCart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      
      html += `
        <div class="cart-item">
          <div class="cart-item-image">
            <i class="fas fa-${item.id === 'prod-1' ? 'tshirt' : 'hoodie'}"></i>
          </div>
          <div class="cart-item-details">
            <div class="cart-item-title">${item.name}</div>
            ${item.size ? `<div class="small">Size: ${item.size}</div>` : ''}
            <div class="cart-item-price">${item.price.toFixed(2)}</div>
          </div>
          <div class="cart-item-quantity">
            <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
          </div>
        </div>
      `;
    });
    
    html += `
      <div class="cart-total">
        <span>Total:</span>
        <span>${total.toFixed(2)}</span>
      </div>
      <button class="checkout-btn" onclick="proceedToCheckout()">
        <i class="fas fa-lock"></i> Proceed to Checkout
      </button>
    `;
    
    modalContent.innerHTML = html;
  }
  
  modal.classList.add('active');
}

function proceedToCheckout() {
  // In a real implementation, this would redirect to a payment processor
  alert('Checkout functionality would be implemented here. This is a demo.');
}

function scrollToShop() {
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
}

// Image Upload Functions
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.match('image.*')) {
    alert('Please select an image file (JPEG, PNG, etc.)');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    // Show preview immediately
    const preview = document.getElementById('imagePreview');
    preview.src = e.target.result;
    preview.style.display = 'block';
    
    // Store the image data for later use
    croppedImageDataUrl = e.target.result;
    
    // Update upload container text
    const uploadContainer = document.getElementById('imageUploadContainer');
    uploadContainer.querySelector('p').textContent = 'Image ready! Click "Add News" to use it.';
  };
  
  reader.readAsDataURL(file);
}

function setupImageUpload() {
  const uploadContainer = document.getElementById('imageUploadContainer');
  const fileInput = document.getElementById('newsImage');
  
  // Click to upload
  uploadContainer.addEventListener('click', function() {
    fileInput.click();
  });
  
  // File input change
  fileInput.addEventListener('change', handleImageUpload);
  
  // Drag and drop functionality
  uploadContainer.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadContainer.style.borderColor = 'var(--primary)';
    uploadContainer.style.background = 'rgba(198,40,40,0.1)';
  });
  
  uploadContainer.addEventListener('dragleave', function() {
    uploadContainer.style.borderColor = '#ddd';
    uploadContainer.style.background = '';
  });
  
  uploadContainer.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadContainer.style.borderColor = '#ddd';
    uploadContainer.style.background = '';
    
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleImageUpload({ target: fileInput });
    }
  });
}

// Data Modification Functions (with auto-save)
function addNewsItem(title, summary, date, tags, thumb) {
  const newItem = {
    id: "n" + Date.now(), 
    title, 
    summary, 
    date: date || new Date().toISOString().split('T')[0], 
    tags: tags,
    thumb: thumb || ""
  };
  
  NEWS.unshift(newItem);
  saveDataToStorage();
  renderNews(NEWS);
  return newItem;
}

function removeNewsItem(id) {
  NEWS = NEWS.filter(item => item.id !== id);
  saveDataToStorage();
  renderNews(NEWS);
}

function addEvent(date, match) {
  const newEvent = {
    id: "ev" + Date.now(), 
    date, 
    match
  };
  
  EVENTS.unshift(newEvent);
  saveDataToStorage();
  renderEvents(EVENTS);
  return newEvent;
}

function setFeaturedVideo(url) {
  FEATURED_VIDEO_URL = url;
  saveDataToStorage();
  renderFeaturedVideo();
}

function removeFeaturedVideo() {
  FEATURED_VIDEO_URL = "";
  saveDataToStorage();
  renderFeaturedVideo();
}

function setLatestEpisode(url) {
  LATEST_EPISODE_URL = url;
  saveDataToStorage();
  renderLatestEpisode();
}

function removeLatestEpisode() {
  LATEST_EPISODE_URL = "";
  saveDataToStorage();
  renderLatestEpisode();
}

// Data Loading Functions
async function loadAllData() {
  try {
    document.querySelectorAll('.loading').forEach(el => {
      el.style.display = 'flex';
    });
    
    loadDataFromStorage();
    
    // Check if headlines need refresh
    const shouldRefreshHeadlines = checkHeadlinesFreshness();
    
    // Initialize breaking news FIRST - this is crucial
    if (shouldRefreshHeadlines) {
      await initBreakingNews();
    } else {
      // Use cached headlines if available
      console.log('Using cached headlines');
      const cachedHeadlines = localStorage.getItem('dosfronteras_headlines');
      if (cachedHeadlines) {
        try {
          HEADLINES = JSON.parse(cachedHeadlines);
          renderBreakingNews(HEADLINES);
        } catch (e) {
          console.error('Error parsing cached headlines:', e);
          await initBreakingNews();
        }
      } else {
        await initBreakingNews();
      }
    }
    
    // Start auto-refresh for headlines
    startHeadlinesAutoRefresh();
    
    // Load real news if we don't have any or data is stale
    if (NEWS.length === 0) {
      const realNews = await fetchRealNews();
      if (realNews.length > 0) {
        NEWS = realNews;
        saveDataToStorage();
      } else {
        // Fallback to sample data
        NEWS = [
          {
            id: 'news-1',
            title: 'Breaking: Major UFC Fight Announced',
            summary: 'A championship bout has been confirmed for the upcoming pay-per-view event.',
            date: '2025-10-28',
            tags: ['UFC', 'Breaking'],
            thumb: ''
          }
        ];
        saveDataToStorage();
      }
    }
    
    lastUpdateTime = new Date();
    document.getElementById('lastUpdated').textContent = lastUpdateTime.toLocaleString();
    
    renderNews(NEWS);
    renderFighterStats();
    renderEvents(EVENTS);
    renderQuickStats();
    renderLatestEpisode();
    renderFeaturedVideo();
    renderProducts();
    updateCart();
    
    document.querySelectorAll('.loading').forEach(el => {
      el.style.display = 'none';
    });
    
  } catch (error) {
    console.error('Error loading data:', error);
    document.querySelectorAll('.loading').forEach(el => {
      el.innerHTML = '<div class="data-error">Error loading data. <button class="refresh-btn" onclick="loadAllData()"><i class="fas fa-sync-alt"></i> Retry</button></div>';
    });
  }
}

// Admin Functionality
function toggleAdminMode() {
  adminMode = !adminMode;
  const adminToggle = document.getElementById('adminToggle');
  adminToggle.textContent = `Admin Mode: ${adminMode ? 'ON' : 'OFF'}`;
  
  document.querySelectorAll('.admin-tools').forEach(tool => {
    tool.style.display = adminMode ? 'block' : 'none';
  });
  
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.style.display = adminMode ? 'flex' : 'none';
  });
  
  renderNews(NEWS);
  renderLatestEpisode();
  renderFeaturedVideo();
}

// UI Binding
function bindUI(){
  document.getElementById("year").textContent = new Date().getFullYear();

  document.getElementById('adminToggle').addEventListener('click', toggleAdminMode);

  document.getElementById("addEventBtn").addEventListener("click", ()=> {
    const d = document.getElementById("evDate").value.trim();
    const m = document.getElementById("evMatch").value.trim();
    if(!d || !m) return alert("Please provide both date and match");
    addEvent(d, m);
    document.getElementById("evDate").value = "";
    document.getElementById("evMatch").value = "";
  });

  document.getElementById("addVideoBtn").addEventListener("click", ()=> {
    const v = document.getElementById("videoUrl").value.trim();
    if(!v) return alert("Paste a video URL first");
    setFeaturedVideo(v);
    document.getElementById("videoUrl").value = "";
  });

  document.getElementById("addLatestEpisodeBtn").addEventListener("click", ()=> {
    const v = document.getElementById("latestEpisodeUrl").value.trim();
    if(!v) return alert("Paste a video URL first");
    setLatestEpisode(v);
    document.getElementById("latestEpisodeUrl").value = "";
  });

  document.getElementById("removeFeaturedVideo").addEventListener('click', removeFeaturedVideo);
  document.getElementById("removeLatestEpisode").addEventListener('click', removeLatestEpisode);

  document.getElementById("addNewsBtn").addEventListener("click", ()=> {
    const title = document.getElementById("newsTitle").value.trim();
    const summary = document.getElementById("newsSummary").value.trim();
    const date = document.getElementById("newsDate").value.trim();
    const tags = document.getElementById("newsTags").value.trim();
    if(!title) return alert("News needs a title");
    
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    addNewsItem(title, summary, date, tagsArray, croppedImageDataUrl || "");
    
    // Reset form
    document.getElementById("newsTitle").value = "";
    document.getElementById("newsSummary").value = "";
    document.getElementById("newsDate").value = "";
    document.getElementById("newsTags").value = "";
    
    // Reset image upload
    const uploadContainer = document.getElementById('imageUploadContainer');
    uploadContainer.innerHTML = `
      <i class="fas fa-cloud-upload-alt"></i>
      <p>Drop an image here or click to upload</p>
      <input type="file" id="newsImage" accept="image/*" />
      <img id="imagePreview" class="image-preview" alt="Image preview">
    `;
    setupImageUpload();
    croppedImageDataUrl = null;
  });

  // Cart functionality
  document.getElementById('cartIcon').addEventListener('click', function(e) {
    e.preventDefault();
    showCartModal();
  });
  
  document.getElementById('closeCart').addEventListener('click', function() {
    document.getElementById('cartModal').classList.remove('active');
  });
  
  document.getElementById('checkoutBtn').addEventListener('click', proceedToCheckout);

  // Refresh stats button
  document.getElementById('refreshStats').addEventListener('click', function() {
    refreshAllData();
  });

  // Setup image upload
  setupImageUpload();

  // Initial load
  loadAllData();
}

// Initialize
document.addEventListener("DOMContentLoaded", bindUI);
