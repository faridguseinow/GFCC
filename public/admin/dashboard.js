(() => {
  const sourceNames = {
    web: 'Браузер',
    pwa: 'PWA',
    apk: 'APK',
    rustore: 'RuStore',
    telegram: 'Telegram'
  };

  const number = (value) => new Intl.NumberFormat('ru-RU').format(Number(value) || 0);
  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  const renderSources = (sources) => {
    const container = document.getElementById('sources-list');
    container.replaceChildren();

    if (!sources.length) {
      container.innerHTML = '<div class="state">Данных пока нет</div>';
      return;
    }

    const maximum = Math.max(...sources.map((item) => Number(item.visitors) || 0), 1);
    sources.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'source-row';
      const percent = Math.max(4, Math.round(((Number(item.visitors) || 0) / maximum) * 100));
      row.innerHTML = `
        <div class="source-row-top"><strong>${sourceNames[item.source] || item.source}</strong><span>${number(item.visitors)} польз. · ${number(item.opens)} открытий</span></div>
        <div class="source-track"><span style="width:${percent}%"></span></div>`;
      container.appendChild(row);
    });
  };

  const renderDaily = (daily) => {
    const container = document.getElementById('daily-list');
    container.replaceChildren();

    if (!daily.length) {
      container.innerHTML = '<div class="state">Данных пока нет</div>';
      return;
    }

    daily.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'daily-row';
      const date = new Date(`${item.date}T00:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
      row.innerHTML = `<strong>${date}</strong><span>${number(item.visitors)} польз.</span><span>${number(item.opens)} открытий</span>`;
      container.appendChild(row);
    });
  };

  const loadDashboard = async () => {
    const errorNode = document.getElementById('dashboard-error');

    try {
      const response = await fetch('https://gfcc-oasis.ru/api/admin-dashboard.php', {
        headers: { Accept: 'application/json' },
        credentials: 'include',
        cache: 'no-store'
      });

      if (response.status === 401) {
        window.location.replace('/admin/login.php');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить статистику');

      setText('connection-count', number(data.clients));
      setText('today-visitors', number(data.today?.visitors));
      setText('today-opens', number(data.today?.opens));
      setText('month-visitors', number(data.month?.visitors));
      setText('month-opens', number(data.month?.opens));
      setText('updated-at', `Обновлено ${new Date(data.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`);
      renderSources(Array.isArray(data.sources) ? data.sources : []);
      renderDaily(Array.isArray(data.daily) ? data.daily : []);
      errorNode.hidden = true;
    } catch (error) {
      errorNode.textContent = error instanceof Error ? error.message : 'Не удалось загрузить статистику';
      errorNode.hidden = false;
    }
  };

  loadDashboard();
  window.setInterval(loadDashboard, 10000);
})();
