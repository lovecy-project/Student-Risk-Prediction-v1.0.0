document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const theme = getThemePreference();
  applyTheme(theme);

  const navButtons = Array.from(document.querySelectorAll('.nav-btn, [data-nav]'));
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.nav;
      if (!target) return;
      setActivePage(target);
      if (window.innerWidth <= 980) {
        document.querySelector('.sidebar').classList.remove('open');
      }
    });
  });

  const sidebar = document.querySelector('.sidebar');
  document.getElementById('mobileMenu').addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  document.getElementById('themeToggle').addEventListener('click', () => {
    const nextTheme = body.classList.contains('light-theme') ? 'dark' : 'light';
    applyTheme(nextTheme);
    saveThemePreference(nextTheme);
  });

  initializeAssessment();
  initializePlanner();
  initializeDashboard();
  setActivePage('home');
});

function applyTheme(themeName) {
  const body = document.body;
  const isLight = themeName === 'light';
  body.classList.toggle('light-theme', isLight);
  body.classList.toggle('theme-dark', !isLight);
  const label = document.querySelector('.toggle-label');
  if (label) {
    label.textContent = isLight ? 'Light mode' : 'Dark mode';
  }
}

function setActivePage(pageKey) {
  const pages = document.querySelectorAll('.page');
  pages.forEach((page) => {
    const isActive = page.id === pageKey;
    page.classList.toggle('active', isActive);
  });

  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.nav === pageKey);
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
