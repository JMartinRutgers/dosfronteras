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

// Headline Data - Simulated scraping from ESPN, UFC, and Bellator
const HEADLINES = [
  {
    source: "ESPN",
    text: "UFC 302: Makhachev vs Poirier set for June 1st in Newark",
    url: "https://www.espn.com/mma/story/_/id/40123456/ufc-302-makhachev-poirier-set-june-1-newark"
  },
  {
    source: "UFC",
    text: "Strickland defeats Costa in lackluster main event",
    url: "https://www.ufc.com/news/strickland-defeats-costa-lackluster-main-event"
  },
  {
    source: "Bellator",
    text: "Pitbull defends title against mixed rules challenge",
    url: "https://www.bellator.com/news/pitbull-defends-title-against-mixed-rules-challenge"
  },
  {
    source: "ESPN",
    text: "Ngannou announces boxing match with Joshua for March",
    url: "https://www.espn.com/boxing/story/_/id/40124567/francis-ngannou-anthony-joshua-fight-march"
  },
  {
    source: "UFC",
    text: "O'Malley vs Vera 2 official for UFC 299 in Miami",
    url: "https://www.ufc.com/news/omalley-vs-vera-2-official-ufc-299-miami"
  }
];

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

// Initialize Breaking News
function initBreakingNews() {
  const breakingNewsList = document.getElementById('breakingNewsList');
  
  HEADLINES.forEach(headline => {
    const listItem = document.createElement('li');
    listItem.className = 'headline-item';
    
    const sourceSpan = document.createElement('span');
    sourceSpan.className = `headline-source source-${headline.source.toLowerCase()}`;
    sourceSpan.textContent = headline.source;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'headline-text';
    
    const link = document.createElement('a');
    link.className = 'headline-link';
    link.href = headline.url;
    link.textContent = headline.text;
    link.target = '_blank'; // Open in new tab
    link.rel = 'noopener noreferrer';
    
    textDiv.appendChild(link);
    listItem.appendChild(sourceSpan);
    listItem.appendChild(textDiv);
    breakingNewsList.appendChild(listItem);
  });
}

// Data Persistence Functions
function saveDataToStorage() {
  try {
    localStorage.setItem('dosfronteras_news', JSON.stringify(NEWS));
    localStorage.setItem('dosfronteras_events', JSON.stringify(EVENTS));
    localStorage.setItem('dosfronteras_featured_video', FEATURED_VIDEO_URL);
    localStorage.setItem('dosfronteras_latest_episode', LATEST_EPISODE_URL);
    localStorage.setItem('dosfronteras_cart', JSON.stringify(shoppingCart));
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
    
    if (savedNews) NEWS = JSON.parse(savedNews);
    if (savedEvents) EVENTS = JSON.parse(savedEvents);
    if (savedFeaturedVideo) FEATURED_VIDEO_URL = savedFeaturedVideo;
    if (savedLatestEpisode) LATEST_EPISODE_URL = savedLatestEpisode;
    if (savedCart) shoppingCart = JSON.parse(savedCart);
    
    console.log('Data loaded from localStorage');
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }
}

// Rendering Functions
function renderNews(news) {
  const container = document.getElementById('newsContainer');
  
  if (!news || news.length === 0) {
    container.innerHTML = '<div class="data-error">No news available</div>';
    return;
  }
  
  let html = '';
  news.forEach(item => {
    const thumbContent = item.thumb 
      ? `<img src="${item.thumb}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;">`
      : '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">NEWS</div>';
      
    html += `<div class="item" data-id="${item.id}">
              <div class="thumb">${thumbContent}</div>
              <div class="meta">
                <h3>${item.title}</h3>
                <p>${item.summary}</p>
                <div class="tags">
                  ${item.tags.map(tag => `<span class="tag-item">${tag}</span>`).join('')}
                </div>
                <div class="small">${item.date}</div>
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
        <div class="stat-value">24h</div>
        <div class="stat-label">Data Freshness</div>
      </div>
    </div>
  `;
}

// Video Handling Functions - FIXED FOR MOBILE
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
  } else {
    document.getElementById("latestEpisodeContainer").innerHTML = 
      '<div class="small" id="latestEpisodePlaceholder">No latest episode video added yet.</div>';
  }
}

function renderFeaturedVideo() {
  if (FEATURED_VIDEO_URL) {
    renderVideo(FEATURED_VIDEO_URL, "videoContainer");
  } else {
    document.getElementById("videoContainer").innerHTML = 
      '<div class="small" id="videoPlaceholder">No featured video yet — add a YouTube / Rumble / Instagram link below.</div>';
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
                  <span class="current-price">$${product.price.toFixed(2)}</span>
                  ${product.originalPrice ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
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
            <div class="cart-item-price">$${item.price.toFixed(2)}</div>
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
    cartTotal.textContent = `$${total.toFixed(2)}`;
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
            <div class="cart-item-price">$${item.price.toFixed(2)}</div>
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
        <span>$${total.toFixed(2)}</span>
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

// Image Upload Functions - FIXED FOR MOBILE
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
    
    if (NEWS.length === 0) {
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
    
  } catch (error) {
    console.error('Error loading data:', error);
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
}

// UI Binding
function bindUI(){
  document.getElementById("year").textContent = new Date().getFullYear();

  // Initialize breaking news
  initBreakingNews();

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

  // Setup image upload
  setupImageUpload();

  // Initial load
  loadAllData();
}

// ========================================
// GLOBAL STATE
// ========================================
let adminMode = false;
let cart = [];
let products = [];
let newsItems = [];
let events = [];
let featuredVideoUrl = '';
let latestEpisodeUrl = '';
let croppedImageData = null;

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  loadAllData();
});

function initializeApp() {
  // Set current year
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Prevent zoom on double tap for iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
  
  // Initialize products
  products = [
    { id: 1, name: 'Dos Fronteras T-Shirt', price: 29.99, icon: 'fa-tshirt', description: 'Premium cotton tee with logo' },
    { id: 2, name: 'DF Hoodie', price: 49.99, icon: 'fa-vest', description: 'Comfortable pullover hoodie' },
    { id: 3, name: 'DF Cap', price: 24.99, icon: 'fa-hat-cowboy', description: 'Adjustable snapback cap' },
    { id: 4, name: 'DF Mug', price: 14.99, icon: 'fa-mug-hot', description: 'Ceramic 11oz coffee mug' },
    { id: 5, name: 'DF Sticker Pack', price: 9.99, icon: 'fa-stamp', description: '5 premium vinyl stickers' },
    { id: 6, name: 'DF Poster', price: 19.99, icon: 'fa-image', description: '18x24 glossy poster' }
  ];
  
  renderProducts();
  
  // Load from localStorage
  loadCartFromStorage();
  updateCartDisplay();
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
  // Admin toggle
  document.getElementById('adminToggle').addEventListener('click', toggleAdminMode);
  
  // News
  document.getElementById('addNewsBtn')?.addEventListener('click', addNews);
  document.getElementById('newsImage')?.addEventListener('change', handleImageUpload);
  setupImageUploadDragDrop();
  
  // Video
  document.getElementById('addVideoBtn')?.addEventListener('click', addFeaturedVideo);
  document.getElementById('removeFeaturedVideo')?.addEventListener('click', removeFeaturedVideo);
  
  // Latest Episode
  document.getElementById('addLatestEpisodeBtn')?.addEventListener('click', addLatestEpisode);
  document.getElementById('removeLatestEpisode')?.addEventListener('click', removeLatestEpisode);
  
  // Events
  document.getElementById('addEventBtn')?.addEventListener('click', addEvent);
  
  // Stats refresh
  document.getElementById('refreshStats')?.addEventListener('click', loadFighterStats);
  
  // Cart
  document.getElementById('cartIcon')?.addEventListener('click', toggleCartModal);
  document.getElementById('closeCart')?.addEventListener('click', closeCartModal);
  document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
  
  // Cart modal - close on backdrop click
  document.getElementById('cartModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'cartModal') {
      closeCartModal();
    }
  });
  
  // Crop modal
  document.getElementById('cropCancel')?.addEventListener('click', closeCropModal);
  document.getElementById('cropConfirm')?.addEventListener('click', confirmCrop);
  
  // Touch event handling for iOS
  document.addEventListener('touchmove', (e) => {
    // Allow scrolling within modals
    if (e.target.closest('.cart-modal-content') || e.target.closest('.crop-container')) {
      return;
    }
  }, { passive: true });
}

// ========================================
// ADMIN MODE
// ========================================
function toggleAdminMode() {
  adminMode = !adminMode;
  document.body.classList.toggle('admin-mode', adminMode);
  const btn = document.getElementById('adminToggle');
  btn.textContent = adminMode ? 'Admin Mode: ON' : 'Admin Mode: OFF';
  btn.style.background = adminMode ? 'rgba(42, 157, 143, 0.9)' : 'rgba(230, 57, 70, 0.9)';
}

// ========================================
// NEWS MANAGEMENT
// ========================================
function setupImageUploadDragDrop() {
  const container = document.getElementById('imageUploadContainer');
  if (!container) return;
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    container.addEventListener(eventName, preventDefaults, false);
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    container.addEventListener(eventName, () => container.classList.add('dragover'), false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    container.addEventListener(eventName, () => container.classList.remove('dragover'), false);
  });
  
  container.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files.length > 0) {
    handleImageFile(files[0]);
  }
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    handleImageFile(file);
  }
}

function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    showCropModal(e.target.result);
  };
  reader.readAsDataURL(file);
}

function showCropModal(imageData) {
  const modal = document.getElementById('cropModal');
  const img = document.getElementById('cropImage');
  img.src = imageData;
  croppedImageData = imageData;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCropModal() {
  const modal = document.getElementById('cropModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  croppedImageData = null;
}

function confirmCrop() {
  if (croppedImageData) {
    const preview = document.getElementById('imagePreview');
    preview.src = croppedImageData;
    preview.classList.add('active');
    closeCropModal();
  }
}

function addNews() {
  const title = document.getElementById('newsTitle').value.trim();
  const summary = document.getElementById('newsSummary').value.trim();
  const date = document.getElementById('newsDate').value.trim();
  const tags = document.getElementById('newsTags').value.trim();
  const imagePreview = document.getElementById('imagePreview');
  const imageUrl = imagePreview.classList.contains('active') ? imagePreview.src : null;
  
  if (!title || !summary || !date) {
    alert('Please fill in title, summary, and date');
    return;
  }
  
  const newsItem = {
    id: Date.now(),
    title,
    summary,
    date,
    tags: tags.split(',').map(t => t.trim()).filter(t => t),
    imageUrl
  };
  
  newsItems.unshift(newsItem);
  saveNewsToStorage();
  renderNews();
  
  // Clear form
  document.getElementById('newsTitle').value = '';
  document.getElementById('newsSummary').value = '';
  document.getElementById('newsDate').value = '';
  document.getElementById('newsTags').value = '';
  imagePreview.src = '';
  imagePreview.classList.remove('active');
  
  showToast('News item added successfully!');
}

function deleteNews(id) {
  if (confirm('Delete this news item?')) {
    newsItems = newsItems.filter(item => item.id !== id);
    saveNewsToStorage();
    renderNews();
    showToast('News item deleted');
  }
}

function renderNews() {
  const container = document.getElementById('newsContainer');
  
  if (newsItems.length === 0) {
    container.innerHTML = '<div class="loading">No news items yet. Add one using admin mode!</div>';
    return;
  }
  
  container.innerHTML = newsItems.map(item => `
    <div class="news-item">
      ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" class="news-thumb">` : ''}
      <div class="news-content">
        <h4>${item.title}</h4>
        <p>${item.summary}</p>
        <div class="news-meta">
          <span>${item.date}</span>
          ${item.tags.map(tag => `<span class="news-tag">${tag}</span>`).join('')}
        </div>
        ${adminMode ? `<button onclick="deleteNews(${item.id})" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border-radius: 4px; font-size: 0.875rem;">Delete</button>` : ''}
      </div>
    </div>
  `).join('');
}

// ========================================
// VIDEO MANAGEMENT
// ========================================
function getEmbedUrl(url) {
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('youtu.be') 
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : new URLSearchParams(new URL(url).search).get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }
  
  // Rumble
  if (url.includes('rumble.com')) {
    const videoId = url.split('/')[url.split('/').length - 1].split('-')[0];
    return `https://rumble.com/embed/${videoId}/`;
  }
  
  // TikTok
  if (url.includes('tiktok.com')) {
    const videoId = url.split('/video/')[1]?.split('?')[0];
    return videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : null;
  }
  
  // Instagram
  if (url.includes('instagram.com')) {
    return `${url}embed/`;
  }
  
  return null;
}

function addFeaturedVideo() {
  const url = document.getElementById('videoUrl').value.trim();
  if (!url) {
    alert('Please enter a video URL');
    return;
  }
  
  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) {
    alert('Invalid video URL. Please use YouTube, Rumble, TikTok, or Instagram');
    return;
  }
  
  featuredVideoUrl = embedUrl;
  saveFeaturedVideoToStorage();
  renderFeaturedVideo();
  document.getElementById('videoUrl').value = '';
  showToast('Featured video added!');
}

function removeFeaturedVideo() {
  if (confirm('Remove featured video?')) {
    featuredVideoUrl = '';
    saveFeaturedVideoToStorage();
    renderFeaturedVideo();
    showToast('Featured video removed');
  }
}

function renderFeaturedVideo() {
  const container = document.getElementById('videoContainer');
  const placeholder = document.getElementById('videoPlaceholder');
  const removeBtn = document.getElementById('removeFeaturedVideo');
  
  if (featuredVideoUrl) {
    container.innerHTML = `
      <div class="video-wrapper">
        <iframe src="${featuredVideoUrl}" allowfullscreen></iframe>
      </div>
    `;
    placeholder.style.display = 'none';
    if (adminMode) removeBtn.style.display = 'flex';
  } else {
    container.innerHTML = '';
    placeholder.style.display = 'block';
    removeBtn.style.display = 'none';
  }
}

function addLatestEpisode() {
  const url = document.getElementById('latestEpisodeUrl').value.trim();
  if (!url) {
    alert('Please enter a video URL');
    return;
  }
  
  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) {
    alert('Invalid video URL. Please use YouTube, Rumble, TikTok, or Instagram');
    return;
  }
  
  latestEpisodeUrl = embedUrl;
  saveLatestEpisodeToStorage();
  renderLatestEpisode();
  document.getElementById('latestEpisodeUrl').value = '';
  showToast('Latest episode added!');
}

function removeLatestEpisode() {
  if (confirm('Remove latest episode?')) {
    latestEpisodeUrl = '';
    saveLatestEpisodeToStorage();
    renderLatestEpisode();
    showToast('Latest episode removed');
  }
}

function renderLatestEpisode() {
  const container = document.getElementById('latestEpisodeContainer');
  const placeholder = document.getElementById('latestEpisodePlaceholder');
  const removeBtn = document.getElementById('removeLatestEpisode');
  
  if (latestEpisodeUrl) {
    container.innerHTML = `
      <div class="video-wrapper">
        <iframe src="${latestEpisodeUrl}" allowfullscreen></iframe>
      </div>
    `;
    placeholder.style.display = 'none';
    if (adminMode) removeBtn.style.display = 'flex';
  } else {
    container.innerHTML = '';
    placeholder.style.display = 'block';
    removeBtn.style.display = 'none';
  }
}

// ========================================
// EVENTS MANAGEMENT
// ========================================
function addEvent() {
  const date = document.getElementById('evDate').value.trim();
  const match = document.getElementById('evMatch').value.trim();
  
  if (!date || !match) {
    alert('Please fill in both date and match');
    return;
  }
  
  events.push({ id: Date.now(), date, match });
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveEventsToStorage();
  renderEvents();
  
  document.getElementById('evDate').value = '';
  document.getElementById('evMatch').value = '';
  showToast('Event added!');
}

function deleteEvent(id) {
  if (confirm('Delete this event?')) {
    events = events.filter(e => e.id !== id);
    saveEventsToStorage();
    renderEvents();
    showToast('Event deleted');
  }
}

function renderEvents() {
  const tbody = document.querySelector('#eventsTable tbody');
  
  if (events.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No upcoming events</td></tr>';
    return;
  }
  
  tbody.innerHTML = events.map(event => `
    <tr>
      <td>${event.date}</td>
      <td>
        ${event.match}
        ${adminMode ? `<button onclick="deleteEvent(${event.id})" style="margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: var(--primary); color: white; border-radius: 4px; font-size: 0.75rem;">Delete</button>` : ''}
      </td>
    </tr>
  `).join('');
}

// ========================================
// FIGHTER STATS
// ========================================
async function loadFighterStats() {
  const container = document.getElementById('fighterStatsContainer');
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading fighter statistics...</div>';
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const fighters = [
    { name: 'Alexa Grasso', record: '16-3-1', country: 'Mexico', rank: '#1 Women\'s Flyweight' },
    { name: 'Brandon Moreno', record: '21-7-2', country: 'Mexico', rank: '#2 Flyweight' },
    { name: 'Yair Rodriguez', record: '15-4', country: 'Mexico', rank: '#5 Featherweight' },
    { name: 'Irene Aldana', record: '15-7', country: 'Mexico', rank: '#4 Women\'s Bantamweight' },
    { name: 'Tracy Cortez', record: '11-1', country: 'USA', rank: '#8 Women\'s Flyweight' }
  ];
  
  container.innerHTML = fighters.map(fighter => `
    <div class="fighter-row">
      <div class="fighter-info">
        <div class="fighter-name">${fighter.name}</div>
        <div class="fighter-record">${fighter.record}</div>
      </div>
      <div class="fighter-badges">
        <span class="badge badge-country">${fighter.country}</span>
        <span class="badge badge-rank">${fighter.rank}</span>
      </div>
    </div>
  `).join('');
  
  updateLastUpdated();
}

// ========================================
// QUICK STATS
// ========================================
async function loadQuickStats() {
  const container = document.getElementById('quickStatsContainer');
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading stats...</div>';
  
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const stats = [
    { label: 'Active Fighters', value: '127' },
    { label: 'Events This Month', value: '8' },
    { label: 'Articles Published', value: '342' },
    { label: 'Videos Released', value: '89' }
  ];
  
  container.innerHTML = stats.map(stat => `
    <div class="stat-item">
      <span class="stat-label">${stat.label}</span>
      <span class="stat-value">${stat.value}</span>
    </div>
  `).join('');
}

// ========================================
// BREAKING NEWS
// ========================================
async function refreshBreakingNews() {
  const list = document.getElementById('breakingNewsList');
  list.innerHTML = '<li style="color: var(--text-muted);">Loading...</li>';
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const headlines = [
    { text: 'Grasso vs. Shevchenko trilogy confirmed for UFC 310', url: '#news' },
    { text: 'Moreno returns to training after injury recovery', url: '#news' },
    { text: 'Rodriguez scheduled for main event in Mexico City', url: '#news' },
    { text: 'New lightweight prospect signs with UFC', url: '#news' },
    { text: 'Exclusive interview: Rising star discusses future plans', url: '#news' }
  ];
  
  list.innerHTML = headlines.map(h => `
    <li><a href="${h.url}">${h.text}</a></li>
  `).join('');
}

// ========================================
// PRODUCTS & CART
// ========================================
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = products.map(product => `
    <div class="product-card">
      <div class="product-image">
        <i class="fas ${product.icon}"></i>
      </div>
      <div class="product-info">
        <div class="product-title">${product.name}</div>
        <div class="product-description">${product.description}</div>
        <div class="product-price">
          <span class="current-price">$${product.price.toFixed(2)}</span>
        </div>
        <button class="add-to-cart" onclick="addToCart(${product.id})">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  
  saveCartToStorage();
  updateCartDisplay();
  showToast(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCartToStorage();
  updateCartDisplay();
}

function updateQuantity(productId, change) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;
  
  item.quantity += change;
  
  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    saveCartToStorage();
    updateCartDisplay();
  }
}

function updateCartDisplay() {
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const cartModalContent = document.getElementById('cartModalContent');
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  cartCount.textContent = totalItems;
  cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
  
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>Your cart is empty</p>
        <p class="small">Add some merchandise to get started!</p>
      </div>
    `;
    checkoutBtn.disabled = true;
    
    if (cartModalContent) {
      cartModalContent.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
          <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
          <p>Your cart is empty</p>
        </div>
      `;
    }
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">
          <i class="fas ${item.icon}"></i>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        </div>
        <div class="cart-item-actions">
          <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
        </div>
      </div>
    `).join('');
    checkoutBtn.disabled = false;
    
    if (cartModalContent) {
      cartModalContent.innerHTML = `
        <div style="padding: 1.5rem;">
          ${cart.map(item => `
            <div class="cart-item">
              <div class="cart-item-image">
                <i class="fas ${item.icon}"></i>
              </div>
              <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
              </div>
              <div class="cart-item-actions">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
              </div>
            </div>
          `).join('')}
          <div class="cart-total" style="margin-top: 1.5rem;">
            <span>Total:</span>
            <span>$${totalPrice.toFixed(2)}</span>
          </div>
          <button class="checkout-btn" onclick="checkout()" style="margin-top: 1rem;">
            <i class="fas fa-lock"></i> Proceed to Checkout
          </button>
        </div>
      `;
    }
  }
}

function toggleCartModal() {
  const modal = document.getElementById('cartModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartModal() {
  const modal = document.getElementById('cartModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function checkout() {
  if (cart.length === 0) return;
  
  alert('Checkout functionality would integrate with a payment processor like Stripe or PayPal. Total: $' + cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
}

// ========================================
// STORAGE
// ========================================
function saveCartToStorage() {
  localStorage.setItem('df_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem('df_cart');
  if (saved) {
    cart = JSON.parse(saved);
  }
}

function saveNewsToStorage() {
  localStorage.setItem('df_news', JSON.stringify(newsItems));
}

function loadNewsFromStorage() {
  const saved = localStorage.getItem('df_news');
  if (saved) {
    newsItems = JSON.parse(saved);
  }
}

function saveEventsToStorage() {
  localStorage.setItem('df_events', JSON.stringify(events));
}

function loadEventsFromStorage() {
  const saved = localStorage.getItem('df_events');
  if (saved) {
    events = JSON.parse(saved);
  }
}

function saveFeaturedVideoToStorage() {
  localStorage.setItem('df_featured_video', featuredVideoUrl);
}

function loadFeaturedVideoFromStorage() {
  const saved = localStorage.getItem('df_featured_video');
  if (saved) {
    featuredVideoUrl = saved;
  }
}

function saveLatestEpisodeToStorage() {
  localStorage.setItem('df_latest_episode', latestEpisodeUrl);
}

function loadLatestEpisodeFromStorage() {
  const saved = localStorage.getItem('df_latest_episode');
  if (saved) {
    latestEpisodeUrl = saved;
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function updateLastUpdated() {
  const element = document.getElementById('lastUpdated');
  const now = new Date();
  element.textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
}

function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 5rem;
    right: 1rem;
    background: var(--success);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px var(--shadow);
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
    max-width: calc(100vw - 2rem);
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function scrollToShop() {
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
}

// ========================================
// LOAD ALL DATA
// ========================================
async function loadAllData() {
  loadNewsFromStorage();
  loadEventsFromStorage();
  loadFeaturedVideoFromStorage();
  loadLatestEpisodeFromStorage();
  
  renderNews();
  renderEvents();
  renderFeaturedVideo();
  renderLatestEpisode();
  
  await Promise.all([
    loadFighterStats(),
    loadQuickStats(),
    refreshBreakingNews()
  ]);
  
  updateLastUpdated();
  updateDonateCount();
}

function updateDonateCount() {
  const count = document.getElementById('donateCount');
  // This would be connected to actual donation tracking
  count.textContent = '$2,450 raised';
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);


// Initialize
document.addEventListener("DOMContentLoaded", bindUI);

