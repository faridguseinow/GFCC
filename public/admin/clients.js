(() => {
  const pageSize = 50;
  let page = 1;
  let total = 0;

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
      const connectedAt = client.connectedAt
        ? new Date(client.connectedAt).toLocaleDateString('ru-RU')
        : '—';
      [client.code, client.name, client.source, connectedAt].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = String(value || '—');
        row.appendChild(cell);
      });
      tableBody.appendChild(row);
    });
  };

  const loadPage = async (nextPage, silent = false) => {
    page = nextPage;
    if (!silent) showState('loading');

    try {
      const response = await fetch(`/api/admin-card-connections.php?page=${page}&limit=${pageSize}`, {
        headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store'
      });
      if (response.status === 401) {
        window.location.replace('/admin/login.php');
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить клиентов');

      total = Number(data.count) || 0;
      countNode.textContent = new Intl.NumberFormat('ru-RU').format(total);
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
    } catch (error) {
      if (silent) return;
      errorNode.textContent = error instanceof Error ? error.message : 'Не удалось загрузить клиентов';
      showState('error');
    }
  };

  prevButton.addEventListener('click', () => loadPage(Math.max(1, page - 1)));
  nextButton.addEventListener('click', () => loadPage(page + 1));
  loadPage(1);
  window.setInterval(() => loadPage(page, true), 10000);
})();
