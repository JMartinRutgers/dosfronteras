// Data Storage
let cart = [];
let adminMode = false;
let newsItems = [];
let events = [];
let featuredVideoUrl = null;
let latestEpisodeUrl = null;

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  loadSampleData();
  setupEventListeners();
  updateLastUpdated();
});

function initializeApp() {
  document.getElementById('year').textContent = new Date().getFullYear();
  renderProducts();
  renderFighterStats();
  renderQuickStats();
  renderBreakingNews();
  renderEvents();
  setupThemeToggle();
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
  const icon = document.querySelector('#themeToggle i');
  if (theme === 'dark') {
    icon.className = 'fas fa-moon';
  } else {
    icon.className = 'fas fa-sun';
  }
}

function loadSampleData() {
  // Sample news
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

  events = [
    { date: '2024-12-15', match: 'Martinez vs Johnson' },
    { date: '2024-12-22', match: 'Rodriguez vs Davis' },
    { date: '2025-01-05', match: 'Garcia vs Thompson' }
  ];

  renderNews();
  renderEvents();
}

function setupEventListeners() {
  // Admin toggle
  document.getElementById('adminToggle').addEventListener('click', toggleAdminMode);

  // Cart
  document.getElementById('cartIcon').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Cart: ' + cart.length + ' items');
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
  const items = document.getElementById('cartItems');
  const total = document.getElementById('cartTotal');
  const checkout = document.getElementById('checkoutBtn');

  count.textContent = cart.length;

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

  container.innerHTML = newsItems.map(news => `
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
    </div>
  `).join('');
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
    }
  }
}

function removeFeaturedVideo() {
  featuredVideoUrl = null;
  renderFeaturedVideo();
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
    }
  }
}

function removeLatestEpisode() {
  latestEpisodeUrl = null;
  renderLatestEpisode();
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
  }
}

// Breaking News
function renderBreakingNews() {
  const list = document.getElementById('breakingNewsList');
  const headlines = [
    'Championship bout confirmed for January',
    'Top contender injured, replacement announced',
    'New weight class added to promotion',
    'Record-breaking PPV sales reported',
    'International event series expansion planned'
  ];
  
  list.innerHTML = headlines.map(h => `<li>${h}</li>`).join('');
}

function refreshBreakingNews() {
  const list = document.getElementById('breakingNewsList');
  list.innerHTML = '<li>Refreshing...</li>';
  setTimeout(renderBreakingNews, 1000);
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
