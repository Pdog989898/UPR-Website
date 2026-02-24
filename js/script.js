// PRODUCT MODAL
const modal = document.getElementById("productModal");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalPrice = document.getElementById("modalPrice");
const modalDescription = document.getElementById("modalDescription");
const closeModal = document.querySelector(".close-modal");

// Open modal when clicking on product
function openProductModal(imageSrc, name, price, description) {
  modal.style.display = "flex";
  modalImage.src = imageSrc;
  modalName.innerHTML = name;
  modalPrice.innerHTML = price;
  modalDescription.innerHTML = description;
}

// Close modal
closeModal.onclick = () => {
  modal.style.display = "none";
};

// Close modal if clicking outside the content
window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Add to Cart button handler (logs "Added to cart" and prevents navigation)
document.addEventListener('DOMContentLoaded', function () {
  // Single delegated click listener for all Add to Cart buttons
  document.body.addEventListener('click', function (e) {
    const btn = e.target.closest && e.target.closest('.add-cart-btn');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();
    const productName = btn.getAttribute('data-product') || 'Unnamed Product';

    // Read existing cart from localStorage (safe parse)
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (!Array.isArray(cart)) cart = [];
    } catch (err) {
      cart = [];
    }

    // Find product and increase quantity if present
    const existing = cart.find(item => item.name === productName);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({ name: productName, qty: 1 });
    }

    // Persist updated cart
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage', err);
    }

    console.log('Added to cart: ' + productName);
  });
});

  // Renders the cart contents into an element with id "cart-root"
  function renderCart() {
    const root = document.getElementById('cart-root');
    if (!root) return;

    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (!Array.isArray(cart)) cart = [];
    } catch (err) {
      cart = [];
    }

    // Total items
    const total = cart.reduce((s, item) => s + (item.qty || 0), 0);

    if (cart.length === 0) {
      root.innerHTML = `
        <div style="text-align:center;">
          <h2>Your Cart</h2>
          <p>Your cart is currently empty.</p>
        </div>`;
      const countEl = document.getElementById('cart-total-count'); if (countEl) countEl.textContent = '0';
      return;
    }

    // Build list HTML
    const itemsHtml = cart.map(item => `
      <li style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;">
        <span>${escapeHtml(item.name)}</span>
        <strong>x ${item.qty}</strong>
      </li>
    `).join('');

    root.innerHTML = `
      <div style="max-width:900px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <h2>Your Cart</h2>
          <div style="font-weight:bold;">Total items: <span id="cart-total-count">${total}</span></div>
        </div>
        <ul style="list-style:none;padding:0;margin-top:15px;">${itemsHtml}</ul>
        <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
          <a href="products.html" class="social-btn email">Back to Products</a>
          <button id="clear-cart-btn" class="social-btn" style="background:#6c757d;color:#fff;border-radius:8px;padding:8px 12px;border:none;">Clear Cart</button>
        </div>
      </div>
    `;

    const countEl = document.getElementById('cart-total-count'); if (countEl) countEl.textContent = String(total);

    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        localStorage.removeItem('cart');
        renderCart();
      });
    }
  }

  // Simple HTML escape to avoid injection through product names
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Auto-render cart on pages with cart-root present
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('cart-root')) renderCart();
  });