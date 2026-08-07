/* ==========================================================================
   FLEVA Admin — Shared JavaScript
   ========================================================================== */
const API_BASE = '/api/v1';

function getAdminToken() {
  return sessionStorage.getItem('fleva_admin_access_token') || '';
}

function getAdminUser() {
  try { return JSON.parse(sessionStorage.getItem('fleva_admin_user')); }
  catch (e) { return null; }
}

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAdminToken()}`,
  };
}

async function adminFetch(url, options = {}) {
  options.headers = { ...adminHeaders(), ...(options.headers || {}) };
  
  if (options.body instanceof FormData) {
    delete options.headers['Content-Type'];
  }
  
  options.credentials = 'include';

  let res = await fetch(url, options);

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      sessionStorage.setItem('fleva_admin_access_token', data.accessToken);
      options.headers['Authorization'] = `Bearer ${data.accessToken}`;
      res = await fetch(url, options);
    } else {
      // Redirect to login
      location.href = '/admin/';
      return;
    }
  }

  return res;
}

// Check admin auth on page load
function requireAdmin() {
  const user = getAdminUser();
  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    location.href = '/admin/';
    return false;
  }
  return true;
}

function renderSidebar() {
  const user = getAdminUser();
  const page = location.pathname.split('/').pop().replace('.html', '');

  return `
  <aside class="admin-sidebar">
    <div class="sidebar-logo">FLEVA<span> Admin</span></div>
    <nav>
      <a href="dashboard.html" class="${page === 'dashboard' ? 'active' : ''}">📊 <span>Dashboard</span></a>
      <a href="products.html" class="${page === 'products' ? 'active' : ''}">📦 <span>Products</span></a>
      <a href="orders.html" class="${page === 'orders' ? 'active' : ''}">🛒 <span>Orders</span></a>
      <a href="customers.html" class="${page === 'customers' ? 'active' : ''}">👥 <span>Customers</span></a>
      <a href="storefront.html" class="${page === 'storefront' ? 'active' : ''}">🎨 <span>Storefront</span></a>
      <a href="banners.html" class="${page === 'banners' ? 'active' : ''}">🖼️ <span>Banners</span></a>
      <a href="coupons.html" class="${page === 'coupons' ? 'active' : ''}">🏷️ <span>Coupons</span></a>
      <a href="analytics.html" class="${page === 'analytics' ? 'active' : ''}">📈 <span>Analytics</span></a>
      <a href="/" target="_blank" style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">🌐 <span>Fleva World</span></a>
    </nav>
  </aside>`;
}

function renderHeaderUser() {
  const user = getAdminUser();
  const headerUserEl = document.getElementById('header-user');
  if (headerUserEl) {
    headerUserEl.innerHTML = `
      <div class="header-user-info">
        <span class="u-name">${user?.name || 'Admin'}</span>
        <span class="u-role">${user?.role || 'admin'}</span>
      </div>
      <button onclick="adminLogout()" class="btn-logout" title="Sign Out">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('current-date')) {
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  renderHeaderUser();
});

async function adminLogout() {
  try {
    await adminFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch (e) {}
  sessionStorage.removeItem('fleva_admin_access_token');
  sessionStorage.removeItem('fleva_admin_user');
  location.href = '/admin/';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    'pending': 'badge-pending', 'confirmed': 'badge-confirmed',
    'packed': 'badge-confirmed', 'shipped': 'badge-shipped',
    'out-for-delivery': 'badge-shipped', 'delivered': 'badge-delivered',
    'cancelled': 'badge-cancelled', 'returned': 'badge-cancelled',
    'refunded': 'badge-cancelled', 'in-stock': 'badge-in-stock',
    'out-of-stock': 'badge-out-of-stock', 'hidden': 'badge-cancelled',
    'upcoming': 'badge-shipped', 'pre-order': 'badge-confirmed'
  };
  return `<span class="badge ${map[status] || 'badge-pending'}">${status}</span>`;
}
