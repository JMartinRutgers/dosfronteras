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
    else if(k === "style") node.style.cssText = v;
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
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    textDiv.appendChild(link);
    listItem.appendChild(sourceSpan);
    listItem.appendChild(textDiv);
    breakingNewsList.appendChild(listItem);
  });
}

function refreshBreakingNews() {
  // In a real app, this would fetch new headlines
  alert('Breaking news refreshed! (In production, this would fetch latest headlines from API)');
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

// FIXED: Video URL Parsing for iPhone
function parseVideoURL(url){
  if(!url) return null;
  
  // Clean and trim the URL
  url = url.trim();
  
  // YouTube - more flexible matching for various formats
  let youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if(youtubeMatch){
    const id = youtubeMatch[1];
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', `https://www.youtube.com/embed/${id}?playsinline=1`);
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '100%');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    iframe.style.border = 'none';
    iframe.style.maxWidth = '100%';
    return iframe;
  }
  
  // Rumble - improved matching
  const rumbleMatch = url.match(/rumble\.com\/(?:embed\/|v\/)?([a-z0-9]+)/i);
  if(rumbleMatch){
    const id = rumbleMatch[1];
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', `https://rumble.com/embed/${id}/`);
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '100%');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    iframe.style.border = 'none';
    iframe.style.maxWidth = '100%';
    return iframe;
  }
  
  // Instagram - improved matching
  const instagramMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-z0-9_-]+)/i);
  if(instagramMatch){
    const id = instagramMatch[1];
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', `https://www.instagram.com/p/${id}/embed/captioned/`);
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '100%');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('allow', 'encrypted-media');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    iframe.style.border = 'none';
    iframe.style.maxWidth = '100%';
    return iframe;
  }
  
  // TikTok - improved matching
  const tiktokMatch = url.match(/tiktok\.com\/(?:@[\w.]+\/video\/|embed\/v2\/)?(\d+)/i);
  if(tiktokMatch){
    const id = tiktokMatch[1];
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', `https://www.tiktok.com/embed/v2/${id}`);
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '100%');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'encrypted-media');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    iframe.style.border = 'none';
    iframe.style.maxWidth = '100%';
    return iframe;
  }
  
  return null;
}

// FIXED: Video Rendering for iPhone
function renderVideo(url, containerId){
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Container not found:', containerId);
    return;
  }
  
  container.innerHTML = "";
  
  if (!url) {
    container.innerHTML = '<div class="small" style="color: #888; padding: 12px; text-align: center;">No video URL provided.</div>';
    return;
  }
  
  // Add loading indicator
  container.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Loading video...</div>';
  
  // Use setTimeout to allow UI to update before parsing
  setTimeout(() => {
    const videoElement = parseVideoURL(url);
    if(!videoElement){ 
      container.innerHTML = '<div class="small" style="color: #d63031; padding: 12px; text-align: center;">Cannot parse the provided URL. Use YouTube, Rumble, Instagram, or TikTok links.</div>'; 
      return;
    }
    
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-container';
    videoWrapper.style.position = 'relative';
    videoWrapper.style.width = '100%';
    videoWrapper.style.maxWidth = '100%';
    videoWrapper.style.overflow = 'hidden';
    
    // Add responsive aspect ratio (16:9)
    videoWrapper.style.paddingBottom = '56.25%'; // 16:9 aspect ratio
    videoWrapper.style.height = '0';
    
    // Style the iframe for mobile
    videoElement.style.position = 'absolute';
    videoElement.style.top = '0';
    videoElement.style.left = '0';
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.maxWidth = '100%';
    
    videoWrapper.appendChild(videoElement);
    container.appendChild(videoWrapper);
    
    console.log('Video rendered successfully in', containerId);
  }, 100);
}

// FIXED: News Rendering with Better Image Handling for iPhone
function renderNews(news) {
  const container = document.getElementById('newsContainer');
  
  if (!news || news.length === 0) {
    container.innerHTML = '<div class="data-error">No news available</div>';
    return;
  }
  
  container.innerHTML = ''; // Clear container
  
  news.forEach(item => {
    // Create item container
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';
    itemDiv.setAttribute('data-id', item.id);
    
    // Create thumbnail
    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'thumb';
    
    if (item.thumb && item.thumb.length > 0) {
      const img = document.createElement('img');
      img.src = item.thumb;
      img.alt = item.title;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.maxWidth = '100%'; // Important for mobile
      img.loading = 'lazy'; // Add lazy loading for better performance
      
      // Add error handler for images that fail to load
      img.onerror = function() {
        console.error('Image failed to load:', item.title);
        thumbDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#888;background:#f5f5f5;">NEWS</div>';
        thumbDiv.style.background = '#f5f5f5';
      };
      
      // Add load handler for debugging
      img.onload = function() {
        console.log('Image loaded successfully:', item.title);
      };
      
      thumbDiv.appendChild(img);
    } else {
      thumbDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#888;background:#f5f5f5;">NEWS</div>';
      thumbDiv.style.background = '#f5f5f5';
    }
    
    // Create meta section
    const metaDiv = document.createElement('div');
    metaDiv.className = 'meta';
    
    const titleH3 = document.createElement('h3');
    titleH3.textContent = item.title;
    
    const summaryP = document.createElement('p');
    summaryP.textContent = item.summary;
    
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'tags';
    if (item.tags && item.tags.length > 0) {
      item.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag-item';
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });
    }
    
    const dateDiv = document.createElement('div');
    dateDiv.className = 'small';
    dateDiv.textContent = item.date;
    
    metaDiv.appendChild(titleH3);
    metaDiv.appendChild(summaryP);
    metaDiv.appendChild(tagsDiv);
    metaDiv.appendChild(dateDiv);
    
    // Add remove button if in admin mode
    if (adminMode) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.onclick = () => removeNewsItem(item.id);
      itemDiv.appendChild(removeBtn);
    }
    
    itemDiv.appendChild(thumbDiv);
    itemDiv.appendChild(metaDiv);
    container.appendChild(itemDiv);
  });
  
  console.log('News rendered:', news.length, 'items');
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

function renderLatestEpisode() {
  const container = document.getElementById("latestEpisodeContainer");
  const removeBtn = document.getElementById("removeLatestEpisode");
  
  if (LATEST_EPISODE_URL) {
    renderVideo(LATEST_EPISODE_URL, "latestEpisodeContainer");
    if (adminMode) {
      removeBtn.style.display = 'flex';
    }
  } else {
    container.innerHTML = '<div class="small" id="latestEpisodePlaceholder">No latest episode video added yet.</div>';
    removeBtn.style.display = 'none';
  }
}

function renderFeaturedVideo() {
  const container = document.getElementById("videoContainer");
  const removeBtn = document.getElementById("removeFeaturedVideo");
  
  if (FEATURED_VIDEO_URL) {
    renderVideo(FEATURED_VIDEO_URL, "videoContainer");
    if (adminMode) {
      removeBtn.style.display = 'flex';
    }
  } else {
    container.innerHTML = '<div class="small" id="videoPlaceholder">No featured video yet — add a YouTube / Rumble / Instagram / TikTok link below.</div>';
    removeBtn.style.display = 'none';
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
  alert('Checkout functionality would be implemented here. This is a demo.');
}

function scrollToShop() {
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
}

// FIXED: Image Upload Functions for iPhone
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.match('image.*')) {
    alert('Please select an image file (JPEG, PNG, etc.)');
    return;
  }
  
  // Check file size (limit to 2MB for mobile compatibility)
  if (file.size > 2 * 1024 * 1024) {
    alert('Image size must be less than 2MB for mobile compatibility');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    // Compress image for iPhone compatibility
    compressImage(e.target.result, function(compressedDataUrl) {
      // Show preview
      const preview = document.getElementById('imagePreview');
      preview.src = compressedDataUrl;
      preview.style.display = 'block';
      
      // Store the compressed image data
      croppedImageDataUrl = compressedDataUrl;
      
      // Update upload container text
      const uploadContainer = document.getElementById('imageUploadContainer');
      const paragraph = uploadContainer.querySelector('p');
      if (paragraph) {
        paragraph.textContent = 'Image ready! Click "Add News" to use it.';
        paragraph.style.color = 'var(--primary)';
      }
    });
  };
  
  reader.onerror = function() {
    alert('Error reading file. Please try again.');
  };
  
  reader.readAsDataURL(file);
}

// Compress image for iPhone/mobile compatibility
function compressImage(dataUrl, callback) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set max dimensions for thumbnail
    const maxWidth = 400;
    const maxHeight = 400;
    let width = img.width;
    let height = img.height;
    
    // Calculate new dimensions
    if (width > height) {
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw and compress
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to JPEG with quality 0.7 for smaller file size
    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
    callback(compressedDataUrl);
  };
  
  img.onerror = function() {
    // If compression fails, use original
    callback(dataUrl);
  };
  
  img.src = dataUrl;
}

function setupImageUpload() {
  const uploadContainer = document.getElementById('imageUploadContainer');
  const fileInput = document.getElementById('newsImage');
  
  if (!uploadContainer || !fileInput) return;
  
  // Click to upload
  uploadContainer.addEventListener('click', function(e) {
    // Don't trigger if clicking on the input itself
    if (e.target !== fileInput) {
      fileInput.click();
    }
  });
  
  // File input change
  fileInput.addEventListener('change', handleImageUpload);
  
  // Drag and drop functionality
  uploadContainer.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadContainer.style.borderColor = 'var(--primary)';
    uploadContainer.style.background = 'rgba(198,40,40,0.1)';
  });
  
  uploadContainer.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadContainer.style.borderColor = '#ddd';
    uploadContainer.style.background = '';
  });
  
  uploadContainer.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
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
          date: '2025-11-14',
          tags: ['UFC', 'Breaking'],
          thumb: ''
        },
        {
          id: 'news-2',
          title: 'Rising Star Makes Statement Win',
          summary: 'Impressive performance puts contender in title picture.',
          date: '2025-11-13',
          tags: ['UFC', 'Highlights'],
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
    
    document.querySelectorAll('.loading').forEach(el => {
      el.style.display = 'none';
    });
    
  } catch (error) {
    console.error('Error loading data:', error);
    document.querySelectorAll('.loading').forEach(el => {
      el.innerHTML = '<div class="data-error">Error loading data. Please refresh the page.</div>';
    });
  }
}

// Admin Functionality
function toggleAdminMode() {
  adminMode = !adminMode;
  const adminToggle = document.getElementById('adminToggle');
  adminToggle.textContent = `Admin Mode: ${adminMode ? 'ON' : 'OFF'}`;
  adminToggle.style.background = adminMode ? 'var(--accent)' : 'var(--primary)';
  
  document.querySelectorAll('.admin-tools').forEach(tool => {
    tool.style.display = adminMode ? 'block' : 'none';
  });
  
  // Update video remove buttons
  if (FEATURED_VIDEO_URL) {
    document.getElementById('removeFeaturedVideo').style.display = adminMode ? 'flex' : 'none';
  }
  if (LATEST_EPISODE_URL) {
    document.getElementById('removeLatestEpisode').style.display = adminMode ? 'flex' : 'none';
  }
  
  // Re-render news to show/hide remove buttons
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
  
  // Close cart modal when clicking outside
  document.getElementById('cartModal').addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.remove('active');
    }
  });
  
  document.getElementById('checkoutBtn').addEventListener('click', proceedToCheckout);
  
  // Refresh stats button
  document.getElementById('refreshStats').addEventListener('click', function() {
    loadAllData();
  });

  // Setup image upload
  setupImageUpload();

  // Initial load
  loadAllData();
}

// Initialize
document.addEventListener("DOMContentLoaded", bindUI);
