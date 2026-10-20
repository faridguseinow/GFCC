(() => {
  const storageKey = 'gfcc_admin_theme';
  const root = document.documentElement;

  const getTheme = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') return saved;
    const appTheme = localStorage.getItem('theme');
    if (appTheme === 'dark-theme') return 'dark';
    if (appTheme === 'light-theme') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const isDark = theme === 'dark';
      button.textContent = isDark ? '☀' : '◐';
      button.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
      button.setAttribute('title', isDark ? 'Светлая тема' : 'Тёмная тема');
    });
  };

  applyTheme(getTheme());

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(storageKey, nextTheme);
      applyTheme(nextTheme);
    });
  });
})();
