(() => {
  const pageSize = 50;
  let page = 1;
  let total = 0;
  let loaded = false;

  const summaryCard = document.getElementById('summary-card');
  const panel = document.getElementById('clients-panel');
  const countNode = document.getElementById('connection-count');
  const loadingNode = document.getElementById('loading-state');
  const errorNode = document.getElementById('error-state');
  const emptyNode = document.getElementById('empty-state');
  const tableWrap = document.getElementById('table-wrap');
  const tableBody = document.getElementById('clients-body');
  const pageLabel = document.getElementById('page-label');
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  const showState = (state) => {
    loadingNode.hidden = state !== 'loading';
    errorNode.hidden = state !== 'error';
    emptyNode.hidden = state !== 'empty';
    tableWrap.hidden = state !== 'table';
  };

  const renderRows = (clients) => {
    tableBody.replaceChildren();

    clients.forEach((client) => {
      const row = document.createElement('tr');
      [client.code, client.name, client.source].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = String(value || '—');
        row.appendChild(cell);
      });
      tableBody.appendChild(row);
    });
  };

  const loadPage = async (nextPage) => {
    page = nextPage;
    showState('loading');

    try {
      const response = await fetch(`/api/admin/card-connections?page=${page}&limit=${pageSize}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin'
      });

      if (response.status === 401) {
        window.location.replace('/admin/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось загрузить статистику');
      }

      total = Number(data.count) || 0;
      countNode.textContent = String(total);
      renderRows(Array.isArray(data.clients) ? data.clients : []);

      if (total === 0) {
        showState('empty');
        return;
      }

      const pages = Math.max(1, Math.ceil(total / pageSize));
      pageLabel.textContent = `Страница ${page} из ${pages}`;
      prevButton.disabled = page <= 1;
      nextButton.disabled = page >= pages;
      showState('table');
      loaded = true;
    } catch (error) {
      errorNode.textContent = error instanceof Error ? error.message : 'Не удалось загрузить статистику';
      showState('error');
    }
  };

  const loadCount = async () => {
    try {
      const response = await fetch('/api/admin/card-connections?summary=1', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin'
      });

      if (response.status === 401) {
        window.location.replace('/admin/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error();
      total = Number(data.count) || 0;
      countNode.textContent = String(total);
    } catch {
      countNode.textContent = '—';
    }
  };

  summaryCard.addEventListener('click', () => {
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    summaryCard.setAttribute('aria-expanded', String(willOpen));

    if (willOpen && !loaded) {
      loadPage(1);
    }
  });

  prevButton.addEventListener('click', () => loadPage(Math.max(1, page - 1)));
  nextButton.addEventListener('click', () => loadPage(page + 1));

  loadCount();
})();
