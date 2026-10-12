/**
 * Portal Open Data BMKG — Common Utilities & Interface Handlers
 * Modules: Realtime Clock, Toast Feedback, Smooth Scroll, ScrollSpy, ScrollReveal, Modal Auth.
 */

// ==========================================================================
// 1. HTML ESCAPING UTILITY
// ==========================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================================================
// 2. TOAST NOTIFICATION SYSTEM
// ==========================================================================
let _bmkgToastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toastFeedback');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.add('show');

  if (_bmkgToastTimer) clearTimeout(_bmkgToastTimer);
  _bmkgToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// ==========================================================================
// 3. REAL-TIME CLOCK MODULE (WIB / WITA / WIT / UTC)
// ==========================================================================
function initRealtimeClock() {
  const timeElem = document.getElementById('liveClockTime');
  const dateElem = document.getElementById('liveClockDate');
  if (!timeElem || !dateElem) return;

  function updateClock() {
    const now = new Date();
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    dateElem.textContent = now.toLocaleDateString('id-ID', dateOptions);

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    let tz = 'WIB';
    const offset = -now.getTimezoneOffset() / 60;
    if (offset === 8) tz = 'WITA';
    else if (offset === 9) tz = 'WIT';
    else if (offset !== 7) tz = `UTC${offset >= 0 ? '+' : ''}${offset}`;

    timeElem.textContent = `${hours}:${minutes}:${seconds} ${tz}`;
  }

  updateClock();
  if (!window._bmkgClockInterval) {
    window._bmkgClockInterval = setInterval(updateClock, 1000);
  }
}

// ==========================================================================
// 4. BUTTER-SMOOTH COMPOSITOR SCROLL & NAVBAR SYNCHRONIZER
// ==========================================================================
function softScrollTo(targetY) {
  window.scrollTo({
    top: targetY,
    behavior: 'smooth'
  });
}

function updateActiveNavbarLink(activeLink) {
  document.querySelectorAll('.primary-nav a').forEach(a => a.classList.remove('active'));
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

function initNavbarSoftScroll() {
  const navLinks = document.querySelectorAll('.primary-nav a, .brand-section, a[href*="#"]');

  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href) return;

      // Skip normal page transitions to other pages
      if (href.startsWith('http') && !href.includes(window.location.host)) return;
      if (href.includes('/dataset') || (href.includes('katalog.html') && !window.location.pathname.includes('katalog.html'))) return;

      // Handle Beranda / Logo click (smooth scroll back to top)
      const isHomeClick = this.classList.contains('brand-section') ||
        (!href.includes('#') && (href === '/' || href === 'index.html' || href === '#' || href === 'index.html#'));

      if (isHomeClick) {
        e.preventDefault();
        softScrollTo(0);
        const homeLink = document.querySelector('.primary-nav a:not([href*="#"])') || document.querySelector('.primary-nav a');
        updateActiveNavbarLink(homeLink);
        return;
      }

      // Handle in-page anchor links (#pilar, #peta, #datastore, etc.)
      const hashIdx = href.indexOf('#');
      if (hashIdx !== -1) {
        const targetId = href.substring(hashIdx);
        if (targetId.length > 1) {
          const targetElem = document.querySelector(targetId);
          if (targetElem) {
            e.preventDefault();
            const header = document.querySelector('.site-header');
            const headerOffset = header ? header.offsetHeight + 16 : 85;
            const targetY = Math.max(0, targetElem.getBoundingClientRect().top + window.pageYOffset - headerOffset);

            softScrollTo(targetY);
            updateActiveNavbarLink(this);

            // Soft highlight pulse on the landed section
            targetElem.classList.remove('section-soft-pulse');
            void targetElem.offsetWidth; // force reflow
            targetElem.classList.add('section-soft-pulse');
            setTimeout(() => {
              targetElem.classList.remove('section-soft-pulse');
            }, 1400);
          }
        }
      }
    });
  });

  // Throttled ScrollSpy with requestAnimationFrame
  let isScrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!isScrollTicking) {
      window.requestAnimationFrame(() => {
        const sections = [
          { id: 'pilar', link: document.querySelector('.primary-nav a[href$="#pilar"]') },
          { id: 'peta', link: document.querySelector('.primary-nav a[href$="#peta"]') }
        ];

        const scrollPos = window.pageYOffset + 150;
        let matched = false;

        for (let i = sections.length - 1; i >= 0; i--) {
          const sec = document.getElementById(sections[i].id);
          if (sec && scrollPos >= sec.offsetTop) {
            if (sections[i].link) updateActiveNavbarLink(sections[i].link);
            matched = true;
            break;
          }
        }

        if (!matched && window.pageYOffset < 350) {
          const homeLink = document.querySelector('.primary-nav a:not([href*="#"])') || document.querySelector('.primary-nav a');
          if (homeLink) updateActiveNavbarLink(homeLink);
        }
        isScrollTicking = false;
      });
      isScrollTicking = true;
    }
  }, { passive: true });
}

// ==========================================================================
// 5. SCROLL REVEAL / POP-UP ANIMATIONS (INTERSECTION OBSERVER)
// ==========================================================================
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.scroll-reveal');
  if (!revealElements.length) return;

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.05,
    rootMargin: '0px 0px -20px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

// ==========================================================================
// 6. MODAL LOGIN & AUTHENTICATION CONTROLLER
// ==========================================================================
function openLoginModal(mode = 'login') {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  switchAuthMode(mode);
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function handleModalBackdropClick(e) {
  if (e.target.id === 'loginModal') {
    closeLoginModal();
  }
}

function switchAuthMode(mode) {
  const tabLogin = document.getElementById('mainTabLogin');
  const tabRegister = document.getElementById('mainTabRegister');
  const formLogin = document.getElementById('authFormLogin');
  const formRegister = document.getElementById('authFormRegister');
  const headerTitle = document.getElementById('modalHeaderTitle');
  const headerSubtitle = document.getElementById('modalHeaderSubtitle');

  if (mode === 'login') {
    if (tabLogin) tabLogin.classList.add('active');
    if (tabRegister) tabRegister.classList.remove('active');
    if (formLogin) formLogin.style.display = 'block';
    if (formRegister) formRegister.style.display = 'none';
    if (headerTitle) headerTitle.textContent = 'Portal Data BMKG';
    if (headerSubtitle) headerSubtitle.textContent = 'Akses SSO Resmi & Akun Terbuka Publik';
    setTimeout(() => {
      const idInput = document.getElementById('loginIdentifier');
      if (idInput) idInput.focus();
    }, 100);
  } else {
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabRegister) tabRegister.classList.add('active');
    if (formLogin) formLogin.style.display = 'none';
    if (formRegister) formRegister.style.display = 'block';
    if (headerTitle) headerTitle.textContent = 'Registrasi Akun Data Terbuka';
    if (headerSubtitle) headerSubtitle.textContent = 'Dapatkan Akses API Key & Unduh Dataset Skala Besar';
    setTimeout(() => {
      const nameInput = document.getElementById('regName');
      if (nameInput) nameInput.focus();
    }, 100);
  }
}

function switchLoginTab(tab) {
  const tabAsn = document.getElementById('tabLoginAsn');
  const tabPublic = document.getElementById('tabLoginPublic');
  const labelId = document.getElementById('labelIdentifier');
  const inputId = document.getElementById('loginIdentifier');
  const btnText = document.getElementById('btnLoginText');

  if (tab === 'asn') {
    if (tabAsn) tabAsn.classList.add('active');
    if (tabPublic) tabPublic.classList.remove('active');
    if (labelId) labelId.textContent = 'NIP / Akun Email BMKG';
    if (inputId) inputId.placeholder = 'contoh: 19900815... atau nama@bmkg.go.id';
    if (btnText) btnText.textContent = 'Masuk via SSO BMKG';
  } else {
    if (tabAsn) tabAsn.classList.remove('active');
    if (tabPublic) tabPublic.classList.add('active');
    if (labelId) labelId.textContent = 'Email / Username Terdaftar';
    if (inputId) inputId.placeholder = 'contoh: pengguna@domain.com';
    if (btnText) btnText.textContent = 'Masuk Portal Publik';
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

function checkPasswordStrength(val) {
  const fill = document.getElementById('pwdStrengthFill');
  const text = document.getElementById('pwdStrengthText');
  if (!fill || !text) return;

  if (!val || val.length === 0) {
    fill.style.width = '0%';
    fill.style.backgroundColor = '#cbd5e1';
    text.textContent = 'Kekuatan sandi: minimal 8 karakter';
    text.style.color = 'var(--text-muted)';
    return;
  }

  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  if (score <= 1) {
    fill.style.width = '25%';
    fill.style.backgroundColor = '#ef4444';
    text.textContent = 'Kekuatan: Lemah (tambahkan angka & huruf kapital)';
    text.style.color = '#ef4444';
  } else if (score === 2) {
    fill.style.width = '60%';
    fill.style.backgroundColor = '#f59e0b';
    text.textContent = 'Kekuatan: Sedang (tambahkan simbol atau angka)';
    text.style.color = '#d97706';
  } else {
    fill.style.width = '100%';
    fill.style.backgroundColor = '#10b981';
    text.textContent = 'Kekuatan: Sangat Kuat 👍';
    text.style.color = '#059669';
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  closeLoginModal();
  showToast('Login Administrator Berhasil! Mengalihkan ke halaman ckan-admin...');
  setTimeout(() => {
    window.location.href = '/ckan-admin';
  }, 700);
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regName') ? document.getElementById('regName').value : 'Pengguna';
  const email = document.getElementById('regEmail') ? document.getElementById('regEmail').value : '';
  const p1 = document.getElementById('regPassword') ? document.getElementById('regPassword').value : '';
  const p2 = document.getElementById('regPasswordConfirm') ? document.getElementById('regPasswordConfirm').value : '';

  if (p1 !== p2) {
    showToast('Konfirmasi kata sandi tidak cocok! Silakan periksa kembali.');
    const confirmInput = document.getElementById('regPasswordConfirm');
    if (confirmInput) confirmInput.focus();
    return;
  }

  closeLoginModal();
  showToast(`Registrasi Berhasil! Selamat datang, ${name}. Cek ${email} untuk aktivasi API Key.`);
  const form = document.getElementById('registerForm');
  if (form) form.reset();
  checkPasswordStrength('');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLoginModal();
  }
});
