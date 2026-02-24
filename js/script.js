(() => {
  const CART_STORAGE_KEY = 'cart';
  const HST_RATE = 0.13;
  const CART_CONFIRM_TEXT = 'Added to Cart!';
  const CART_CONFIRM_SUBTEXT = 'Go to your Cart to view your items!';
  const PRODUCT_PRICES = {
    'Kodi Box': 250,
    'Basic Android Box': 135,
    'Premium Android Box': 225,
    Keyboard: 30,
    'Mini Keyboard': 30,
    Remote: 30,
    'SD Card': 25,
    'HDMI Cord Replacement': 30,
    'Power Cord Replacement': 30,
  };
  const PRODUCT_TAX_STATUS = {
    'Kodi Box': 'plus_tax',
    'Basic Android Box': 'plus_tax',
    'Premium Android Box': 'plus_tax',
    Keyboard: 'plus_tax',
    'Mini Keyboard': 'plus_tax',
    Remote: 'plus_tax',
    'Power Cord Replacement': 'tax_included',
    'SD Card': 'tax_included',
    'HDMI Cord Replacement': 'tax_included',
  };

  function safeGetCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function safeSetCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      return true;
    } catch (error) {
      console.error('Failed to save cart to localStorage', error);
      return false;
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getUnitPrice(productName, storedPrice) {
    const normalizedStoredPrice = Number(storedPrice);
    if (Number.isFinite(normalizedStoredPrice) && normalizedStoredPrice >= 0) {
      return normalizedStoredPrice;
    }

    const fallbackPrice = Number(PRODUCT_PRICES[productName]);
    return Number.isFinite(fallbackPrice) && fallbackPrice >= 0 ? fallbackPrice : 0;
  }

  function normalizeTaxStatus(productName, storedTaxStatus) {
    const normalized = String(storedTaxStatus || '').toLowerCase();
    if (normalized.includes('plus') && normalized.includes('tax')) return 'plus_tax';
    if (normalized.includes('tax') && normalized.includes('included')) return 'tax_included';
    return PRODUCT_TAX_STATUS[productName] || 'tax_included';
  }

  function formatMoney(value) {
    const normalizedValue = Number(value);
    return `$${(Number.isFinite(normalizedValue) ? normalizedValue : 0).toFixed(2)}`;
  }

  function ensureCartConfirmationModal() {
    let overlay = document.getElementById('cartConfirmModal');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'cartConfirmModal';
    overlay.className = 'cart-confirmation-overlay';
    overlay.innerHTML = `
      <div class="cart-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="cartConfirmTitle" aria-describedby="cartConfirmBody">
        <h2 id="cartConfirmTitle">${CART_CONFIRM_TEXT}</h2>
        <p id="cartConfirmBody">${CART_CONFIRM_SUBTEXT}</p>
        <button id="cartConfirmCloseBtn" type="button" class="social-btn email">Continue</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#cartConfirmCloseBtn');
    closeBtn?.addEventListener('click', () => {
      overlay.classList.remove('is-open');
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        overlay.classList.remove('is-open');
      }
    });

    return overlay;
  }

  function showCartConfirmation() {
    const overlay = ensureCartConfirmationModal();
    overlay.classList.add('is-open');
  }

  function renderCart() {
    const root = document.getElementById('cart-root');
    if (!root) return;

    const cart = safeGetCart();
    const totalItems = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    if (cart.length === 0) {
      root.innerHTML = `
        <section class="cart-panel" aria-live="polite">
          <h2>Your Cart</h2>
          <p>Your cart is currently empty.</p>
        </section>`;
      return;
    }

    let subtotal = 0;
    let tax = 0;

    const itemsHtml = cart
      .map((item) => {
        const qty = Number(item.qty) || 0;
        const unitPrice = getUnitPrice(item.name, item.price);
        const lineTotal = unitPrice * qty;
        const taxStatus = normalizeTaxStatus(item.name, item.taxStatus);

        subtotal += lineTotal;
        if (taxStatus === 'plus_tax') {
          tax += lineTotal * HST_RATE;
        }

        const taxLabel = taxStatus === 'plus_tax' ? '+ HST' : 'Tax Included';

        return `
      <li class="cart-item-row">
        <div class="cart-item-main">
          <strong class="cart-item-name">${escapeHtml(item.name)}</strong>
          <span class="cart-item-meta">Unit: ${formatMoney(unitPrice)} · Qty: ${qty} · Line Total: ${formatMoney(lineTotal)} · ${taxLabel}</span>
        </div>
      </li>`;
      })
      .join('');

    const total = subtotal + tax;

    root.innerHTML = `
      <section class="cart-panel" aria-live="polite">
        <div class="cart-header-row">
          <h2>Your Cart</h2>
          <p class="cart-total">Total items: <span id="cart-total-count">${totalItems}</span></p>
        </div>
        <ul class="cart-items-list">${itemsHtml}</ul>
        <div class="cart-summary" aria-live="polite">
          <p><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></p>
          <p><span>HST (13%)</span><strong>${formatMoney(tax)}</strong></p>
          <p class="cart-summary-total"><span>Total</span><strong>${formatMoney(total)}</strong></p>
        </div>
        <div class="cart-actions">
          <a href="products.html" class="social-btn email">Back to Products</a>
          <button id="clear-cart-btn" type="button" class="social-btn cart-clear-btn">Clear Cart</button>
          <a href="payment-unavailable.html" class="social-btn checkout-btn">Checkout</a>
        </div>
      </section>
    `;

    const clearBtn = document.getElementById('clear-cart-btn');
    if (!clearBtn) return;

    clearBtn.addEventListener('click', () => {
      localStorage.removeItem(CART_STORAGE_KEY);
      renderCart();
    });
  }

  function setupCartAddButtons() {
    document.body.addEventListener('click', (event) => {
      const btn = event.target.closest?.('.add-cart-btn');
      if (!btn) return;

      event.preventDefault();
      event.stopPropagation();

      const productName = btn.getAttribute('data-product') || 'Unnamed Product';
      const unitPrice = getUnitPrice(productName);
      const taxStatus = normalizeTaxStatus(productName);
      const cart = safeGetCart();
      const existing = cart.find((item) => item.name === productName);

      if (existing) {
        existing.qty = (Number(existing.qty) || 0) + 1;
        existing.price = getUnitPrice(existing.name, existing.price);
        existing.taxStatus = normalizeTaxStatus(existing.name, existing.taxStatus);
      } else {
        cart.push({ name: productName, qty: 1, price: unitPrice, taxStatus });
      }

      safeSetCart(cart);
      showCartConfirmation();
      console.log(`Added to cart: ${productName}`);
    });
  }

  function setupProductModal() {
    const modal = document.getElementById('productModal');
    const modalImage = document.getElementById('modalImage');
    const modalName = document.getElementById('modalName');
    const modalPrice = document.getElementById('modalPrice');
    const modalDescription = document.getElementById('modalDescription');
    const closeModal = document.querySelector('.close-modal');

    window.openProductModal = (imageSrc, name, price, description) => {
      if (!modal || !modalImage || !modalName || !modalPrice || !modalDescription) return;
      modal.style.display = 'flex';
      modalImage.src = imageSrc;
      modalName.textContent = name;
      modalPrice.textContent = price;
      modalDescription.textContent = description;
    };

    if (closeModal && modal) {
      closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      window.addEventListener('click', (event) => {
        if (event.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupProductModal();
    setupCartAddButtons();
    renderCart();
  });
})();