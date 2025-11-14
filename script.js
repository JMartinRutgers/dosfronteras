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



// Initialize
document.addEventListener("DOMContentLoaded", bindUI);
