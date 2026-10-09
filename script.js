/**
 * otaku corner - Core E-Commerce & Inventory Management Engine
 * Includes:
 * 1. Modular Data Access Layer (getProducts, saveProducts, addProduct, updateProduct, deleteProduct, reduceProductStock)
 * 2. Store Catalog Rendering, Category Filters, Search, and Sort by Price
 * 3. Shopping Cart Drawer, Quantity Controls, Item Removal, Total Price
 * 4. Automatic Stock Reduction on Order Placement
 * 5. Store Owner Admin Inventory Management Panel:
 *    - Summary Cards (Total Products, Total Stock, Low Stock, Out of Stock)
 *    - Real-Time Table with Rows Highlighted when Stock < 5
 *    - Add, Edit, Delete, and Direct Stock Update Actions
 * 6. Toast Popup Notifications
 */

// ==========================================================================
// Global Image Error Handlers & Visual Fallback System
// ==========================================================================
window.handleProductImageError = function(imgElement, productId) {
  if (!imgElement) return;
  imgElement.style.display = 'none';
  imgElement.setAttribute('data-failed', 'true');
  const container = imgElement.closest('.product-image-container');
  if (container) {
    container.setAttribute('data-current-view', 'art');
    const fallback = container.querySelector('.product-image-fallback');
    if (fallback) {
      fallback.style.display = 'flex';
    }
    const photoBtn = container.querySelector('.view-mode-btn[data-mode="photo"]');
    const artBtn = container.querySelector('.view-mode-btn[data-mode="art"]');
    if (photoBtn) {
      photoBtn.classList.remove('active');
      photoBtn.classList.add('disabled');
      photoBtn.title = 'Photo file not found';
    }
    if (artBtn) {
      artBtn.classList.add('active');
      artBtn.title = 'Showing vector illustration fallback';
    }
    if (!container.querySelector('.photo-unavailable-badge')) {
      const badge = document.createElement('span');
      badge.className = 'photo-unavailable-badge';
      badge.innerHTML = '<span>⚠️ Photo missing</span>';
      container.appendChild(badge);
    }
  }
};

window.handleProductImageSuccess = function(imgElement, productId) {
  if (!imgElement) return;
  imgElement.removeAttribute('data-failed');
  const container = imgElement.closest('.product-image-container');
  if (container) {
    const unavailBadge = container.querySelector('.photo-unavailable-badge');
    if (unavailBadge) unavailBadge.remove();
    const photoBtn = container.querySelector('.view-mode-btn[data-mode="photo"]');
    const artBtn = container.querySelector('.view-mode-btn[data-mode="art"]');
    if (photoBtn) {
      photoBtn.classList.remove('disabled');
      photoBtn.title = 'Real product photo (Default)';
    }
    // Only show photo if user has not explicitly clicked art
    if (container.getAttribute('data-current-view') !== 'art') {
      imgElement.style.display = 'block';
      const fallback = container.querySelector('.product-image-fallback');
      if (fallback) fallback.style.display = 'none';
      if (photoBtn) photoBtn.classList.add('active');
      if (artBtn) artBtn.classList.remove('active');
    }
  }
};

window.handleThumbImageError = function(imgElement) {
  if (!imgElement) return;
  imgElement.style.display = 'none';
  const parent = imgElement.parentElement;
  if (parent) {
    const fallback = parent.querySelector('.cart-thumb-fallback, .admin-thumb-fallback');
    if (fallback) {
      fallback.style.display = 'flex';
    }
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function checkLoadedImages() {
  document.querySelectorAll('.product-image-img').forEach(img => {
    if (img.complete && img.naturalWidth === 0 && img.src && !img.hasAttribute('data-failed')) {
      handleProductImageError(img);
    }
  });
  document.querySelectorAll('.cart-thumb-img, .admin-thumb-img').forEach(img => {
    if (img.complete && img.naturalWidth === 0 && img.src) {
      handleThumbImageError(img);
    }
  });
}

function getDefaultImageForCategory(category) {
  switch (category) {
    case 't-shirts': return 'images/tshirt-1.jpg';
    case 'figures': return 'images/figure-1.jpg';
    case 'coffee mugs': return 'images/mug-1.jpg';
    case 'keychains': return 'images/keychain-1.jpg';
    case 'posters': return 'images/poster-1.jpg';
    default: return 'images/tshirt-1.jpg';
  }
}

// ==========================================================================
// 1. DATA ACCESS LAYER (Backend-Ready Modular Functions)
// Replace localStorage with fetch('/api/...') when connecting a backend server.
// ==========================================================================
const PRODUCTS_STORAGE_KEY = 'otaku_corner_products_v7';
const CART_STORAGE_KEY = 'otaku_corner_cart_v5';
const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING_FEE = 99;

// The 9 Real-Photo Anime Merchandise Products
const INITIAL_PRODUCTS = [
  // 1. T-Shirts
  {
    id: 'otk-01',
    name: 'Red Pirate Crew Jersey Set',
    category: 't-shirts',
    categoryLabel: 'T-Shirts',
    price: 1299,
    stock: 15,
    stockStatus: 'In Stock',
    stockType: 'in',
    description: 'Breathable anime baseball jersey set inspired by the iconic straw hat pirate crew.',
    image: 'images/tshirt-1.jpg',
    svgTheme: 'fox',
    svgArt: `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" rx="20" fill="#FFFBF5"/>
        <circle cx="150" cy="150" r="105" fill="#FFEEDB"/>
        <path d="M100 70 L130 55 C140 70, 160 70, 170 55 L200 70 L240 100 L215 130 L195 115 L195 240 L105 240 L105 115 L85 130 L60 100 Z" fill="#D90429" stroke="#3B2314" stroke-width="3" stroke-linejoin="round"/>
        <path d="M130 55 C140 70, 160 70, 170 55" fill="none" stroke="#FFD166" stroke-width="3"/>
        <circle cx="150" cy="150" r="30" fill="#FFFFFF" stroke="#3B2314" stroke-width="2.5"/>
        <text x="150" y="158" font-family="'Fredoka', sans-serif" font-weight="700" font-size="24" fill="#3B2314" text-anchor="middle">☠</text>
        <text x="150" y="210" font-family="'Fredoka', sans-serif" font-weight="600" font-size="11" fill="#D90429" text-anchor="middle" letter-spacing="1">PIRATE・JERSEY</text>
      </svg>
    `
  },
  {
    id: 'otk-02',
    name: 'Overlord Back Print Oversized Tee',
    category: 't-shirts',
    categoryLabel: 'T-Shirts',
    price: 899,
    stock: 3, // Low stock: 3 left
    stockStatus: 'Low Stock',
    stockType: 'low',
    description: 'Heavyweight drop-shoulder oversized streetwear tee featuring high-density dark fantasy back print.',
    image: 'images/tshirt-2.jpg',
    svgTheme: 'strawberry',
    svgArt: `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" rx="20" fill="#FFFBF5"/>
        <circle cx="150" cy="150" r="105" fill="#FFEBF0"/>
        <path d="M100 70 L130 55 C140 70, 160 70, 170 55 L200 70 L240 100 L215 130 L195 115 L195 240 L105 240 L105 115 L85 130 L60 100 Z" fill="#2B2D42" stroke="#3B2314" stroke-width="3" stroke-linejoin="round"/>
        <path d="M130 55 C140 70, 160 70, 170 55" fill="none" stroke="#8D99AE" stroke-width="3"/>
        <rect x="122" y="125" width="56" height="56" rx="6" fill="#8D99AE" stroke="#3B2314" stroke-width="2"/>
        <circle cx="150" cy="153" r="16" fill="#EF233C"/>
        <text x="150" y="212" font-family="'Fredoka', sans-serif" font-weight="600" font-size="10" fill="#2B2D42" text-anchor="middle">OVERLORD BACKPRINT</text>
      </svg>
    `
  },
  {
    id: 'otk-03',
    name: 'Monochrome Anime Face Graphic Tee',
    category: 't-shirts',
    categoryLabel: 'T-Shirts',
    price: 799,
    stock: 18,
    stockStatus: 'In Stock',
    stockType: 'in',
    description: 'Pure combed cotton daily streetwear tee with high-contrast minimalist monochrome manga illustration.',
    image: 'images/tshirt-3.jpg',
    svgTheme: 'fox',
    svgArt: `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" rx="20" fill="#FFFBF5"/>
        <circle cx="150" cy="150" r="105" fill="#F0EFEB"/>
        <path d="M100 70 L130 55 C140 70, 160 70, 170 55 L200 70 L240 100 L215 130 L195 115 L195 240 L105 240 L105 115 L85 130 L60 100 Z" fill="#FFFFFF" stroke="#111111" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="138" cy="150" r="4" fill="#111111"/>
        <circle cx="162" cy="150" r="4" fill="#111111"/>
        <path d="M136 142 Q142 136 148 142" stroke="#111111" stroke-width="2.5" fill="none"/>
        <path d="M152 142 Q158 136 164 142" stroke="#111111" stroke-width="2.5" fill="none"/>
        <path d="M145 162 Q150 166 155 162" stroke="#111111" stroke-width="2" fill="none"/>
        <text x="150" y="210" font-family="'Fredoka', sans-serif" font-weight="600" font-size="10" fill="#111111" text-anchor="middle" letter-spacing="1">MONOCHROME FACE</text>
      </svg>
    `
  },

  // 2. Figures
  {
    id: 'otk-04',
    name: 'Rival Ninjas Collectible Figure Set',
    category: 'figures',
    categoryLabel: 'Figures',
    price: 2499,
    stock: 8,
    stockStatus: 'In Stock',
    stockType: 'in',
    description: 'Dynamic PVC scale collectible display figures capturing legendary shinobi rivals locked in battle.',
    image: 'images/figure-1.jpg',
    svgTheme: 'robot',
    svgArt: `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" rx="20" fill="#FFFBF5"/>
        <circle cx="150" cy="150" r="105" fill="#FFE5D4"/>
        <ellipse cx="150" cy="245" rx="72" ry="16" fill="#F7D6C1" stroke="#3B2314" stroke-width="3"/>
        <circle cx="118" cy="140" r="24" fill="#FF6B35" stroke="#3B2314" stroke-width="2.5"/>
        <circle cx="182" cy="140" r="24" fill="#2A9D8F" stroke="#3B2314" stroke-width="2.5"/>
        <polygon points="150,110 156,128 174,130 160,142 164,160 150,150 136,160 140,142 126,130 144,128" fill="#FFB703" stroke="#3B2314" stroke-width="2"/>
        <text x="150" y="215" font-family="'Fredoka', sans-serif" font-weight="600" font-size="11" fill="#3B2314" text-anchor="middle">RIVAL NINJAS</text>
        <text x="150" y="228" font-family="'Quicksand', sans-serif" font-weight="700" font-size="8" fill="#FF6B35" text-anchor="middle">COLLECTIBLE SET</text>
      </svg>
    `
  },

  // 3. Coffee Mugs
  {
    id: 'otk-05',
    name: 'Manga Panel Coffee Mug',
    category: 'coffee mugs',
    categoryLabel: 'Coffee Mugs',
    price: 449,
    stock: 20,
    stockStatus: 'In Stock',
    stockType: 'in',
    description: 'Glossy 350ml ceramic coffee mug wrapped with high-definition classic manga comic action panels.',
    image: 'images/mug-1.jpg',
    svgTheme: 'cat',
    svgArt: `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" rx="20" fill="#FFFBF5"/>
        <circle cx="150" cy="150" r="105" fill="#FFEBF0"/>
        <ellipse cx="150" cy="245" rx="75" ry="12" fill="#F7D6C1"/>
        <path d="M195 120 C242 120, 242 200, 195 200" fill="none" stroke="#FF6B35" stroke-width="16" stroke-linecap="round"/>
        <path d="M195 120 C242 120, 242 200, 195 200" fill="none" stroke="#3B2314" stroke-width="3" stroke-linecap="round"/>
        <path d="M95 100 L205 100 L195 230 C195 240, 105 240, 105 230 Z" fill="#FFFFFF" stroke="#3B2314" stroke-width="3.5" stroke-linejoin="round"/>
        <rect x="110" y="125" width="40" height="45" fill="#FFFFFF" stroke="#3B2314" stroke-width="2"/>
        <rect x="154" y="125" width="36" height="45" fill="#3B2314"/>
        <text x="130" y="152" font-family="'Fredoka', sans-serif" font-size="16" fill="#3B2314" text-anchor="middle">⚡</text>
        <text x="150" y="215" font-family="'Fredoka', sans-serif" font-weight="600" font-size="11" fill="#3B2314" text-anchor="middle">MANGA PANEL</text>
      </svg>
    `
  },

  // 4. Keychains
  {
    id: 'otk-06',
    name: 'Academy Squad Keychain Pack',
    category: 'keychains',
    categoryLabel: 'Keychains',
    price: 299,
    stock: 25,
    stockStatus: 'In Stock',
    stockType: 'in',
    description: 'Triple-character durable acrylic charm pack showcasing the aspiring hero academy squad.',
    image: 'images/keychain-1.jpg',
    svgTheme: 'star',
    svgArt: `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" rx="20" fill="#FFFBF5"/>
        <circle cx="150" cy="150" r="105" fill="#E6F6F4"/>
        <circle cx="150" cy="45" r="22" fill="none" stroke="#3B2314" stroke-width="5"/>
        <circle cx="150" cy="45" r="17" fill="#FFB703"/>
        <ellipse cx="150" cy="80" rx="6" ry="10" fill="#FFFFFF" stroke="#3B2314" stroke-width="3"/>
        <rect x="90" y="112" width="120" height="158" rx="24" fill="#FFFFFF" stroke="#3B2314" stroke-width="3.5"/>
        <rect x="96" y="118" width="108" height="146" rx="18" fill="#FFE8DF"/>
        <circle cx="125" cy="170" r="16" fill="#2A9D8F"/>
        <circle cx="150" cy="155" r="18" fill="#FF6B35"/>
        <circle cx="175" cy="170" r="16" fill="#FFB703"/>
        <text x="150" y="252" font-family="'Fredoka', sans-serif" font-weight="600" font-size="10" fill="#3B2314" text-anchor="middle">ACADEMY SQUAD</text>
      </svg>
    `
  },
  {
    id: 'otk-07',
    name: 'Ninja Squad Keychain Pack',
    category: 'keychains',
    categoryLabel: 'Keychains',
    price: 299,
    stock: 12,
    stockStatus: 'In Stock',
    stockType: 'in',
    description: 'Vibrant acrylic keychain multipack featuring iconic leaf village teammates with sturdy metal clasps.',
    image: 'images/keychain-2.jpg',
    svgTheme: 'fox',
    svgArt: `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" rx="20" fill="#FFFBF5"/>
        <circle cx="150" cy="150" r="105" fill="#FFF4D4"/>
        <circle cx="150" cy="45" r="22" fill="none" stroke="#3B2314" stroke-width="5"/>
        <circle cx="150" cy="45" r="17" fill="#FFB703"/>
        <line x1="150" y1="67" x2="150" y2="105" stroke="#3B2314" stroke-width="4" stroke-linecap="round"/>
        <circle cx="150" cy="175" r="58" fill="#FF6B35" stroke="#3B2314" stroke-width="4"/>
        <circle cx="150" cy="162" r="34" fill="#FFF4E6" stroke="#3B2314" stroke-width="2"/>
        <text x="150" y="172" font-family="'Fredoka', sans-serif" font-weight="700" font-size="20" fill="#3B2314" text-anchor="middle">忍</text>
        <text x="150" y="258" font-family="'Fredoka', sans-serif" font-weight="600" font-size="10" fill="#3B2314" text-anchor="middle">NINJA SQUAD</text>
      </svg>
    `
  },
  {
    id: 'otk-08',
    name: 'Young Warrior Strap Keychain',
    category: 'keychains',
    categoryLabel: 'Keychains',
    price: 199,
    stock: 0, // Out of Stock: 0 left
    stockStatus: 'Out of Stock',
    stockType: 'out',
    description: 'Handcrafted wristlet strap keychain with miniature acrylic pendant of the brave blade warrior.',
    image: 'images/keychain-3.jpg',
    svgTheme: 'strawberry',
    svgArt: `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" rx="20" fill="#FFFBF5"/>
        <circle cx="150" cy="150" r="105" fill="#FFE5D4"/>
        <circle cx="150" cy="45" r="22" fill="none" stroke="#3B2314" stroke-width="5"/>
        <circle cx="150" cy="45" r="17" fill="#FFB703"/>
        <line x1="150" y1="67" x2="150" y2="105" stroke="#3B2314" stroke-width="4" stroke-linecap="round"/>
        <rect x="135" y="110" width="30" height="90" rx="8" fill="#2A9D8F" stroke="#3B2314" stroke-width="3"/>
        <rect x="141" y="120" width="18" height="18" fill="#3B2314"/>
        <rect x="141" y="150" width="18" height="18" fill="#3B2314"/>
        <circle cx="150" cy="225" r="15" fill="#FF8FA3" stroke="#3B2314" stroke-width="2"/>
        <text x="150" y="260" font-family="'Fredoka', sans-serif" font-weight="600" font-size="9" fill="#3B2314" text-anchor="middle">WARRIOR STRAP</text>
      </svg>
    `
  },

  // 5. Posters
  {
    id: 'otk-09',
    name: 'Motivational Anime Quote Poster Set (6 pcs)',
    category: 'posters',
    categoryLabel: 'Posters',
    price: 399,
    stock: 14,
    stockStatus: 'In Stock',
    stockType: 'in',
    description: 'Set of 6 premium A4 museum-grade 300 GSM matte art prints featuring inspiring anime quotes.',
    image: 'images/poster-1.jpg',
    svgTheme: 'fox',
    svgArt: `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" rx="20" fill="#FFFBF5"/>
        <circle cx="150" cy="150" r="105" fill="#FFE8DF"/>
        <rect x="80" y="55" width="140" height="190" rx="10" fill="#FFFFFF" stroke="#3B2314" stroke-width="3.5"/>
        <rect x="90" y="65" width="120" height="170" rx="6" fill="#FFF4E6"/>
        <rect x="98" y="75" width="104" height="95" rx="6" fill="#FFB703" stroke="#3B2314" stroke-width="2"/>
        <text x="150" y="125" font-family="'Fredoka', sans-serif" font-weight="700" font-size="14" fill="#3B2314" text-anchor="middle">NEVER GIVE UP</text>
        <text x="150" y="215" font-family="'Fredoka', sans-serif" font-weight="600" font-size="10" fill="#3B2314" text-anchor="middle">MOTIVATIONAL POSTERS</text>
        <text x="150" y="226" font-family="'Quicksand', sans-serif" font-weight="700" font-size="7" fill="#FF6B35" text-anchor="middle">6 PCS MATTE PACK</text>
      </svg>
    `
  }
];

// Helper to keep stock status consistent
function syncProductStockStatus(product) {
  const stockNum = Math.max(0, parseInt(product.stock, 10) || 0);
  product.stock = stockNum;
  if (stockNum === 0) {
    product.stockStatus = 'Out of Stock';
    product.stockType = 'out';
  } else if (stockNum < 5) {
    product.stockStatus = 'Low Stock';
    product.stockType = 'low';
  } else {
    product.stockStatus = 'In Stock';
    product.stockType = 'in';
  }
}

// ----------------------------------------------------
// Public Data Functions (Can be connected to backend)
// ----------------------------------------------------
function getProducts() {
  try {
    let raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      // Check if previous v6 data exists to preserve custom products added in admin panel
      let initialList = [...INITIAL_PRODUCTS];
      const prevRaw = localStorage.getItem('otaku_corner_products_v6');
      if (prevRaw) {
        try {
          const prevList = JSON.parse(prevRaw);
          // Preserve any custom products (products whose id is not in INITIAL_PRODUCTS)
          const customItems = prevList.filter(item => !INITIAL_PRODUCTS.some(init => init.id === item.id));
          if (customItems.length > 0) {
            initialList = [...INITIAL_PRODUCTS, ...customItems];
          }
        } catch (prevErr) {
          console.warn('Migration from v6 skipped:', prevErr);
        }
      }
      saveProducts(initialList);
      return initialList;
    }
    const list = JSON.parse(raw);
    let needsSave = false;
    list.forEach(item => {
      syncProductStockStatus(item);
      // Ensure initial 9 products strictly use their verified image files
      const initial = INITIAL_PRODUCTS.find(p => p.id === item.id);
      if (initial && item.image !== initial.image) {
        item.image = initial.image;
        needsSave = true;
      } else if (!item.image) {
        item.image = getDefaultImageForCategory(item.category);
        needsSave = true;
      }
    });
    if (needsSave) saveProducts(list);
    return list;
  } catch (e) {
    console.error('Error in getProducts', e);
    return [...INITIAL_PRODUCTS];
  }
}

function saveProducts(productsList) {
  try {
    productsList.forEach(syncProductStockStatus);
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(productsList));
  } catch (e) {
    console.error('Error in saveProducts', e);
  }
}

function getProductById(id) {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}

function addProduct(productData) {
  const products = getProducts();
  const category = productData.category || 't-shirts';
  const newProduct = {
    ...productData,
    id: 'otk-' + (Date.now().toString().slice(-4)),
    image: (productData.image && productData.image.trim()) ? productData.image.trim() : getDefaultImageForCategory(category),
    stock: parseInt(productData.stock, 10) || 0
  };
  syncProductStockStatus(newProduct);
  products.unshift(newProduct); // Add at top
  saveProducts(products);
  return newProduct;
}

function updateProduct(id, updatedData) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;

  const current = products[index];
  const targetCategory = updatedData.category || current.category;
  const targetImage = (updatedData.image && updatedData.image.trim()) 
    ? updatedData.image.trim() 
    : (current.image || getDefaultImageForCategory(targetCategory));

  products[index] = {
    ...current,
    ...updatedData,
    image: targetImage,
    stock: parseInt(updatedData.stock, 10) || 0
  };
  syncProductStockStatus(products[index]);
  saveProducts(products);
  return products[index];
}

function updateProductStockDirectly(id, newStock) {
  const products = getProducts();
  const product = products.find(p => p.id === id);
  if (!product) return null;
  product.stock = Math.max(0, parseInt(newStock, 10) || 0);
  syncProductStockStatus(product);
  saveProducts(products);
  return product;
}

function deleteProduct(id) {
  let products = getProducts();
  const initialLength = products.length;
  products = products.filter(p => p.id !== id);
  if (products.length === initialLength) return false;
  saveProducts(products);
  return true;
}

// Reduce stock automatically when order is placed
function reduceProductStock(purchasedCartItems) {
  const products = getProducts();
  purchasedCartItems.forEach(cartItem => {
    const product = products.find(p => p.id === cartItem.id);
    if (product) {
      product.stock = Math.max(0, product.stock - cartItem.quantity);
      syncProductStockStatus(product);
    }
  });
  saveProducts(products);
  return products;
}

// Generate dynamic artwork SVG for new user-created items
function generateProductSvg(theme, title, categoryLabel) {
  const bgColors = {
    fox: '#FFEEDB',
    cat: '#FFEBF0',
    robot: '#FFF4D4',
    bear: '#FFE5D4',
    star: '#E6F6F4',
    strawberry: '#FFEBF0'
  };
  const bg = bgColors[theme] || '#FFEEDB';
  const icons = {
    fox: '🦊',
    cat: '🐱',
    robot: '⚡',
    bear: '🐻',
    star: '⭐',
    strawberry: '🍓'
  };
  const icon = icons[theme] || '✨';

  return `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="300" rx="20" fill="#FFFBF5"/>
      <circle cx="150" cy="150" r="105" fill="${bg}"/>
      <circle cx="150" cy="140" r="50" fill="#FFFFFF" stroke="#3B2314" stroke-width="3"/>
      <text x="150" y="156" font-size="44" text-anchor="middle">${icon}</text>
      <text x="150" y="224" font-family="'Fredoka', sans-serif" font-weight="700" font-size="12" fill="#3B2314" text-anchor="middle">${title.toUpperCase().slice(0, 16)}</text>
      <text x="150" y="240" font-family="'Quicksand', sans-serif" font-weight="700" font-size="9" fill="#FF6B35" text-anchor="middle">${categoryLabel.toUpperCase()}</text>
    </svg>
  `;
}

// ==========================================================================
// 2. SHOPPING CART STATE
// ==========================================================================
let cart = [];

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    cart = saved ? JSON.parse(saved) : [];
    const products = getProducts();
    // Only keep cart items that exist in current catalog
    cart = cart.filter(item => products.some(p => p.id === item.id));
    cart.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod) {
        item.name = prod.name;
        item.price = prod.price;
        item.image = prod.image;
        item.category = prod.category;
        item.categoryLabel = prod.categoryLabel;
      }
    });
    saveCart();
  } catch (e) {
    cart = [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.warn('Failed to save cart', e);
  }
}

// ==========================================================================
// 3. UI STATE & DOM ELEMENTS
// ==========================================================================
let activeCategory = 'all';
let searchQuery = '';
let sortBy = 'featured';
let adminSearchQuery = '';
let adminActiveFilter = 'all';

// Main Catalog Elements
const productsGrid = document.getElementById('productsGrid');
const emptyState = document.getElementById('emptyState');
const filterTabs = document.getElementById('filterTabs');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const sortSelect = document.getElementById('sortSelect');
const visibleProductsCount = document.getElementById('visibleProductsCount');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

// Navbar & Header Elements
const siteHeader = document.getElementById('header');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const cartOpenBtn = document.getElementById('cartOpenBtn');
const cartCountBadge = document.getElementById('cartCountBadge');
const adminOpenBtn = document.getElementById('adminOpenBtn');

// Cart Drawer Elements
const cartOverlay = document.getElementById('cartOverlay');
const cartDrawer = document.getElementById('cartDrawer');
const cartCloseBtn = document.getElementById('cartCloseBtn');
const cartItemsList = document.getElementById('cartItemsList');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartShipping = document.getElementById('cartShipping');
const cartGrandTotal = document.getElementById('cartGrandTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCartBtn');
const shippingProgressText = document.getElementById('shippingProgressText');
const shippingProgressFill = document.getElementById('shippingProgressFill');

// Modals & Toasts
const checkoutModalOverlay = document.getElementById('checkoutModalOverlay');
const modalOrderSummary = document.getElementById('modalOrderSummary');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const toastContainer = document.getElementById('toastContainer');
const contactForm = document.getElementById('contactForm');

// Admin Panel Elements
const adminPanelOverlay = document.getElementById('adminPanelOverlay');
const adminCloseBtn = document.getElementById('adminCloseBtn');
const openAddProductModalBtn = document.getElementById('openAddProductModalBtn');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminFilterPills = document.querySelectorAll('.admin-filter-pill');
const adminProductsTbody = document.getElementById('adminProductsTbody');

// Admin Stat Counters
const statTotalProducts = document.getElementById('statTotalProducts');
const statTotalStock = document.getElementById('statTotalStock');
const statLowStock = document.getElementById('statLowStock');
const statOutStock = document.getElementById('statOutStock');

// Product Form Modal Elements
const productFormModalOverlay = document.getElementById('productFormModalOverlay');
const productFormCloseBtn = document.getElementById('productFormCloseBtn');
const productFormCancelBtn = document.getElementById('productFormCancelBtn');
const productForm = document.getElementById('productForm');
const productFormTitle = document.getElementById('productFormTitle');
const formProductId = document.getElementById('formProductId');
const formProductName = document.getElementById('formProductName');
const formProductCategory = document.getElementById('formProductCategory');
const formProductPrice = document.getElementById('formProductPrice');
const formProductStock = document.getElementById('formProductStock');
const formProductTheme = document.getElementById('formProductTheme');
const formProductImage = document.getElementById('formProductImage');
const formImagePreview = document.getElementById('formImagePreview');
const previewStatusText = document.getElementById('previewStatusText');
const formProductDesc = document.getElementById('formProductDesc');

// ==========================================================================
// 4. TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';

  let icon = '🦊';
  if (type === 'warning') icon = '⚠️';
  if (type === 'info') icon = '💌';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }, 2600);
}

// Helper currency formatter
function formatRupees(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

// ==========================================================================
// 5. CATALOG RENDERING & SHOPPING
// ==========================================================================
function createProductCardHTML(product) {
  const isOutOfStock = product.stock <= 0;
  
  let stockBadgeClass = 'stock-in';
  if (product.stockType === 'low') stockBadgeClass = 'stock-low';
  if (product.stockType === 'out') stockBadgeClass = 'stock-out';

  const imgSrc = product.image || getDefaultImageForCategory(product.category);

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image-container" data-current-view="photo">
        <span class="product-category-chip">${product.categoryLabel}</span>
        <span class="stock-badge ${stockBadgeClass}">
          <span class="stock-badge-dot"></span>
          <span>${product.stockStatus} (${product.stock})</span>
        </span>
        <img 
          src="${escapeHtml(imgSrc)}" 
          alt="${escapeHtml(product.name)}" 
          class="product-image-img" 
          loading="lazy" 
          onload="handleProductImageSuccess(this, '${product.id}')"
          onerror="handleProductImageError(this, '${product.id}')"
        >
        <div class="product-image-fallback" id="fallback-${product.id}" style="display: none;">
          ${product.svgArt || generateProductSvg(product.svgTheme || 'fox', product.name, product.categoryLabel)}
        </div>
        <div class="card-view-toggle" role="group" aria-label="Toggle photo or illustration view">
          <button 
            type="button" 
            class="view-mode-btn active" 
            data-mode="photo" 
            data-id="${product.id}" 
            title="Real product photo (Default)"
          >
            <span class="view-mode-icon">📷</span> Photo
          </button>
          <button 
            type="button" 
            class="view-mode-btn" 
            data-mode="art" 
            data-id="${product.id}" 
            title="Cute vector illustration"
          >
            <span class="view-mode-icon">🎨</span> Art
          </button>
        </div>
      </div>

      <div class="product-card-body">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-meta-desc">${product.description}</p>

        <div class="product-card-footer">
          <div class="product-price-wrapper">
            <span class="price-currency-label">Price</span>
            <span class="product-price">
              <span class="currency-sym">₹</span>${Number(product.price).toLocaleString('en-IN')}
            </span>
          </div>

          <button 
            class="add-to-cart-btn" 
            data-action="add-to-cart" 
            data-id="${product.id}"
            ${isOutOfStock ? 'disabled title="Out of Stock - Currently Unavailable"' : ''}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const products = getProducts();
  let list = [...products];

  // 1. Filter by category
  if (activeCategory !== 'all') {
    list = list.filter(item => item.category === activeCategory);
  }

  // 2. Filter by search query
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  }

  // 3. Sort by price or name
  if (sortBy === 'price-low') {
    list.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    list.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'name-asc') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (visibleProductsCount) {
    visibleProductsCount.textContent = list.length;
  }

  if (list.length === 0) {
    productsGrid.innerHTML = '';
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    productsGrid.innerHTML = list.map(createProductCardHTML).join('');
    setTimeout(checkLoadedImages, 200);
  }
}

function updateCategoryCounters() {
  const products = getProducts();
  const allCount = products.length;
  const tshirts = products.filter(p => p.category === 't-shirts').length;
  const figures = products.filter(p => p.category === 'figures').length;
  const mugs = products.filter(p => p.category === 'coffee mugs').length;
  const keychains = products.filter(p => p.category === 'keychains').length;
  const posters = products.filter(p => p.category === 'posters').length;

  const countAll = document.getElementById('countAll');
  const countTshirts = document.getElementById('countTshirts');
  const countFigures = document.getElementById('countFigures');
  const countMugs = document.getElementById('countMugs');
  const countKeychains = document.getElementById('countKeychains');
  const countPosters = document.getElementById('countPosters');

  if (countAll) countAll.textContent = allCount;
  if (countTshirts) countTshirts.textContent = tshirts;
  if (countFigures) countFigures.textContent = figures;
  if (countMugs) countMugs.textContent = mugs;
  if (countKeychains) countKeychains.textContent = keychains;
  if (countPosters) countPosters.textContent = posters;
}

// ==========================================================================
// 6. CART DRAWER & CHECKOUT WITH AUTOMATIC STOCK REDUCTION
// ==========================================================================
function openCartDrawer() {
  cartDrawer.classList.add('active');
  cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  cartDrawer.classList.remove('active');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function addToCart(productId) {
  const product = getProductById(productId);
  if (!product) return;

  if (product.stock <= 0) {
    showToast(`⚠️ Sorry, "${product.name}" is currently Out of Stock!`, 'warning');
    return;
  }

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    if (existing.quantity >= product.stock) {
      showToast(`⚠️ Only ${product.stock} units available in stock!`, 'warning');
      return;
    }
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      category: product.category,
      categoryLabel: product.categoryLabel,
      price: product.price,
      quantity: 1,
      image: product.image || getDefaultImageForCategory(product.category),
      svgArt: product.svgArt
    });
  }

  saveCart();
  updateCartUI();
  animateCartBadge();
  showToast(`Added to cart: ${product.name}! ✨`, 'success');
  openCartDrawer();
}

function updateCartQuantity(productId, delta) {
  const itemIndex = cart.findIndex(i => i.id === productId);
  if (itemIndex === -1) return;

  const product = getProductById(productId);
  const newQty = cart[itemIndex].quantity + delta;

  if (product && newQty > product.stock) {
    showToast(`⚠️ Cannot add more: Only ${product.stock} units in stock!`, 'warning');
    return;
  }

  cart[itemIndex].quantity = newQty;
  
  if (cart[itemIndex].quantity <= 0) {
    const removedName = cart[itemIndex].name;
    cart.splice(itemIndex, 1);
    showToast(`Removed "${removedName}" from cart`, 'info');
  } else {
    showToast('Updated quantity', 'info');
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  const itemIndex = cart.findIndex(i => i.id === productId);
  if (itemIndex === -1) return;

  const removedName = cart[itemIndex].name;
  cart.splice(itemIndex, 1);
  saveCart();
  updateCartUI();
  showToast(`Removed "${removedName}" from cart`, 'info');
}

function clearCart() {
  if (cart.length === 0) return;
  cart = [];
  saveCart();
  updateCartUI();
  showToast('Shopping cart cleared', 'info');
}

function animateCartBadge() {
  if (!cartCountBadge) return;
  cartCountBadge.classList.add('bump');
  setTimeout(() => cartCountBadge.classList.remove('bump'), 350);
}

function updateCartUI() {
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountBadge) cartCountBadge.textContent = totalQty;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
  const shipping = isFreeShipping ? 0 : FLAT_SHIPPING_FEE;
  const grandTotal = subtotal + shipping;

  if (cartSubtotal) cartSubtotal.textContent = formatRupees(subtotal);
  if (cartShipping) cartShipping.textContent = subtotal === 0 ? '₹0' : (isFreeShipping ? 'FREE' : formatRupees(shipping));
  if (cartGrandTotal) cartGrandTotal.textContent = formatRupees(grandTotal);

  if (shippingProgressText && shippingProgressFill) {
    if (subtotal === 0) {
      shippingProgressText.innerHTML = `Add items worth <strong>₹${FREE_SHIPPING_THRESHOLD}</strong> for FREE delivery! 🚚`;
      shippingProgressFill.style.width = '0%';
    } else if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      shippingProgressText.innerHTML = `🎉 Yay! You have unlocked <strong>FREE Delivery</strong>!`;
      shippingProgressFill.style.width = '100%';
    } else {
      const diff = FREE_SHIPPING_THRESHOLD - subtotal;
      const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
      shippingProgressText.innerHTML = `Add <strong>₹${diff}</strong> more for FREE delivery! 📦`;
      shippingProgressFill.style.width = `${pct}%`;
    }
  }

  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div class="cart-empty-message">
        <div class="empty-cart-icon">🛒</div>
        <h4>Your cart is empty</h4>
        <p>No otaku merch yet! Browse our collection and add your favorite items.</p>
        <button class="btn btn-primary" onclick="closeCartDrawer(); window.location.hash='#shop';">
          Browse Collection ✨
        </button>
      </div>
    `;
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (clearCartBtn) clearCartBtn.style.display = 'none';
  } else {
    if (checkoutBtn) checkoutBtn.disabled = false;
    if (clearCartBtn) clearCartBtn.style.display = 'block';

    cartItemsList.innerHTML = cart.map(item => {
      const imgSrc = item.image || getDefaultImageForCategory(item.category || 't-shirts');
      return `
      <div class="cart-item-row" data-id="${item.id}">
        <div class="cart-item-thumb">
          <img 
            src="${escapeHtml(imgSrc)}" 
            alt="${escapeHtml(item.name)}" 
            class="cart-thumb-img" 
            loading="lazy" 
            onerror="handleThumbImageError(this)"
          >
          <div class="cart-thumb-fallback" style="display: none;">
            ${item.svgArt || '<span class="thumb-fallback-icon">🦊</span>'}
          </div>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-category">${escapeHtml(item.categoryLabel)}</div>
          <div class="cart-item-price">${formatRupees(item.price)} × ${item.quantity} = ${formatRupees(item.price * item.quantity)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="qty-btn" data-action="decrease-qty" data-id="${item.id}" aria-label="Decrease quantity">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" data-action="increase-qty" data-id="${item.id}" aria-label="Increase quantity">+</button>
          </div>
          <button class="remove-item-btn" data-action="remove-item" data-id="${item.id}">Remove</button>
        </div>
      </div>
    `;
    }).join('');
    setTimeout(checkLoadedImages, 60);
  }
}

// Order Checkout - Automatically reduces stock!
function handleCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'warning');
    return;
  }

  // Double check stock availability before processing
  const products = getProducts();
  for (const item of cart) {
    const prod = products.find(p => p.id === item.id);
    if (!prod || prod.stock < item.quantity) {
      showToast(`⚠️ Stock shortage: Only ${prod ? prod.stock : 0} units left for "${item.name}"!`, 'warning');
      return;
    }
  }

  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const grandTotal = subtotal + shipping;
  const demoOrderId = 'OTK-' + Math.floor(100000 + Math.random() * 900000);

  // REDUCE STOCK IN INVENTORY AUTOMATICALLY
  reduceProductStock(cart);

  const itemsListSnippet = cart.map(item => `
    <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-weight:600;">
      <span>${item.name} (×${item.quantity})</span>
      <strong style="color:#FF6B35;">${formatRupees(item.price * item.quantity)}</strong>
    </div>
  `).join('');

  modalOrderSummary.innerHTML = `
    <div style="font-size: 0.85rem; color: #2A9D8F; font-weight: 700; margin-bottom: 8px;">
      ORDER CONFIRMED: #${demoOrderId}
    </div>
    <div style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px dashed #F7D6C1;">
      ${itemsListSnippet}
    </div>
    <div style="display:flex; justify-content:space-between; margin-bottom: 4px; font-weight:600;">
      <span>Items Subtotal (${totalQty} item${totalQty > 1 ? 's' : ''}):</span>
      <span>${formatRupees(subtotal)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; margin-bottom: 4px; font-weight:600;">
      <span>Delivery:</span>
      <span>${shipping === 0 ? '<strong style="color:#2A9D8F;">FREE</strong>' : formatRupees(shipping)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-weight:700; font-size: 1.15rem; margin-top: 10px; padding-top: 10px; border-top: 2px solid #3B2314; color: #FF6B35;">
      <span>Total Paid:</span>
      <span>${formatRupees(grandTotal)}</span>
    </div>
    <div style="margin-top: 12px; font-size: 0.8rem; color: #2A9D8F; font-weight: 600; text-align: center;">
      ✓ Inventory stock automatically deducted in store backend!
    </div>
  `;

  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();

  // Re-render shop and admin inventory panels
  renderProducts();
  updateCategoryCounters();
  renderAdminPanel();

  closeCartDrawer();
  checkoutModalOverlay.classList.add('active');

  showToast('🎉 Order placed! Stock automatically reduced.', 'success');
}

// ==========================================================================
// 7. STORE OWNER INVENTORY MANAGEMENT PANEL
// ==========================================================================

function openAdminPanel() {
  renderAdminPanel();
  adminPanelOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
  adminPanelOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Render Admin Panel (Cards and Table)
function renderAdminPanel() {
  const products = getProducts();

  // 1. Calculate Summary Stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (parseInt(p.stock, 10) || 0), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 5).length;
  const outStockCount = products.filter(p => p.stock === 0).length;

  if (statTotalProducts) statTotalProducts.textContent = totalProducts;
  if (statTotalStock) statTotalStock.textContent = totalStock;
  if (statLowStock) statLowStock.textContent = lowStockCount;
  if (statOutStock) statOutStock.textContent = outStockCount;

  // 2. Filter Table Items
  let filtered = [...products];

  // Stock Status Filter
  if (adminActiveFilter === 'low') {
    filtered = filtered.filter(p => p.stock < 5); // Below 5 stock
  } else if (adminActiveFilter === 'out') {
    filtered = filtered.filter(p => p.stock === 0);
  } else if (adminActiveFilter === 'in') {
    filtered = filtered.filter(p => p.stock >= 5);
  }

  // Keyword Search Filter
  if (adminSearchQuery.trim() !== '') {
    const q = adminSearchQuery.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q)
    );
  }

  // 3. Render Table Rows (HIGHLIGHT ROWS WHERE STOCK < 5)
  if (!adminProductsTbody) return;

  if (filtered.length === 0) {
    adminProductsTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: #6B4E3D;">
          🔍 No inventory items found matching your filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  adminProductsTbody.innerHTML = filtered.map(p => {
    const isBelowFive = p.stock < 5; // HIGHLIGHT CRITERIA
    const isOutOfStock = p.stock === 0;

    let badgeClass = 'stock-in';
    if (p.stockType === 'low') badgeClass = 'stock-low';
    if (p.stockType === 'out') badgeClass = 'stock-out';

    const imgSrc = p.image || getDefaultImageForCategory(p.category);

    return `
      <tr class="${isBelowFive ? 'stock-warning-row' : ''}" data-product-id="${p.id}">
        <td>
          <div class="admin-thumb-box">
            <img 
              src="${escapeHtml(imgSrc)}" 
              alt="${escapeHtml(p.name)}" 
              class="admin-thumb-img" 
              loading="lazy" 
              onerror="handleThumbImageError(this)"
            >
            <div class="admin-thumb-fallback" style="display: none;">
              ${p.svgArt || '<span class="thumb-fallback-icon">🦊</span>'}
            </div>
          </div>
        </td>
        <td>
          <div class="admin-product-name-cell">
            <span class="admin-prod-title">${escapeHtml(p.name)}</span>
            <span class="admin-prod-id">ID: #${p.id} ${isBelowFive ? '⚠️ <strong style="color:#FF6B35;">Low Stock Warning!</strong>' : ''}</span>
            ${p.image ? `<span class="admin-prod-img-path" title="${escapeHtml(p.image)}">📷 ${escapeHtml(p.image)}</span>` : ''}
          </div>
        </td>
        <td>
          <span class="admin-prod-cat">${p.categoryLabel}</span>
        </td>
        <td>
          <span class="admin-prod-price">${formatRupees(p.price)}</span>
        </td>
        <td>
          <!-- Direct Stock Adjust Controls -->
          <div class="stock-adjuster">
            <button class="stock-adj-btn" data-action="admin-stock-dec" data-id="${p.id}" title="Decrease stock">−</button>
            <input 
              type="number" 
              class="stock-input-direct" 
              value="${p.stock}" 
              min="0" 
              data-id="${p.id}" 
              title="Click to edit stock directly"
            >
            <button class="stock-adj-btn" data-action="admin-stock-inc" data-id="${p.id}" title="Increase stock">+</button>
          </div>
        </td>
        <td>
          <span class="stock-badge ${badgeClass}" style="position: static;">
            <span class="stock-badge-dot"></span>
            <span>${p.stockStatus}</span>
          </span>
        </td>
        <td>
          <div class="admin-actions-cell">
            <button class="admin-action-btn btn-edit" data-action="admin-edit" data-id="${p.id}" title="Edit Product">
              ✏️ Edit
            </button>
            <button class="admin-action-btn btn-delete" data-action="admin-delete" data-id="${p.id}" title="Delete Product">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  setTimeout(checkLoadedImages, 200);
}

// Product Form Modal (Add / Edit)
function updateFormImagePreview(val, category) {
  if (!formImagePreview || !previewStatusText) return;
  const effectiveSrc = (val && val.trim()) ? val.trim() : getDefaultImageForCategory(category || 't-shirts');

  formImagePreview.onerror = () => {
    formImagePreview.style.display = 'none';
    if (!val || !val.trim()) {
      previewStatusText.innerHTML = `<span>📷 Default image: <code>${effectiveSrc}</code> (fallback illustration will be used if file not found)</span>`;
    } else {
      previewStatusText.innerHTML = `<span style="color:#FF6B35;">⚠️ Could not load image from "<code>${escapeHtml(val)}</code>". Fallback illustration will display.</span>`;
    }
  };

  formImagePreview.onload = () => {
    formImagePreview.style.display = 'block';
    if (!val || !val.trim()) {
      previewStatusText.innerHTML = `<span style="color:#2A9D8F;">✓ Using category default: <code>${effectiveSrc}</code></span>`;
    } else {
      previewStatusText.innerHTML = `<span style="color:#2A9D8F;">✓ Image loaded successfully!</span>`;
    }
  };

  formImagePreview.src = effectiveSrc;
}

function openAddProductModal() {
  productFormTitle.textContent = 'Add New Anime Product';
  formProductId.value = '';
  productForm.reset();
  formProductStock.value = '10';
  formProductPrice.value = '499';
  if (formProductImage) {
    formProductImage.value = '';
    updateFormImagePreview('', formProductCategory ? formProductCategory.value : 't-shirts');
  }
  productFormModalOverlay.classList.add('active');
}

function openEditProductModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  productFormTitle.textContent = 'Edit Anime Product';
  formProductId.value = product.id;
  formProductName.value = product.name;
  formProductCategory.value = product.category;
  formProductPrice.value = product.price;
  formProductStock.value = product.stock;
  formProductTheme.value = product.svgTheme || 'fox';
  if (formProductImage) {
    formProductImage.value = product.image || '';
    updateFormImagePreview(product.image || '', product.category);
  }
  formProductDesc.value = product.description;

  productFormModalOverlay.classList.add('active');
}

function closeProductFormModal() {
  productFormModalOverlay.classList.remove('active');
}

function handleProductFormSubmit(e) {
  e.preventDefault();

  const id = formProductId.value.trim();
  const name = formProductName.value.trim();
  const category = formProductCategory.value;
  const price = parseInt(formProductPrice.value, 10);
  const stock = parseInt(formProductStock.value, 10);
  const theme = formProductTheme.value;
  const rawImage = formProductImage ? formProductImage.value.trim() : '';
  const description = formProductDesc.value.trim();

  if (!name || isNaN(price) || isNaN(stock) || !description) {
    showToast('⚠️ Please fill all required fields.', 'warning');
    return;
  }

  const categoryLabels = {
    't-shirts': 'T-Shirts',
    'figures': 'Figures',
    'coffee mugs': 'Coffee Mugs',
    'keychains': 'Keychains',
    'posters': 'Posters'
  };
  const categoryLabel = categoryLabels[category] || 'Anime Merch';
  const resolvedImage = rawImage || getDefaultImageForCategory(category);

  if (id) {
    // Edit Existing Product
    const existing = getProductById(id);
    const updated = updateProduct(id, {
      name,
      category,
      categoryLabel,
      price,
      stock,
      image: resolvedImage,
      svgTheme: theme,
      description,
      svgArt: (existing && existing.svgArt) ? existing.svgArt : generateProductSvg(theme, name, categoryLabel)
    });
    showToast(`Updated "${name}" successfully! ✨`, 'success');
  } else {
    // Add New Product
    const newProd = addProduct({
      name,
      category,
      categoryLabel,
      price,
      stock,
      image: resolvedImage,
      svgTheme: theme,
      description,
      svgArt: generateProductSvg(theme, name, categoryLabel)
    });
    showToast(`Added new product "${name}"! 🎉`, 'success');
  }

  closeProductFormModal();
  renderAdminPanel();
  renderProducts();
  updateCategoryCounters();
}

function handleDeleteProduct(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const confirmed = confirm(`Are you sure you want to delete "${product.name}" from your store inventory?`);
  if (!confirmed) return;

  deleteProduct(productId);
  showToast(`🗑️ Deleted "${product.name}" from inventory.`, 'info');

  // Also remove from cart if present
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();

  renderAdminPanel();
  renderProducts();
  updateCategoryCounters();
}

// Quick Inline Stock Updates from Table
function handleStockQuickUpdate(productId, delta) {
  const product = getProductById(productId);
  if (!product) return;
  const newStock = Math.max(0, product.stock + delta);
  updateProductStockDirectly(productId, newStock);

  renderAdminPanel();
  renderProducts();
  showToast(`Updated stock for "${product.name}": ${newStock} units`, 'info');
}

function handleStockDirectInput(productId, newStockValue) {
  const parsed = parseInt(newStockValue, 10);
  if (isNaN(parsed) || parsed < 0) return;
  const product = updateProductStockDirectly(productId, parsed);
  if (product) {
    renderAdminPanel();
    renderProducts();
    showToast(`Stock updated to ${parsed} units`, 'info');
  }
}

// ==========================================================================
// 8. EVENT LISTENERS
// ==========================================================================

// Product Card View Toggle & Add to Cart (Main Grid)
productsGrid.addEventListener('click', (e) => {
  // 1. Photo vs Art Illustration View Toggle
  const modeBtn = e.target.closest('.view-mode-btn');
  if (modeBtn) {
    e.stopPropagation();
    if (modeBtn.classList.contains('disabled')) {
      showToast('⚠️ Real photo is unavailable for this item', 'warning');
      return;
    }
    const mode = modeBtn.getAttribute('data-mode'); // 'photo' or 'art'
    const container = modeBtn.closest('.product-image-container');
    if (!container) return;

    const img = container.querySelector('.product-image-img');
    const fallback = container.querySelector('.product-image-fallback');
    const allBtns = container.querySelectorAll('.view-mode-btn');

    if (mode === 'art') {
      allBtns.forEach(btn => btn.classList.remove('active'));
      modeBtn.classList.add('active');
      if (img) img.style.display = 'none';
      if (fallback) fallback.style.display = 'flex';
      container.setAttribute('data-current-view', 'art');
      showToast('🎨 Showing cute illustration view', 'info');
    } else {
      // Photo mode
      if (img && img.getAttribute('data-failed') === 'true') {
        showToast('⚠️ Real photo file could not be loaded', 'warning');
        return;
      }
      allBtns.forEach(btn => btn.classList.remove('active'));
      modeBtn.classList.add('active');
      if (fallback) fallback.style.display = 'none';
      if (img) img.style.display = 'block';
      container.setAttribute('data-current-view', 'photo');
      showToast('📷 Showing real product photo', 'info');
    }
    return;
  }

  // 2. Add to Cart Button
  const addBtn = e.target.closest('[data-action="add-to-cart"]');
  if (addBtn) {
    if (addBtn.disabled) {
      showToast('⚠️ This item is out of stock!', 'warning');
      return;
    }
    const id = addBtn.getAttribute('data-id');
    addToCart(id);
  }
});

// Cart Drawer Quantity & Removal
cartItemsList.addEventListener('click', (e) => {
  const incBtn = e.target.closest('[data-action="increase-qty"]');
  const decBtn = e.target.closest('[data-action="decrease-qty"]');
  const removeBtn = e.target.closest('[data-action="remove-item"]');

  if (incBtn) {
    updateCartQuantity(incBtn.getAttribute('data-id'), 1);
  } else if (decBtn) {
    updateCartQuantity(decBtn.getAttribute('data-id'), -1);
  } else if (removeBtn) {
    removeFromCart(removeBtn.getAttribute('data-id'));
  }
});

// Cart Drawer Open / Close / Clear / Checkout
cartOpenBtn.addEventListener('click', openCartDrawer);
cartCloseBtn.addEventListener('click', closeCartDrawer);
cartOverlay.addEventListener('click', closeCartDrawer);
clearCartBtn.addEventListener('click', clearCart);
checkoutBtn.addEventListener('click', handleCheckout);

modalCloseBtn.addEventListener('click', () => {
  checkoutModalOverlay.classList.remove('active');
});

checkoutModalOverlay.addEventListener('click', (e) => {
  if (e.target === checkoutModalOverlay) {
    checkoutModalOverlay.classList.remove('active');
  }
});

// Category Filter Buttons
filterTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.filter-btn');
  if (!tab) return;

  filterTabs.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  tab.classList.add('active');

  activeCategory = tab.getAttribute('data-category');
  renderProducts();
});

// Search input
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
  renderProducts();
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.style.display = 'none';
  renderProducts();
  searchInput.focus();
  showToast('Search cleared', 'info');
});

// Quick search trigger in header
searchToggleBtn.addEventListener('click', () => {
  const shopSection = document.getElementById('shop');
  if (shopSection) {
    shopSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      searchInput.focus();
    }, 400);
  }
});

// Sort select
sortSelect.addEventListener('change', (e) => {
  sortBy = e.target.value;
  renderProducts();
  if (sortBy === 'price-low') showToast('Sorted: Price Low to High', 'info');
  if (sortBy === 'price-high') showToast('Sorted: Price High to Low', 'info');
});

// Reset Filters button inside Empty State
resetFiltersBtn.addEventListener('click', () => {
  activeCategory = 'all';
  searchQuery = '';
  sortBy = 'featured';
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  sortSelect.value = 'featured';

  filterTabs.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-category') === 'all');
  });

  renderProducts();
  showToast('Filters reset', 'info');
});

// Footer category links sync
document.querySelectorAll('a[data-filter]').forEach(link => {
  link.addEventListener('click', () => {
    const category = link.getAttribute('data-filter');
    activeCategory = category;
    
    filterTabs.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-category') === category);
    });

    renderProducts();
  });
});

// Mobile Nav Menu Toggle
mobileMenuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
  });
});

// Admin Panel Open / Close
adminOpenBtn.addEventListener('click', openAdminPanel);
adminCloseBtn.addEventListener('click', closeAdminPanel);
adminPanelOverlay.addEventListener('click', (e) => {
  if (e.target === adminPanelOverlay) {
    closeAdminPanel();
  }
});

// Admin Table Search
if (adminSearchInput) {
  adminSearchInput.addEventListener('input', (e) => {
    adminSearchQuery = e.target.value;
    renderAdminPanel();
  });
}

// Admin Table Filter Pills
adminFilterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    adminFilterPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    adminActiveFilter = pill.getAttribute('data-admin-filter');
    renderAdminPanel();
  });
});

// Admin Table Event Delegation (Stock Inc/Dec, Direct Input, Edit, Delete)
if (adminProductsTbody) {
  adminProductsTbody.addEventListener('click', (e) => {
    const incBtn = e.target.closest('[data-action="admin-stock-inc"]');
    const decBtn = e.target.closest('[data-action="admin-stock-dec"]');
    const editBtn = e.target.closest('[data-action="admin-edit"]');
    const delBtn = e.target.closest('[data-action="admin-delete"]');

    if (incBtn) {
      handleStockQuickUpdate(incBtn.getAttribute('data-id'), 1);
    } else if (decBtn) {
      handleStockQuickUpdate(decBtn.getAttribute('data-id'), -1);
    } else if (editBtn) {
      openEditProductModal(editBtn.getAttribute('data-id'));
    } else if (delBtn) {
      handleDeleteProduct(delBtn.getAttribute('data-id'));
    }
  });

  adminProductsTbody.addEventListener('change', (e) => {
    if (e.target.classList.contains('stock-input-direct')) {
      const id = e.target.getAttribute('data-id');
      handleStockDirectInput(id, e.target.value);
    }
  });
}

// Product Form Modal Handlers
openAddProductModalBtn.addEventListener('click', openAddProductModal);
productFormCloseBtn.addEventListener('click', closeProductFormModal);
productFormCancelBtn.addEventListener('click', closeProductFormModal);
productFormModalOverlay.addEventListener('click', (e) => {
  if (e.target === productFormModalOverlay) {
    closeProductFormModal();
  }
});
productForm.addEventListener('submit', handleProductFormSubmit);

// Admin Product Form Live Image Preview Listeners
if (formProductImage) {
  formProductImage.addEventListener('input', (e) => {
    updateFormImagePreview(e.target.value.trim(), formProductCategory ? formProductCategory.value : 't-shirts');
  });
}

if (formProductCategory) {
  formProductCategory.addEventListener('change', (e) => {
    if (!formProductImage || !formProductImage.value.trim()) {
      updateFormImagePreview('', e.target.value);
    }
  });
}

// Contact Form submission
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !subject || !message) {
      showToast('⚠️ Please fill in all required fields.', 'warning');
      return;
    }

    showToast(`💌 Arigatou ${name}! Message sent successfully!`, 'success');
    contactForm.reset();
  });
}

// Global Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCartDrawer();
    checkoutModalOverlay.classList.remove('active');
    closeAdminPanel();
    closeProductFormModal();
  }
});

// ==========================================================================
// 8B. HERO PRODUCT SHOWCASE CAROUSEL & NAVIGATION
// ==========================================================================
function scrollToProduct(productId) {
  if (!productId) return;
  const product = getProductById(productId);

  // If filtered out or searched, reset to ensure target card is rendered in DOM
  let needsReRender = false;
  if (activeCategory !== 'all' && product && activeCategory !== product.category) {
    activeCategory = 'all';
    if (filterTabs) {
      filterTabs.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-category') === 'all');
      });
    }
    needsReRender = true;
  }

  if (searchQuery.trim() !== '') {
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    needsReRender = true;
  }

  if (needsReRender) {
    renderProducts();
  }

  // Allow DOM to settle before scrolling
  setTimeout(() => {
    const targetCard = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Visual feedback: animate pulse
      targetCard.classList.remove('highlight-pulse');
      void targetCard.offsetWidth; // trigger reflow
      targetCard.classList.add('highlight-pulse');
      
      const prodName = product ? product.name : 'product';
      showToast(`✨ Found "${prodName}" in the shop!`, 'info');
    } else {
      const shopSection = document.getElementById('shop');
      if (shopSection) {
        shopSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, needsReRender ? 140 : 30);
}

function initHeroCarousel() {
  const track = document.getElementById('heroCarouselTrack');
  const dotsContainer = document.getElementById('heroCarouselDots');
  const card = document.getElementById('heroCarouselCard');
  const prevBtn = document.getElementById('heroPrevBtn');
  const nextBtn = document.getElementById('heroNextBtn');

  if (!track || !dotsContainer) return;

  const slides = track.querySelectorAll('.hero-slide');
  const dots = dotsContainer.querySelectorAll('.carousel-dot');
  const totalSlides = slides.length;
  if (totalSlides === 0) return;

  let currentIndex = 0;
  let autoSlideTimer = null;
  const SLIDE_INTERVAL_MS = 3000; // 3 seconds interval per user request

  function goToSlide(index) {
    currentIndex = (index + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentIndex);
    });

    dots.forEach((dot, idx) => {
      const isActive = idx === currentIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, SLIDE_INTERVAL_MS);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  // Dots click navigation
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetIndex = parseInt(dot.getAttribute('data-slide-index'), 10);
      if (!isNaN(targetIndex)) {
        goToSlide(targetIndex);
        startAutoSlide(); // restart 3s timer
      }
    });
  });

  // Prev & Next Buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentIndex - 1);
      startAutoSlide();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentIndex + 1);
      startAutoSlide();
    });
  }

  // Pause on hover
  if (card) {
    card.addEventListener('mouseenter', stopAutoSlide);
    card.addEventListener('mouseleave', startAutoSlide);
  }

  // Touch swipe support for mobile
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoSlide();
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToSlide(currentIndex + 1); // swiped left -> next
      } else {
        goToSlide(currentIndex - 1); // swiped right -> prev
      }
    }
    startAutoSlide();
  }, { passive: true });

  // Click on slide to scroll to that product in shop
  track.addEventListener('click', (e) => {
    const slide = e.target.closest('.hero-slide');
    if (!slide) return;
    const productId = slide.getAttribute('data-product-id');
    if (productId) {
      scrollToProduct(productId);
    }
  });

  // Start auto-sliding on initialization
  startAutoSlide();
}

// ==========================================================================
// 9. INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  getProducts(); // Initialize default inventory if not present
  updateCategoryCounters();
  renderProducts();
  updateCartUI();
  initHeroCarousel(); // Initialize auto-sliding hero showcase carousel
});
