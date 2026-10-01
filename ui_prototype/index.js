/**
 * Portal Open Data BMKG — Modul Halaman Beranda (Home Page)
 * File: ui_prototype/index.js
 * 
 * Pengganti murni dari index.html.
 * Menghasilkan tampilan Beranda Portal Data BMKG secara dinamis melalui JavaScript,
 * sehingga berkas index.html statis tidak lagi diperlukan.
 */

function renderIndexPage() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Data BMKG — Katalog Data Terbuka Resmi</title>
  
  <!-- Typography: Plus Jakarta Sans & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Font Awesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <!-- Leaflet Map CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>

  <style>
    :root {
      --bmkg-blue-deep: #003865;
      --bmkg-blue: #005a9e;
      --bmkg-blue-light: #0070ba;
      --bmkg-blue-subtle: #e8f1f8;
      --bmkg-blue-hover: #002b4d;
      
      --bmkg-green: #00875a;
      --bmkg-green-light: #e3fcef;
      --bmkg-green-dark: #006644;
      --bmkg-green-glow: rgba(0, 135, 90, 0.25);
      
      --alert-amber: #b76e00;
      --alert-amber-light: #fff0d4;
      --seismic-red: #c92a2a;
      --seismic-red-light: #ffe3e3;
      
      --canvas-white: #ffffff;
      --canvas-subtle: #f8fafc;
      --canvas-surface: #f1f5f9;
      
      --text-main: #0f172a;
      --text-secondary: #334155;
      --text-muted: #64748b;
      --text-caption: #94a3b8;
      
      --border-light: #e2e8f0;
      --border-medium: #cbd5e1;
      --border-focus: #005a9e;
      
      --radius-sm: 4px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --radius-xl: 16px;

      --transition-bounce: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      --transition-smooth: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      --shadow-sm: 0 2px 6px rgba(0, 56, 101, 0.05);
      --shadow-md: 0 6px 18px rgba(0, 56, 101, 0.08);
      --shadow-lg: 0 12px 28px rgba(0, 56, 101, 0.12);
    }

    html {
      scroll-behavior: smooth;
      scroll-padding-top: 90px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* Highlight pulse when navigated via soft scroll */
    @keyframes sectionSoftPulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 90, 158, 0.45); }
      50% { box-shadow: 0 0 0 12px rgba(0, 90, 158, 0.12); }
      100% { box-shadow: 0 0 0 0 rgba(0, 90, 158, 0); }
    }

    .section-soft-pulse {
      animation: sectionSoftPulse 1.2s ease-out;
      border-radius: var(--radius-lg);
    }

    /* ==========================================================================
       SCROLL REVEAL / POP-UP ANIMATIONS SAAT SCROLL (60 FPS OPTIMIZED)
       ========================================================================== */
    .scroll-reveal {
      opacity: 0;
      transform: translateY(22px);
      transition: opacity 0.45s ease-out, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .scroll-reveal.revealed {
      opacity: 1;
      transform: translateY(0);
    }

    .stagger-1 { transition-delay: 0.04s; }
    .stagger-2 { transition-delay: 0.08s; }
    .stagger-3 { transition-delay: 0.12s; }
    .stagger-4 { transition-delay: 0.16s; }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--canvas-white);
      color: var(--text-main);
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }

    /* ==========================================================================
       BUTTON & INTERACTIVE MICRO-ANIMATIONS
       ========================================================================== */
    .btn-interactive {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      font-family: inherit;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid transparent;
      outline: none;
      position: relative;
      overflow: hidden;
      transition: var(--transition-bounce);
    }

    .btn-interactive:active {
      transform: scale(0.96) !important;
    }

    .btn-interactive::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: width 0.4s ease-out, height 0.4s ease-out, opacity 0.4s ease-out;
    }

    .btn-interactive:active::after {
      width: 250%;
      height: 250%;
      opacity: 1;
      transition: 0s;
    }

    /* Top Government Identity Bar */
    .gov-identity-bar {
      background-color: var(--bmkg-blue-deep);
      color: #ffffff;
      font-size: 0.8rem;
      padding: 0.45rem 2rem;
      border-bottom: 2px solid var(--bmkg-green);
    }

    .gov-identity-inner {
      max-width: 1240px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .gov-title {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .gov-badge {
      background-color: rgba(255, 255, 255, 0.18);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }

    .gov-links {
      display: flex;
      gap: 1.25rem;
    }

    .gov-links a {
      color: #cbd5e1;
      text-decoration: none;
      transition: color 0.15s, transform 0.15s;
      display: inline-block;
    }

    .gov-links a:hover {
      color: #ffffff;
      transform: translateY(-1px);
    }

    /* Main Navigation Header */
    header.site-header {
      background: var(--canvas-white);
      border-bottom: 1px solid var(--border-light);
      padding: 0.9rem 2rem;
      position: sticky;
      top: 0;
      z-index: 1200;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
    }

    .site-header-inner {
      max-width: 1240px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      text-decoration: none;
      color: inherit;
    }

    .bmkg-official-logo {
      width: 48px;
      height: 56px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .brand-section:hover .bmkg-official-logo {
      transform: scale(1.08) rotate(3deg);
    }

    .bmkg-official-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 56, 101, 0.15));
    }

    .brand-names {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--bmkg-blue-deep);
      line-height: 1.15;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .brand-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    nav.primary-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    nav.primary-nav a {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.92rem;
      font-weight: 600;
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-md);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    nav.primary-nav a:hover {
      color: var(--bmkg-blue);
      background-color: var(--bmkg-blue-subtle);
      transform: translateY(-1px);
    }

    nav.primary-nav a.active {
      color: var(--bmkg-blue-deep);
      background-color: var(--bmkg-blue-subtle);
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0, 56, 101, 0.08);
    }

    .header-action-btn {
      background-color: var(--bmkg-green);
      color: #ffffff;
      padding: 0.55rem 1.2rem;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      box-shadow: 0 2px 8px var(--bmkg-green-glow);
    }

    .header-action-btn:hover {
      background-color: var(--bmkg-green-dark);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--bmkg-green-glow);
    }

    .header-login-btn {
      background-color: var(--canvas-white);
      color: var(--bmkg-blue-deep);
      border: 1.5px solid var(--border-medium);
      padding: 0.5rem 1.1rem;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      font-weight: 700;
      box-shadow: var(--shadow-sm);
      transition: var(--transition-bounce);
    }

    .header-login-btn:hover {
      background-color: var(--bmkg-blue-subtle);
      border-color: var(--bmkg-blue);
      color: var(--bmkg-blue);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    /* Modal Dialog Login BMKG (Pure Frosted Blur, Sama Sekali Tidak Hitam) */
    .bmkg-modal-overlay,
    .modal-backdrop,
    #loginModal {
      position: fixed !important;
      inset: 0 !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background-color: transparent !important;
      background: rgba(255, 255, 255, 0.18) !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      z-index: 999999 !important;
      display: none;
      align-items: center !important;
      justify-content: center !important;
      padding: 1rem !important;
      box-sizing: border-box !important;
      opacity: 0;
      transition: opacity 0.22s ease-in-out;
    }

    .bmkg-modal-overlay.active,
    .modal-backdrop.active,
    #loginModal.active {
      display: flex !important;
      opacity: 1 !important;
    }

    .login-dialog-card {
      background: var(--canvas-white);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 480px;
      box-shadow: 0 24px 50px rgba(0, 56, 101, 0.28);
      border: 1px solid var(--border-light);
      overflow: hidden;
      transform: translateY(20px) scale(0.96);
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      margin: auto;
    }

    .modal-backdrop.active .login-dialog-card {
      transform: translateY(0) scale(1);
    }

    .login-card-header {
      background: var(--bmkg-blue-deep);
      color: #ffffff;
      padding: 1.35rem 1.75rem;
      position: relative;
      border-bottom: 3px solid var(--bmkg-green);
      display: flex;
      align-items: center;
      gap: 0.9rem;
    }

    .login-close-btn {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.95rem;
      transition: background 0.15s, transform 0.15s;
    }

    .login-close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.08);
    }

    .login-card-body {
      padding: 1.5rem 1.75rem;
      max-height: 80vh;
      overflow-y: auto;
    }

    /* Auth Main Switcher (Login vs Register) */
    .auth-main-tabs {
      display: flex;
      background: var(--canvas-surface);
      padding: 4px;
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
      border: 1px solid var(--border-light);
    }

    .auth-main-tab-btn {
      flex: 1;
      padding: 0.55rem 0.75rem;
      border: none;
      background: transparent;
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      transition: all 0.2s;
    }

    .auth-main-tab-btn.active {
      background: var(--canvas-white);
      color: var(--bmkg-blue-deep);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .login-tabs {
      display: flex;
      border-bottom: 2px solid var(--border-light);
      margin-bottom: 1.25rem;
    }

    .login-tab-btn {
      flex: 1;
      padding: 0.55rem 0.5rem;
      background: transparent;
      border: none;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      transition: color 0.15s, border-color 0.15s;
    }

    .login-tab-btn.active {
      color: var(--bmkg-blue-deep);
      border-bottom-color: var(--bmkg-blue);
    }

    .form-group {
      margin-bottom: 1.05rem;
    }

    .form-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 0.35rem;
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      color: var(--text-muted);
      font-size: 0.85rem;
      pointer-events: none;
    }

    .form-control-input {
      width: 100%;
      padding: 0.65rem 0.9rem;
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .form-control-input.with-icon {
      padding-left: 2.35rem;
    }

    .form-control-input.with-eye {
      padding-right: 2.4rem;
    }

    .form-control-input:focus {
      border-color: var(--bmkg-blue);
      box-shadow: 0 0 0 3px rgba(0, 90, 158, 0.15);
    }

    .password-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-toggle-btn {
      position: absolute;
      right: 12px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.88rem;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s;
    }

    .password-toggle-btn:hover {
      color: var(--bmkg-blue);
    }

    .pwd-strength-bar {
      height: 4px;
      background: var(--border-light);
      border-radius: 2px;
      margin-top: 6px;
      overflow: hidden;
    }

    .pwd-strength-fill {
      height: 100%;
      width: 0%;
      transition: width 0.3s, background-color 0.3s;
    }

    .pwd-strength-text {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 3px;
    }

    .btn-login-submit {
      width: 100%;
      background: var(--bmkg-blue-deep);
      color: #ffffff;
      padding: 0.75rem;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.92rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 56, 101, 0.2);
    }

    .btn-login-submit:hover {
      background: var(--bmkg-blue);
    }

    /* Hero Section */
    .hero-banner {
      background: linear-gradient(180deg, var(--bmkg-blue-subtle) 0%, var(--canvas-white) 100%);
      border-bottom: 1px solid var(--border-light);
      padding: 3.5rem 2rem 2.8rem 2rem;
      position: relative;
    }

    .hero-content {
      max-width: 920px;
      margin: 0 auto;
      text-align: center;
    }

    .hero-meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: var(--bmkg-green-light);
      color: var(--bmkg-green-dark);
      font-size: 0.82rem;
      font-weight: 700;
      padding: 0.35rem 0.9rem;
      border-radius: 9999px;
      margin-bottom: 1.25rem;
      border: 1px solid rgba(0, 135, 90, 0.2);
      transition: transform 0.2s;
    }

    .hero-meta-tag:hover {
      transform: scale(1.03);
    }

    .hero-title {
      font-size: 2.65rem;
      font-weight: 800;
      color: var(--bmkg-blue-deep);
      line-height: 1.2;
      letter-spacing: -0.025em;
      margin-bottom: 1rem;
    }

    .hero-lead {
      font-size: 1.12rem;
      color: var(--text-secondary);
      margin-bottom: 2.25rem;
      max-width: 740px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Search Box */
    .search-panel {
      background: var(--canvas-white);
      border: 1.5px solid var(--border-medium);
      border-radius: var(--radius-lg);
      padding: 0.45rem 0.55rem;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
      position: relative;
    }

    .search-panel:focus-within {
      border-color: var(--border-focus);
      box-shadow: 0 8px 24px rgba(0, 90, 158, 0.16);
      transform: translateY(-2px);
    }

    .search-icon-box {
      color: var(--bmkg-blue);
      padding-left: 0.85rem;
      font-size: 1.2rem;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1.05rem;
      font-family: inherit;
      color: var(--text-main);
    }

    .search-input::placeholder {
      color: var(--text-caption);
    }

    .search-submit-btn {
      background: var(--bmkg-blue-deep);
      color: #ffffff;
      border: none;
      padding: 0.8rem 1.85rem;
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      box-shadow: 0 2px 8px rgba(0, 56, 101, 0.2);
    }

    .search-submit-btn:hover {
      background: var(--bmkg-blue-hover);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 56, 101, 0.3);
    }

    /* Dynamic Search Results Dropdown */
    .search-live-feedback {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: var(--bmkg-blue);
      font-weight: 600;
      min-height: 24px;
      transition: all 0.2s;
    }

    .search-shortcuts {
      margin-top: 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.82rem;
    }

    .shortcut-label {
      color: var(--text-muted);
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-right: 0.25rem;
    }

    .shortcut-chips-row {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.45rem;
    }

    .shortcut-chip {
      background: var(--canvas-white);
      border: 1px solid var(--border-light);
      padding: 0.32rem 0.75rem;
      border-radius: 9999px;
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.8rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: var(--transition-bounce);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      white-space: nowrap;
    }

    .shortcut-chip:hover {
      background-color: var(--bmkg-blue-subtle);
      color: var(--bmkg-blue-deep);
      border-color: var(--bmkg-blue);
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 90, 158, 0.15);
    }

    /* Verified Institutional Counters */
    .metrics-container {
      max-width: 1240px;
      margin: -1.75rem auto 2.5rem auto;
      padding: 0 2rem;
      position: relative;
      z-index: 10;
    }

    .metrics-bar {
      background: var(--canvas-white);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 1.35rem 2rem;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      box-shadow: var(--shadow-md);
      transition: box-shadow 0.2s;
    }

    .metrics-bar:hover {
      box-shadow: var(--shadow-lg);
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      padding: 0 1.25rem;
      border-right: 1px solid var(--border-light);
      transition: transform 0.2s;
    }

    .metric-item:last-child {
      border-right: none;
    }

    .metric-item:hover {
      transform: translateY(-2px);
    }

    .metric-number {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--bmkg-blue-deep);
      font-family: 'JetBrains Mono', monospace;
      line-height: 1.2;
    }

    .metric-desc {
      font-size: 0.82rem;
      color: var(--text-secondary);
      font-weight: 600;
      margin-top: 0.2rem;
    }

    /* Content Layout */
    .main-wrapper {
      max-width: 1240px;
      margin: 0 auto;
      padding: 1.5rem 2rem 4rem 2rem;
    }

    .section-headline-group {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.65rem;
      font-weight: 800;
      color: var(--bmkg-blue-deep);
      letter-spacing: -0.02em;
    }

    .section-subtitle {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-top: 0.35rem;
    }

    /* 4 Distinct Pillars of BMKG with Hover Lift & Chevron Slide */
    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 3.5rem;
    }

    .pillar-box {
      background: var(--canvas-white);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 1.6rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: var(--transition-bounce);
      text-decoration: none;
      color: inherit;
      position: relative;
    }

    .pillar-box:hover {
      transform: translateY(-6px);
      box-shadow: 0 14px 28px rgba(0, 56, 101, 0.1);
      border-color: var(--border-medium);
    }

    .pillar-box.meteorologi { border-top: 4px solid var(--bmkg-blue); }
    .pillar-box.klimatologi { border-top: 4px solid var(--alert-amber); }
    .pillar-box.geofisika { border-top: 4px solid var(--seismic-red); }
    .pillar-box.kualitas-udara { border-top: 4px solid var(--bmkg-green); }

    .pillar-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .pillar-icon-badge {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .pillar-box:hover .pillar-icon-badge {
      transform: scale(1.15) rotate(-5deg);
    }

    .meteorologi .pillar-icon-badge { background: var(--bmkg-blue-subtle); color: var(--bmkg-blue); }
    .klimatologi .pillar-icon-badge { background: var(--alert-amber-light); color: var(--alert-amber); }
    .geofisika .pillar-icon-badge { background: var(--seismic-red-light); color: var(--seismic-red); }
    .kualitas-udara .pillar-icon-badge { background: var(--bmkg-green-light); color: var(--bmkg-green); }

    .pillar-name {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--bmkg-blue-deep);
    }

    .pillar-description {
      font-size: 0.88rem;
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
      line-height: 1.55;
    }

    .pillar-footer {
      border-top: 1px solid var(--border-light);
      padding-top: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.82rem;
    }

    .dataset-count-tag {
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
    }

    .pillar-browse-action {
      font-weight: 700;
      color: var(--bmkg-blue);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .pillar-browse-action i {
      transition: transform 0.2s ease-in-out;
    }

    .pillar-box:hover .pillar-browse-action i {
      transform: translateX(5px);
    }

    /* Spatial Map Explorer Section */
    .spatial-card {
      background: var(--canvas-white);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
      margin-bottom: 3.5rem;
      position: relative;
      z-index: 10;
    }

    .spatial-card-header {
      padding: 0.85rem 1.25rem;
      background: var(--canvas-subtle);
      border-bottom: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.65rem;
    }

    .spatial-title-group h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--bmkg-blue-deep);
    }

    .spatial-title-group p {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 1px;
    }

    .spatial-controls-bar {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 0.35rem;
      overflow-x: auto;
      max-width: 100%;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .spatial-controls-bar::-webkit-scrollbar {
      display: none;
    }

    /* Map & Regional Selector Dropdowns */
    .basemap-select,
    .region-select {
      background: var(--canvas-white);
      border: 1px solid var(--border-medium);
      color: var(--bmkg-blue-deep);
      padding: 0.32rem 0.55rem;
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      font-weight: 600;
      font-family: inherit;
      outline: none;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: border-color 0.2s, box-shadow 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .basemap-select:hover,
    .region-select:hover {
      border-color: var(--bmkg-blue);
    }

    .basemap-select:focus,
    .region-select:focus {
      border-color: var(--bmkg-blue);
      box-shadow: 0 0 0 3px rgba(0, 90, 158, 0.15);
    }

    .filter-pill-btn {
      background: var(--canvas-white);
      border: 1px solid var(--border-medium);
      color: var(--text-secondary);
      padding: 0.32rem 0.6rem;
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      white-space: nowrap;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .filter-pill-btn:hover {
      border-color: var(--bmkg-blue);
      color: var(--bmkg-blue);
      transform: translateY(-1px);
    }

    .filter-pill-btn.active {
      background: var(--bmkg-blue-deep);
      border-color: var(--bmkg-blue-deep);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 56, 101, 0.25);
    }

    @media (max-width: 1280px) {
      .spatial-card-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }
      .spatial-controls-bar {
        width: 100%;
        justify-content: flex-start;
      }
    }

    .spatial-map-wrapper {
      position: relative;
      height: 520px;
      width: 100%;
    }

    #bmkgMap {
      width: 100%;
      height: 100%;
      background: #e5eef4;
    }

    /* Sembunyikan attribution bar di pojok kanan bawah peta */
    .leaflet-control-attribution {
      display: none !important;
    }

    .map-legend-box {
      position: absolute;
      bottom: 24px;
      left: 24px;
      z-index: 500;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 0.85rem 1.15rem;
      box-shadow: var(--shadow-lg);
      font-size: 0.82rem;
      max-width: 325px;
      backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .map-legend-box.collapsed {
      padding: 0.55rem 0.95rem;
      max-width: 250px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: var(--shadow-md);
    }

    .legend-heading {
      font-weight: 700;
      color: var(--bmkg-blue-deep);
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.6rem;
      user-select: none;
    }

    .legend-toggle-btn {
      background: var(--canvas-surface);
      border: 1px solid var(--border-medium);
      color: var(--text-secondary);
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
    }

    .legend-toggle-btn:hover {
      background: var(--bmkg-blue-subtle);
      color: var(--bmkg-blue);
      border-color: var(--bmkg-blue);
    }

    .legend-toggle-btn i {
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .map-legend-box.collapsed .legend-toggle-btn i {
      transform: rotate(180deg);
    }

    .legend-body {
      max-height: 400px;
      opacity: 1;
      overflow: hidden;
      margin-top: 0.75rem;
      transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, margin-top 0.3s;
    }

    .map-legend-box.collapsed .legend-body {
      max-height: 0;
      opacity: 0;
      margin-top: 0;
      pointer-events: none;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.4rem;
      color: var(--text-secondary);
      font-size: 0.8rem;
    }

    .legend-point {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* Pulse animation for active earthquakes */
    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2.4); opacity: 0; }
    }

    .seismic-pulse {
      position: relative;
    }
    .seismic-pulse::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: rgba(201, 42, 42, 0.6);
      animation: pulse-ring 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
    }

    .tews-radar-wrapper {
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
    }
    .tews-radar-ping {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.4);
      animation: tews-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    .tews-radar-core {
      position: relative;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #dc2626;
      border: 2px solid #ffffff;
      box-shadow: 0 0 10px rgba(220, 38, 38, 0.8);
    }
    @keyframes tews-ping {
      0% { transform: scale(0.4); opacity: 1; }
      80%, 100% { transform: scale(2.6); opacity: 0; }
    }
    @keyframes tews-radar-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    /* Marker Badges for All Earthquakes */
    .gempa-m5-badge {
      background: #dc2626;
      color: #ffffff;
      border: 1.5px solid #ffffff;
      border-radius: 12px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 800;
      font-family: 'Plus Jakarta Sans', sans-serif;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.5);
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      cursor: pointer;
      transform: translate(-50%, -50%);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
    }
    .gempa-m5-badge:hover {
      transform: translate(-50%, -50%) scale(1.22);
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.85);
      z-index: 9999 !important;
    }

    .gempa-dirasakan-badge {
      background: #d97706;
      color: #ffffff;
      border: 1.5px solid #ffffff;
      border-radius: 12px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 800;
      font-family: 'Plus Jakarta Sans', sans-serif;
      box-shadow: 0 2px 5px rgba(217, 119, 6, 0.5);
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      transform: translate(-50%, -50%);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
    }
    .gempa-dirasakan-badge:hover {
      transform: translate(-50%, -50%) scale(1.22);
      box-shadow: 0 4px 14px rgba(217, 119, 6, 0.85);
      z-index: 9999 !important;
    }

    /* DataStore Preview & Interactive Tabular Explorer */
    .preview-split-section {
      background: var(--canvas-white);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 1.75rem;
      margin-bottom: 3rem;
      box-shadow: var(--shadow-md);
    }

    .preview-tab-controls {
      display: flex;
      gap: 0.75rem;
      border-bottom: 2px solid var(--canvas-surface);
      margin-bottom: 1.5rem;
      padding-bottom: 0.25rem;
    }

    .preview-tab-btn {
      background: transparent;
      border: none;
      padding: 0.65rem 1.15rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      border-bottom: 3px solid transparent;
      margin-bottom: -0.25rem;
      transition: var(--transition-bounce);
    }

    .preview-tab-btn:hover {
      color: var(--bmkg-blue);
      background: var(--bmkg-blue-subtle);
    }

    .preview-tab-btn.active {
      color: var(--bmkg-blue-deep);
      border-bottom-color: var(--bmkg-blue-deep);
      background: var(--bmkg-blue-subtle);
    }

    /* Table Toolbar */
    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .table-search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--canvas-subtle);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-md);
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }

    .table-search-box input {
      border: none;
      background: transparent;
      outline: none;
      font-family: inherit;
      color: var(--text-main);
      font-size: 0.85rem;
      width: 220px;
    }

    .table-actions-group {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .action-sub-btn {
      background: var(--canvas-white);
      border: 1px solid var(--border-medium);
      color: var(--bmkg-blue-deep);
      font-size: 0.82rem;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      box-shadow: var(--shadow-sm);
    }

    .action-sub-btn:hover {
      background: var(--bmkg-blue-subtle);
      border-color: var(--bmkg-blue);
      transform: translateY(-2px);
    }

    .table-responsive-box {
      overflow-x: auto;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
    }

    table.gov-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.86rem;
      text-align: left;
    }

    table.gov-table th {
      background: var(--canvas-subtle);
      color: var(--bmkg-blue-deep);
      font-weight: 700;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-medium);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      cursor: pointer;
      user-select: none;
      transition: background 0.15s;
    }

    table.gov-table th:hover {
      background: var(--bmkg-blue-subtle);
      color: var(--bmkg-blue);
    }

    table.gov-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-light);
      color: var(--text-secondary);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      transition: background 0.15s;
    }

    table.gov-table tbody tr:hover td {
      background-color: #f1f7fc;
      color: var(--bmkg-blue-deep);
    }

    /* API Code Snippet Box */
    .api-code-panel {
      background: #0b1120;
      border-radius: var(--radius-md);
      color: #e2e8f0;
      padding: 1.25rem 1.5rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      position: relative;
    }

    .code-top-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--bmkg-green);
      font-size: 0.78rem;
      font-weight: 600;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.65rem;
      margin-bottom: 1rem;
    }

    .copy-btn {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-weight: 600;
    }

    .copy-btn:hover {
      background: var(--bmkg-green);
      border-color: var(--bmkg-green);
      transform: translateY(-2px);
    }

    /* Institutional Footer */
    footer.gov-footer {
      background: var(--bmkg-blue-deep);
      color: #ffffff;
      padding: 3.5rem 2rem 2rem 2rem;
      border-top: 4px solid var(--bmkg-green);
    }

    .footer-inner {
      max-width: 1240px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 2.5rem;
      margin-bottom: 2.5rem;
    }

    .footer-brand-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 1.2rem;
    }

    .footer-brand-header .footer-logo-svg {
      width: 44px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .footer-brand-header .footer-logo-svg img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .footer-col h4 {
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 1.2rem;
      color: #ffffff;
    }

    .footer-col p {
      font-size: 0.85rem;
      color: #cbd5e1;
      line-height: 1.6;
    }

    .footer-col ul {
      list-style: none;
    }

    .footer-col ul li {
      margin-bottom: 0.6rem;
    }

    .footer-col ul li a {
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.15s, transform 0.15s;
      display: inline-block;
    }

    .footer-col ul li a:hover {
      color: #ffffff;
      transform: translateX(3px);
    }

    .footer-bottom-bar {
      max-width: 1240px;
      margin: 0 auto;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    /* Toast Notification */
    .toast-feedback {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: var(--bmkg-blue-deep);
      color: #ffffff;
      padding: 0.85rem 1.4rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      border-left: 4px solid var(--bmkg-green);
      font-weight: 600;
      font-size: 0.88rem;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .toast-feedback.show {
      transform: translateY(0);
      opacity: 1;
    }

    @media (max-width: 1024px) {
      .pillars-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .metrics-bar {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
      .metric-item {
        border-right: none;
      }
      .footer-inner {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 640px) {
      .pillars-grid, .metrics-bar, .footer-inner {
        grid-template-columns: 1fr;
      }
      .hero-title {
        font-size: 2rem;
      }
      .gov-links {
        display: none;
      }
    }
  </style>
</head>
<body>

  <!-- 1. Top Identity Bar -->
  <div class="gov-identity-bar">
    <div class="gov-identity-inner">
      <div class="gov-title" id="govRealtimeClock" title="Waktu Nyata (Real-time Clock)">
        <i class="fa-regular fa-clock" style="color: #38bdf8;"></i>
        <span id="liveClockDate" style="color: #cbd5e1;"></span>
        <span style="color: rgba(255, 255, 255, 0.4); margin: 0 1px;">•</span>
        <span id="liveClockTime" style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;"></span>
      </div>
      <div class="gov-links">
        <a href="https://www.bmkg.go.id" target="_blank" rel="noreferrer">Website Utama BMKG</a>
        <a href="#kontak">Layanan Bantuan</a>
      </div>
    </div>
  </div>

  <!-- 2. Main Site Header with Official BMKG Logo -->
  <header class="site-header">
    <div class="site-header-inner">
      <a href="#" class="brand-section">
        <div class="bmkg-official-logo">
          <img src="/logo-bmkg.png" alt="Logo Resmi BMKG" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
        <div class="brand-names">
          <div class="brand-title">
            Portal Data BMKG
          </div>
          <div class="brand-subtitle">Badan Meteorologi, Klimatologi, dan Geofisika</div>
        </div>
      </a>

      <nav class="primary-nav">
        <a href="/" class="active">Beranda</a>
        <a href="#pilar">4 Pilar MKG</a>
        <a href="#peta">Peta Observasi</a>
        <a href="#datastore">DataStore API</a>
      </nav>

      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button class="btn-interactive header-login-btn" onclick="openLoginModal()" title="Login Administrator / Pengelola Data BMKG">
          <i class="fa-solid fa-lock"></i>
          <span>Login</span>
        </button>
        <a href="/katalog" class="btn-interactive header-action-btn" title="Jelajahi & Unduh Katalog Dataset Terbuka Bebas Tanpa Login">
          <i class="fa-solid fa-database"></i>
          <span>Akses Data Publik</span>
        </a>
      </div>
    </div>
  </header>

  <!-- 3. Hero Section with Live Search Filter -->
  <section class="hero-banner">
    <div class="hero-content">
      <h1 class="hero-title">
        Satu Pintu Akses Data Meteorologi, Klimatologi, dan Geofisika
      </h1>
      <p class="hero-lead">
        Menyediakan ribuan dataset observasi terpercaya, deret waktu iklim, pemantauan kualitas udara, dan katalog seismik Indonesia yang dapat diakses publik, diunduh, dan diintegrasikan melalui API secara bebas tanpa perlu registrasi akun.
      </p>

      <!-- Search Box Panel -->
      <div class="search-panel">
        <div class="search-icon-box">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <input 
          type="text" 
          id="portalSearchInput"
          class="search-input" 
          placeholder="Ketik nama dataset, parameter cuaca, wilayah, atau kode stasiun WMO..."
          oninput="handleLiveSearch(this.value)"
          onkeydown="if(event.key === 'Enter') executeSearch()"
        />
        <button class="btn-interactive search-submit-btn" onclick="executeSearch()">
          Cari Data
        </button>
      </div>

      <!-- Live Search Feedback Indicator -->
      <div class="search-live-feedback" id="liveSearchFeedback"></div>

      <!-- Interactive Search Shortcuts (Simetris & Sejajar) -->
      <div class="search-shortcuts">
        <span class="shortcut-label">
          <i class="fa-solid fa-arrow-trend-up" style="color: var(--bmkg-blue);"></i>
          Pencarian Populer:
        </span>
        <div class="shortcut-chips-row">
          <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Curah Hujan Harian')">
          <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Curah Hujan')">
            <i class="fa-solid fa-cloud-showers-heavy" style="color: #0284c7;"></i> Curah Hujan
          </button>
          <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Gempa Tektonik')">
          <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Gempa')">
            <i class="fa-solid fa-wave-square" style="color: #dc2626;"></i> Gempa M &ge; 5.0
          </button>
          <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Partikulat PM2.5')">
          <button class="btn-interactive shortcut-chip" onclick="applySearchTag('PM2.5')">
            <i class="fa-solid fa-wind" style="color: #00875a;"></i> Partikulat PM2.5
          </button>
          <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Suhu Udara Ekstrem')">
          <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Suhu')">
            <i class="fa-solid fa-temperature-half" style="color: #d97706;"></i> Suhu Ekstrem
          </button>
          <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Tinggi Gelombang')">
          <button class="btn-interactive shortcut-chip" onclick="applySearchTag('Gelombang')">
            <i class="fa-solid fa-water" style="color: #0284c7;"></i> Gelombang Laut
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- 4. Verified Institutional Metrics Bar -->
  <div class="metrics-container">
    <div class="metrics-bar scroll-reveal">
      <div class="metric-item">
        <div class="metric-number" id="totalDatasetCount">7</div>
        <div class="metric-desc">Dataset Terbuka Terverifikasi</div>
      </div>
      <div class="metric-item">
        <div class="metric-number">4 Pilar</div>
        <div class="metric-desc">Meteorologi, Iklim, Gempa, Kualitas Udara</div>
      </div>
      <div class="metric-item">
        <div class="metric-number">218 UPT</div>
        <div class="metric-desc">Stasiun Observasi di Seluruh Indonesia</div>
      </div>
      <div class="metric-item">
        <div class="metric-number">100% Bebas</div>
        <div class="metric-desc">Lisensi Terbuka CC-BY 4.0 &amp; RESTful API</div>
      </div>
    </div>
  </div>

  <!-- 5. Main Body Content -->
  <main class="main-wrapper">
    
    <!-- 4 Pillars Section with Interactive Cards -->
    <section id="pilar">
      <div class="section-headline-group scroll-reveal">
        <h2 class="section-title">4 Pilar Layanan Data BMKG</h2>
        <p class="section-subtitle">Struktur taksonomi data terbuka yang dikurasi oleh masing-masing unit teknis kedeputian</p>
      </div>

      <div class="pillars-grid">
        <!-- Meteorologi -->
        <a href="#peta" class="pillar-box meteorologi scroll-reveal stagger-1" onclick="filterByPilar('meteorologi')">
        <a href="katalog.html?pilar=meteorologi" class="pillar-box meteorologi scroll-reveal stagger-1" onclick="filterByPilar('meteorologi', event)">
          <div>
            <div class="pillar-header">
              <div class="pillar-icon-badge">
                <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 8a5 5 0 0 1 5 5v.5a4.5 4.5 0 1 1 2 8.5H10A6 6 0 0 1 12 8z" fill="rgba(0, 90, 158, 0.15)"/>
                  <path d="M10 24v3M15 24v3M20 24v3"/>
                </svg>
              </div>
              <div class="pillar-name">Meteorologi</div>
            </div>
            <p class="pillar-description">
              Data pengamatan cuaca permukaan, prakiraan gelombang laut maritim, cuaca penerbangan, dan data radar cuaca komposit.
            </p>
          </div>
          <div class="pillar-footer">
            <span class="dataset-count-tag" id="countPilarMeteorologi">3 Dataset</span>
            <span class="pillar-browse-action">Jelajahi <i class="fa-solid fa-chevron-right"></i></span>
          </div>
        </a>

        <!-- Klimatologi -->
        <a href="#peta" class="pillar-box klimatologi scroll-reveal stagger-2" onclick="filterByPilar('klimatologi')">
        <a href="katalog.html?pilar=klimatologi" class="pillar-box klimatologi scroll-reveal stagger-2" onclick="filterByPilar('klimatologi', event)">
          <div>
            <div class="pillar-header">
              <div class="pillar-icon-badge">
                <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#047857" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="5" fill="#10b981" stroke="#047857"/>
                  <line x1="11" y1="2" x2="11" y2="4"/>
                  <line x1="11" y1="18" x2="11" y2="20"/>
                  <line x1="2" y1="11" x2="4" y2="11"/>
                  <line x1="18" y1="11" x2="20" y2="11"/>
                  <path d="M23 15a2 2 0 0 0-2-2v-5a2 2 0 1 1 4 0v5a2 2 0 0 0-2 2z" fill="#d1fae5"/>
                  <circle cx="23" cy="22" r="3" fill="#047857"/>
                  <line x1="23" y1="12" x2="23" y2="22" stroke="#047857" stroke-width="2.5"/>
                </svg>
              </div>
              <div class="pillar-name">Klimatologi</div>
            </div>
            <p class="pillar-description">
              Deret waktu iklim historis, pemantauan anomali iklim, data curah hujan dasarian dan bulanan, serta indeks kekeringan (SPI).
            </p>
          </div>
          <div class="pillar-footer">
            <span class="dataset-count-tag" id="countPilarKlimatologi">1 Dataset</span>
            <span class="pillar-browse-action">Jelajahi <i class="fa-solid fa-chevron-right"></i></span>
          </div>
        </a>

        <!-- Geofisika -->
        <a href="#peta" class="pillar-box geofisika scroll-reveal stagger-3" onclick="filterByPilar('geofisika')">
        <a href="katalog.html?pilar=geofisika" class="pillar-box geofisika scroll-reveal stagger-3" onclick="filterByPilar('geofisika', event)">
          <div>
            <div class="pillar-header">
              <div class="pillar-icon-badge">
                <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#c92a2a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="16" cy="16" r="13" stroke="#c92a2a" stroke-width="1.8" opacity="0.35" fill="rgba(201, 42, 42, 0.08)"/>
                  <path d="M4 16h5l2.5-7 4 14 3.5-10 2.5 5 2-2h6.5" stroke="#c92a2a" stroke-width="2.2"/>
                </svg>
              </div>
              <div class="pillar-name">Geofisika</div>
            </div>
            <p class="pillar-description">
              Katalog parameter gempa bumi tektonik M &ge; 5.0, pemodelan penjalaran tsunami, kerapatan sambaran petir, dan geomagnetisme.
            </p>
          </div>
          <div class="pillar-footer">
            <span class="dataset-count-tag" id="countPilarGeofisika">2 Dataset</span>
            <span class="pillar-browse-action">Jelajahi <i class="fa-solid fa-chevron-right"></i></span>
          </div>
        </a>

        <!-- Kualitas Udara -->
        <a href="#peta" class="pillar-box kualitas-udara scroll-reveal stagger-4" onclick="filterByPilar('kualitas-udara')">
        <a href="katalog.html?pilar=kualitas-udara" class="pillar-box kualitas-udara scroll-reveal stagger-4" onclick="filterByPilar('kualitas-udara', event)">
          <div>
            <div class="pillar-header">
              <div class="pillar-icon-badge">
                <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#00875a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 11h14a3 3 0 1 0-3-3" fill="none"/>
                  <path d="M3 16h20a3.5 3.5 0 1 1-3.5 3.5" fill="none"/>
                  <path d="M7 21h10a2.5 2.5 0 1 0-2.5-2.5" fill="none"/>
                  <circle cx="26" cy="9" r="1.5" fill="#00875a"/>
                </svg>
              </div>
              <div class="pillar-name">Kualitas Udara</div>
            </div>
            <p class="pillar-description">
              Konsentrasi partikulat polusi udara PM2.5 dan PM10 dari stasiun GAW/SPKU, kimia air hujan, dan gas rumah kaca (GRK).
            </p>
          </div>
          <div class="pillar-footer">
            <span class="dataset-count-tag" id="countPilarKualitasUdara">1 Dataset</span>
            <span class="pillar-browse-action">Jelajahi <i class="fa-solid fa-chevron-right"></i></span>
          </div>
        </a>
      </div>
    </section>

    <!-- Geospatial Map Section with Region Selector & Layer Filters -->
    <section class="spatial-card" id="peta">
      <div class="spatial-card-header scroll-reveal">
        <div class="spatial-title-group">
          <h3>Peta Sebaran Stasiun Observasi &amp; Aktivitas Seismik</h3>
          <p>Integrasi ckanext-spatial dan ckanext-geoview untuk penelusuran data berbasis wilayah geografis</p>
        </div>
        <div class="spatial-controls-bar">
          <!-- Pilihan Peta Berwarna (Bebas Blokir OSM) -->
          <select class="basemap-select" id="basemapSelector" onchange="changeBasemap(this.value)">
            <option value="street">🗺️ Street Map</option>
            <option value="topo">🏔️ Topografi</option>
            <option value="satellite">🛰️ Citra Satelit</option>
            <option value="natgeo">🧭 NatGeo</option>
          </select>

          <!-- Regional FlyTo Selector -->
          <select class="region-select" id="regionSelector" onchange="flyToRegion(this.value)">
            <option value="indonesia">🌍 Indonesia</option>
            <option value="sumatera">Sumatera (Balai I)</option>
            <option value="jawa">Jawa &amp; Banten (Balai II)</option>
            <option value="balinusra">Bali-Nusra (Balai III)</option>
            <option value="sulawesi">Sulawesi (Balai IV)</option>
            <option value="papua">Papua (Balai V)</option>
          </select>

          <button class="btn-interactive filter-pill-btn active" id="filterStasiun" onclick="toggleMapLayer('stasiun')">
            <i class="fa-solid fa-tower-broadcast"></i> Stasiun UPT
          </button>
          <button class="btn-interactive filter-pill-btn active" id="filterGempaAll" onclick="setGempaDisplayFilter('all')">
            <i class="fa-solid fa-circle-nodes"></i> Semua (<span id="countAllGempa">30</span>)
          </button>
          <button class="btn-interactive filter-pill-btn" id="filterGempaM5" onclick="setGempaDisplayFilter('m5')">
            <i class="fa-solid fa-triangle-exclamation"></i> M &ge; 5.0 (<span id="countM5Gempa">15</span>)
          </button>
          <button class="btn-interactive filter-pill-btn" id="filterGempaDirasakan" onclick="setGempaDisplayFilter('dirasakan')">
            <i class="fa-solid fa-bullhorn"></i> Dirasakan (<span id="countDirasakanGempa">15</span>)
          </button>
        </div>
      </div>

      <!-- Real-Time BMKG TEWS Alert Bar -->
      <div class="live-tews-alert-bar" id="liveTewsBar" style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.96) 100%); border: 1px solid rgba(239, 68, 68, 0.45); border-radius: 8px; padding: 0.65rem 1rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);">
        <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
          <div style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.25rem 0.65rem; border-radius: 9999px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444; display: inline-block; animation: tews-radar-pulse 1.5s infinite;"></span>
            <span style="font-size: 0.76rem; font-weight: 800; color: #fca5a5; letter-spacing: 0.05em; text-transform: uppercase;">LIVE BMKG TEWS</span>
          </div>
          <div style="color: #f1f5f9; font-size: 0.86rem; font-weight: 600;" id="liveTewsHeadline">
            Memuat pembaruan data seismik terkini dari server BMKG TEWS...
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <span style="font-size: 0.76rem; color: #94a3b8; font-family: 'JetBrains Mono', monospace;" id="liveTewsMeta">Sinkronisasi Realtime</span>
          <button onclick="fetchLiveBMKGGempa(true)" class="btn-interactive" title="Perbarui Data Gempa Langsung dari BMKG TEWS" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: #f8fafc; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.76rem; cursor: pointer;">
            <i class="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>
      </div>

      <div class="spatial-map-wrapper">
        <div id="bmkgMap"></div>
        <!-- Collapsible Map Legend Box -->
        <div class="map-legend-box" id="mapLegendBox">
          <div class="legend-heading" onclick="toggleMapLegend()" style="cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-layer-group" style="color: var(--bmkg-blue); font-size: 0.85rem;"></i>
              <span>Legenda Observasi</span>
            </div>
            <button class="btn-interactive legend-toggle-btn" id="legendToggleBtn" onclick="event.stopPropagation(); toggleMapLegend()" title="Sembunyikan / Tampilkan Legenda">
              <i class="fa-solid fa-chevron-down" id="legendToggleIcon"></i>
            </button>
          </div>
          <div class="legend-body" id="legendBody">
            <div class="legend-row">
              <div class="legend-point" style="background-color: var(--bmkg-blue);"></div>
              <span>Stasiun Meteorologi / Klimatologi UPT</span>
            </div>
            <div class="legend-row">
              <div class="legend-point" style="background-color: var(--bmkg-green);"></div>
              <span>Stasiun Pemantau Atmosfer Global (GAW)</span>
            </div>
            <div class="legend-row">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #dc2626; border: 2px solid #fbbf24; flex-shrink: 0;"></div>
              <span>Episentrum Gempa Terkini Live (Radar)</span>
            </div>
            <div class="legend-row">
              <div style="background: #dc2626; color: #fff; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; flex-shrink: 0;">M&ge;5</div>
              <span id="legendGempaM5Text">15 Gempa M &ge; 5.0 Terkini</span>
            </div>
            <div class="legend-row">
              <div style="background: #d97706; color: #fff; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; flex-shrink: 0;">MMI</div>
              <span id="legendGempaDirasakanText">15 Gempa Dirasakan Terkini</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.5rem; border-top: 1px solid var(--border-light); padding-top: 0.4rem;">
              Tip: Arahkan kursor atau klik marker untuk detail gempa &amp; Shakemap
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- DataStore Tabular Preview & Interactive API Explorer -->
    <section class="preview-split-section" id="datastore">
      <div class="preview-tab-controls scroll-reveal">
        <button class="btn-interactive preview-tab-btn active" id="tabBtnTable" onclick="showPreviewTab('table')">
          <i class="fa-solid fa-table-cells"></i> Pratinjau Tabel DataStore
        </button>
        <button class="btn-interactive preview-tab-btn" id="tabBtnApi" onclick="showPreviewTab('api')">
          <i class="fa-solid fa-code"></i> Akses API Terbuka (cURL &amp; Python)
        </button>
      </div>

      <!-- Tab 1: Table with In-Table Filter and Sorting -->
      <div id="panelTable">
        <div class="table-toolbar">
          <div class="table-search-box">
            <i class="fa-solid fa-filter" style="color: var(--text-muted);"></i>
            <input type="text" placeholder="Filter baris tabel (stasiun / suhu)..." oninput="filterTableRows(this.value)">
          </div>

          <div class="table-actions-group">
            <button class="btn-interactive action-sub-btn" onclick="triggerDownloadCSV()">
              <i class="fa-solid fa-file-csv" style="color: var(--bmkg-green);"></i> Unduh CSV
            </button>
            <button class="btn-interactive action-sub-btn" onclick="copyTableJSON()">
              <i class="fa-solid fa-copy"></i> Salin JSON
            </button>
          </div>
        </div>

        <div class="table-responsive-box">
          <table class="gov-table" id="datastoreTable">
            <thead>
              <tr>
                <th onclick="sortTable(0)">tanggal <i class="fa-solid fa-sort"></i></th>
                <th onclick="sortTable(1)">stasiun_id <i class="fa-solid fa-sort"></i></th>
                <th onclick="sortTable(2)">nama_stasiun <i class="fa-solid fa-sort"></i></th>
                <th onclick="sortTable(3)">suhu_min (°C) <i class="fa-solid fa-sort"></i></th>
                <th onclick="sortTable(4)">suhu_max (°C) <i class="fa-solid fa-sort"></i></th>
                <th onclick="sortTable(5)">suhu_rata (°C) <i class="fa-solid fa-sort"></i></th>
                <th onclick="sortTable(6)">kelembapan (%) <i class="fa-solid fa-sort"></i></th>
                <th onclick="sortTable(7)">curah_hujan (mm) <i class="fa-solid fa-sort"></i></th>
              </tr>
            </thead>
            <tbody id="datastoreTableBody">
              <!-- Baris data di-render secara dinamis oleh JavaScript (bmkg-datastore.js) -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 2: API Snippet with One-Click Copy -->
      <div id="panelApi" style="display: none;">
        <div class="api-code-panel">
          <div class="code-top-info">
            <span>ENDPOINT PUBLIK: GET https://data.bmkg.go.id/api/3/action/datastore_search</span>
            <button class="btn-interactive copy-btn" id="copyCodeBtn" onclick="copyAPICode()">
              <i class="fa-regular fa-clone"></i> Salin Kode
            </button>
          </div>
          <pre id="apiCodeSnippet"><code># Contoh Akses DataStore API BMKG menggunakan Python
import requests
import pandas as pd

endpoint = "https://data.bmkg.go.id/api/3/action/datastore_search"
params = {
    "resource_id": "cuaca-harian-cengkareng-2026",
    "limit": 100,
    "q": "2026-08"
}

response = requests.get(endpoint, params=params)
payload = response.json()

if payload.get("success"):
    records = payload["result"]["records"]
    df = pd.DataFrame(records)
    print("Berhasil mengambil", len(df), "baris data observasi cuaca:")
    print(df[["tanggal", "suhu_rata", "curah_hujan"]].head())</code></pre>
        </div>
      </div>
    </section>

  </main>

  <!-- 6. Institutional Footer with Official Logo -->
  <footer class="gov-footer" id="kontak">
    <div class="footer-inner">
      <div class="footer-col scroll-reveal stagger-1">
        <div class="footer-brand-header">
          <div class="footer-logo-svg">
            <img src="/logo-bmkg.png" alt="Logo Resmi BMKG" style="width: 100%; height: 100%; object-fit: contain;">
          </div>
          <div>
            <h4 style="margin-bottom: 2px;">Portal Data BMKG</h4>
            <div style="font-size: 0.78rem; color: #94a3b8;">Portal Data Terbuka Resmi</div>
          </div>
        </div>
        <p>
          Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)<br>
          Jl. Angkasa I No. 2, Kemayoran, Jakarta Pusat 10610<br>
          Email: portaldata@bmkg.go.id • Call Center: 196
        </p>
      </div>
      <div class="footer-col scroll-reveal stagger-2">
        <h4>4 Pilar Layanan</h4>
        <ul>
          <li><a href="#">Katalog Meteorologi</a></li>
          <li><a href="#">Katalog Klimatologi</a></li>
          <li><a href="#">Katalog Geofisika</a></li>
          <li><a href="#">Katalog Kualitas Udara</a></li>
        </ul>
      </div>
      <div class="footer-col scroll-reveal stagger-3">
        <h4>Akses Pengembang</h4>
        <ul>
          <li><a href="#">CKAN 2.12 Action API</a></li>
          <li><a href="#">DataStore SQL Query</a></li>
          <li><a href="#">Spatial Harvest (WFS/WMS)</a></li>
          <li><a href="#">Dokumentasi Integrasi</a></li>
        </ul>
      </div>
      <div class="footer-col scroll-reveal stagger-4">
        <h4>Kepatuhan &amp; Regulasi</h4>
        <ul>
          <li><a href="#">Perpres No. 39 Tahun 2019 (SDI)</a></li>
          <li><a href="#">Lisensi Terbuka CC-BY 4.0</a></li>
          <li><a href="#">Prinsip Data Terbuka WMO</a></li>
          <li><a href="#">Standar Metadata Nasional</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom-bar">
      <div>&copy; 2026 Badan Meteorologi, Klimatologi, dan Geofisika. Hak Cipta Dilindungi Undang-Undang.</div>
      <div>Platform CKAN 2.12 Stable • Native Ubuntu 22.04 LTS Stack</div>
    </div>
  </footer>

  <!-- Modal Dialog Login Administrator BMKG (Khusus Pengelola Data / CRUD) -->
  <div class="bmkg-modal-overlay" id="loginModal" onclick="handleModalBackdropClick(event)">
    <div class="login-dialog-card" onclick="event.stopPropagation()">
      <div class="login-card-header">
        <div style="width: 38px; height: 46px; flex-shrink: 0;">
          <img src="/logo-bmkg.png" alt="Logo BMKG" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
        <div>
          <h3 style="font-size: 1.12rem; font-weight: 800; margin: 0; color: #ffffff;" id="modalHeaderTitle">Portal Data BMKG</h3>
          <div style="font-size: 0.76rem; color: #cbd5e1;" id="modalHeaderSubtitle">Login Khusus Administrator &amp; Pengelola Data (CRUD)</div>
        </div>
        <button class="login-close-btn" onclick="closeLoginModal()" title="Tutup Dialog">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="login-card-body">
        <!-- Banner Informasi Hak Akses Publik vs Admin -->
        <div style="background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.25); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.3rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; display: flex; gap: 0.75rem; align-items: flex-start;">
          <i class="fa-solid fa-circle-info" style="color: #0284c7; font-size: 1.15rem; margin-top: 2px; flex-shrink: 0;"></i>
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 2px;">Data Terbuka untuk Publik (Bebas Akses):</strong>
            Masyarakat, akademisi, dan pengembang <strong>tidak perlu login</strong> untuk mengunduh dataset, melihat tabel, atau mengambil data lewat API. Form ini <strong>hanya untuk Administrator / Petugas BMKG</strong> guna melakukan manajemen data (Create, Read, Update, Delete / CRUD).
          </div>
        </div>

        <form id="loginForm" onsubmit="handleLoginSubmit(event)">
          <div class="form-group" id="formGroupIdentifier">
            <label id="labelIdentifier">NIP Pegawai / Username Admin BMKG</label>
            <div class="input-with-icon">
              <i class="fa-solid fa-user-shield input-icon"></i>
              <input type="text" id="loginIdentifier" class="form-control-input with-icon" placeholder="contoh: 19900815... atau admin.mkg" required autocomplete="username">
            </div>
          </div>

          <div class="form-group">
            <label>Kata Sandi Administrator</label>
            <div class="password-wrapper">
              <i class="fa-solid fa-lock input-icon"></i>
              <input type="password" id="loginPassword" class="form-control-input with-icon with-eye" placeholder="Masukkan kata sandi pengelola data" required autocomplete="current-password">
              <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('loginPassword', this)" title="Lihat/Sembunyikan Sandi">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.35rem; font-size: 0.82rem;">
            <label style="display: flex; align-items: center; gap: 0.45rem; color: var(--text-secondary); cursor: pointer;">
              <input type="checkbox" checked> Ingat sesi login
            </label>
            <a href="#" onclick="showToast('Silakan hubungi Pusdatin BMKG untuk bantuan akun Administrator'); return false;" style="color: var(--bmkg-blue); text-decoration: none; font-weight: 600;">Lupa Sandi Admin?</a>
          </div>

          <button type="submit" class="btn-interactive btn-login-submit" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
            <i class="fa-solid fa-arrow-right-to-bracket"></i>
            <span id="btnLoginText">Masuk sebagai Administrator (CRUD)</span>
          </button>
        </form>

        <div style="margin-top: 1.25rem; text-align: center; font-size: 0.76rem; color: var(--text-muted); border-top: 1px solid var(--border-light); padding-top: 0.85rem;">
          <i class="fa-solid fa-shield-halved" style="color: var(--bmkg-green);"></i>
          Terproteksi Single Sign-On (SSO) Pusdatin BMKG &amp; Enkripsi TLS 1.3
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notification Element -->
  <div class="toast-feedback" id="toastFeedback">
    <i class="fa-solid fa-circle-check" style="color: var(--bmkg-green); font-size: 1.1rem;"></i>
    <span id="toastMessage">Tersalin ke papan klip!</span>
  </div>

  <!-- Leaflet JS -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

  <!-- Modular Front-end JavaScript Modules BMKG -->
  <script src="/js/bmkg-common.js"></script>
  <script src="/js/bmkg-map.js"></script>
  <script src="/js/bmkg-datastore.js"></script>
  <script src="/js/bmkg-landing.js"></script>
  <script>
    // Reset posisi scroll ke atas pada reload
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    if (window.location.hash) {
      history.replaceState(null, null, window.location.pathname + window.location.search);
    }
    window.addEventListener('beforeunload', () => {
      window.scrollTo(0, 0);
    });

    // Inisialisasi modul front-end saat dokumen siap
    document.addEventListener('DOMContentLoaded', () => {
      initRealtimeClock();
      initNavbarSoftScroll();
      initScrollReveal();
      initBmkgMap();
      initDatastoreTable();
      initDynamicLandingStats();
    });
  </script>
</body>
</html>
`;
}

// Ekspor fungsi render untuk digunakan oleh server web
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderIndexPage };
}

// Jika dijalankan langsung via 'node index.js', jalankan server pada port 8080
if (typeof require !== 'undefined' && require.main === module) {
  const { startServer } = require('./server');
  startServer(8080);
}
