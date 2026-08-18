import {
  filterPostsByStatus,
  resolveApiBase,
} from './app-core.js';

const state = {
  activeView: 'all-posts',
  activeStatus: 'publish',
  editId: null,
  tableOffset: 0,
  tableLimit: 10,
  tableSearchQuery: '',
  previewPage: 1,
  previewLimit: 5,
  postFetchBatch: 100,
  postFetchMax: 5000,
};

const API_BASE = getApiBase();
const views = ['all-posts', 'add-new', 'edit-post', 'preview'];

const tableBody = document.getElementById('postsTableBody');
const previewList = document.getElementById('previewList');
const postSearchInput = document.getElementById('postSearch');
const tablePageSizeSelect = document.getElementById('tablePageSize');
const postsPaginationTop = document.getElementById('postsPaginationTop');
const postsPagination = document.getElementById('postsPagination');
const postsMetaTop = document.getElementById('postsMetaTop');
const postsMeta = document.getElementById('postsMeta');
const previewPageSizeSelect = document.getElementById('previewPageSize');
const previewPaginationTop = document.getElementById('previewPaginationTop');
const previewPagination = document.getElementById('previewPagination');
const previewMetaTop = document.getElementById('previewMetaTop');
const previewMeta = document.getElementById('previewMeta');

let postCache = [];

function getApiBase() {
  return resolveApiBase({
    host: window.location.hostname,
    search: window.location.search,
    windowBase: window.__SHARING_VISION_API_BASE__?.toString(),
    metaBase: document.querySelector('meta[name="api-base"]')?.content,
  });
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const payload = await safeJson(response);
  if (!response.ok) {
    const msg = payload?.error || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  return payload;
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1300);
}

function setActiveMenu(view) {
  document.querySelectorAll('.menu-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

function showView(view) {
  views.forEach((v) => {
    document.getElementById(v).classList.toggle('active-view', v === view);
  });
  state.activeView = view;

  if (view === 'all-posts') {
    state.tableOffset = 0;
    loadPosts();
  }

  if (view === 'preview') {
    state.previewPage = 1;
    loadPreview();
  }
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}

function getStatus(post) {
  return String(post?.status || '').trim().toLowerCase();
}

function normalizePageValue(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

async function fetchPosts() {
  if (postCache.length > 0) {
    return postCache;
  }

  let offset = 0;
  const rows = [];

  while (offset <= state.postFetchMax) {
    const chunk = await request(`/article/${state.postFetchBatch}/${offset}`);
    if (!Array.isArray(chunk) || chunk.length === 0) {
      break;
    }

    rows.push(...chunk);
    if (chunk.length < state.postFetchBatch) {
      break;
    }

    offset += state.postFetchBatch;
  }

  postCache = rows;
  return postCache;
}

function getFilteredPosts() {
  const query = (state.tableSearchQuery || '').trim().toLowerCase();
  const byStatus = filterPostsByStatus(postCache, state.activeStatus);

  if (!query) {
    return byStatus;
  }

  return byStatus.filter((post) => {
    const title = String(post?.title || '').toLowerCase();
    const category = String(post?.category || '').toLowerCase();
    return title.includes(query) || category.includes(query);
  });
}

function buildPageNumbers(totalPages, currentPage) {
  const visibleLimit = 7;

  if (totalPages <= visibleLimit) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const pages = [];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  pages.push(1);
  if (start > 2) pages.push('...');
  for (let idx = start; idx <= end; idx += 1) {
    pages.push(idx);
  }
  if (end < totalPages - 1) pages.push('...');
  pages.push(totalPages);

  return pages;
}

function renderNumberedPagination(container, { currentPage, totalPages, onPageChange }) {
  container.innerHTML = '';
  if (totalPages < 2) {
    return;
  }

  const pageNumbers = buildPageNumbers(totalPages, currentPage);
  for (const item of pageNumbers) {
    if (item === '...') {
      const gap = document.createElement('span');
      gap.className = 'pagination-ellipsis';
      gap.textContent = '…';
      container.appendChild(gap);
      continue;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'page-btn';
    if (item === currentPage) btn.classList.add('is-current');
    btn.textContent = String(item);
    btn.disabled = item === currentPage;
    btn.addEventListener('click', () => {
      onPageChange(item);
    });
    container.appendChild(btn);
  }
}

function renderPaginationPair({
  top,
  bottom,
  textTop,
  textBottom,
  metaTop,
  metaBottom,
  currentPage,
  totalPages,
  onPageChange,
}) {
  const topMeta = textTop || '';
  const bottomMeta = textBottom || textTop || '';

  if (metaTop) {
    metaTop.textContent = topMeta;
  }
  if (metaBottom) {
    metaBottom.textContent = bottomMeta;
  }

  if (top) {
    renderNumberedPagination(top, { currentPage, totalPages, onPageChange });
  }
  if (bottom) {
    renderNumberedPagination(bottom, { currentPage, totalPages, onPageChange });
  }
}

async function loadPosts() {
  try {
    await fetchPosts();
    const filteredRows = getFilteredPosts();
    const pageSize = state.tableLimit;
    const totalRows = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    state.tableOffset = Math.min(state.tableOffset, totalPages - 1);
    if (state.tableOffset < 0) state.tableOffset = 0;

    const start = state.tableOffset * pageSize;
    const rows = filteredRows.slice(start, start + pageSize);

    tableBody.innerHTML = '';
    if (!rows.length) {
      const stateName = state.activeStatus === 'publish' ? 'Publish' : state.activeStatus;
      tableBody.innerHTML = `<tr><td colspan="3" class="muted">Tidak ada artikel ${stateName} yang cocok.</td></tr>`;
      const emptyText = 'Tidak ada data';
      renderPaginationPair({
        top: postsPaginationTop,
        bottom: postsPagination,
        metaTop: postsMetaTop,
        metaBottom: postsMeta,
        textTop: emptyText,
        textBottom: emptyText,
        currentPage: 1,
        totalPages: 1,
        onPageChange: () => undefined,
      });
      return;
    }

    for (const post of rows) {
      const status = getStatus(post);
      const actionButtons = [
        `<button class="action-btn" data-action="edit" data-id="${post.id}" title="Edit">✏️</button>`,
      ];

      if (status !== 'thrash') {
        actionButtons.push(
          `<button class="action-btn trash" data-action="trash" data-id="${post.id}" title="Pindahkan ke Trashed">🗑️</button>`,
        );
      } else {
        actionButtons.push(
          `<button class="action-btn undo" data-action="undo" data-id="${post.id}" title="Kembalikan ke Draft">
            ↩️
          </button>`,
        );
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(post.title)}</td>
        <td>${escapeHtml(post.category)}</td>
        <td>
          <div class="action-icons">
            ${actionButtons.join('')}
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    }

    tableBody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => openEdit(btn.dataset.id));
    });

    tableBody.querySelectorAll('[data-action="trash"]').forEach((btn) => {
      btn.addEventListener('click', () => moveToTrash(btn.dataset.id));
    });

    tableBody.querySelectorAll('[data-action="undo"]').forEach((btn) => {
      btn.addEventListener('click', () => moveToDraft(btn.dataset.id));
    });

    const tableMeta = `Menampilkan ${start + 1}-${Math.min(start + pageSize, totalRows)} dari ${totalRows} artikel`;
    renderPaginationPair({
      top: postsPaginationTop,
      bottom: postsPagination,
      metaTop: postsMetaTop,
      metaBottom: postsMeta,
      textTop: tableMeta,
      textBottom: tableMeta,
      currentPage: state.tableOffset + 1,
      totalPages,
      onPageChange: (page) => {
        state.tableOffset = page - 1;
        loadPosts();
      },
    });

    postsMeta.textContent = tableMeta;
    postsMetaTop.textContent = tableMeta;
  } catch (error) {
    notify(error.message);
    tableBody.innerHTML = '<tr><td colspan="3" class="muted">Gagal memuat data.</td></tr>';
    const failedText = 'Gagal memuat data';
    renderPaginationPair({
      top: postsPaginationTop,
      bottom: postsPagination,
      metaTop: postsMetaTop,
      metaBottom: postsMeta,
      textTop: failedText,
      textBottom: failedText,
      currentPage: 1,
      totalPages: 1,
      onPageChange: () => undefined,
    });
  }
}

async function openEdit(id) {
  let post = postCache.find((item) => String(item.id) === String(id));
  if (!post) {
    const latestPosts = await fetchPosts();
    post = latestPosts.find((item) => String(item.id) === String(id));
  }

  if (!post) {
    notify('Data tidak ditemukan');
    return;
  }

  state.editId = id;
  document.getElementById('editId').value = post.id;
  document.getElementById('editTitle').value = post.title;
  document.getElementById('editContent').value = post.content;
  document.getElementById('editCategory').value = post.category;
  showView('edit-post');
}

async function moveToTrash(id) {
  const post = postCache.find((item) => String(item.id) === String(id));
  if (!post) {
    notify('Data tidak ditemukan');
    return;
  }

  if (getStatus(post) === 'thrash') {
    notify('Artikel sudah dalam Trashed');
    return;
  }

  try {
    await request(`/article/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...post,
        status: 'thrash',
      }),
    });

    notify('Dipindahkan ke trash');
    postCache = [];
    await loadPosts();
  } catch (error) {
    notify(error.message);
  }
}

async function moveToDraft(id) {
  const post = postCache.find((item) => String(item.id) === String(id));
  if (!post) {
    notify('Data tidak ditemukan');
    return;
  }

  if (getStatus(post) === 'draft') {
    notify('Artikel sudah dalam draft');
    return;
  }

  try {
    await request(`/article/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...post,
        status: 'draft',
      }),
    });

    notify('Status artikel dikembalikan ke Draft');
    postCache = [];
    await loadPosts();
  } catch (error) {
    notify(error.message);
  }
}

async function savePost(url, payload) {
  await request(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function clearEditCache() {
  state.editId = null;
  document.getElementById('editId').value = '';
  const form = document.getElementById('editForm');
  if (form) form.reset();
}

async function loadPreview() {
  try {
    const posts = await collectPublishedPostsForPreview();
    const published = Array.isArray(posts) ? posts : [];
    const totalPages = Math.max(1, Math.ceil(published.length / state.previewLimit));
    state.previewPage = Math.min(state.previewPage, totalPages);
    state.previewPage = Math.max(1, state.previewPage);

    const pageStart = (state.previewPage - 1) * state.previewLimit;
    const pageEnd = pageStart + state.previewLimit;
    const pageItems = published.slice(pageStart, pageEnd);

    previewList.innerHTML = '';
    if (!pageItems.length) {
      previewList.innerHTML = `
        <div class="preview-card">
          <p class="muted">Tidak ada artikel publish.</p>
          <p>Gunakan tab <strong>Add New</strong> lalu klik <strong>Publish</strong> untuk menampilkan artikel di preview.</p>
        </div>
      `;
      const emptyText = 'Tidak ada data';
      renderPaginationPair({
        top: previewPaginationTop,
        bottom: previewPagination,
        metaTop: previewMetaTop,
        metaBottom: previewMeta,
        textTop: emptyText,
        textBottom: emptyText,
        currentPage: 1,
        totalPages: 1,
        onPageChange: () => undefined,
      });
      return;
    }

    for (const post of pageItems) {
      const article = document.createElement('article');
      article.className = 'preview-card';
      article.innerHTML = `
        <h3 class="preview-title">${escapeHtml(post.title)}</h3>
        <p class="preview-cat">${escapeHtml(post.category)}</p>
        <p class="preview-content">${escapeHtml(post.content).slice(0, 250)}...</p>
      `;
      previewList.appendChild(article);
    }

    const previewMetaText = `Halaman ${state.previewPage} dari ${totalPages}`;
    renderPaginationPair({
      top: previewPaginationTop,
      bottom: previewPagination,
      metaTop: previewMetaTop,
      metaBottom: previewMeta,
      textTop: previewMetaText,
      textBottom: previewMetaText,
      currentPage: state.previewPage,
      totalPages,
      onPageChange: (page) => {
        state.previewPage = page;
        loadPreview();
      },
    });
    previewMeta.textContent = previewMetaText;
    previewMetaTop.textContent = previewMetaText;
  } catch (error) {
    notify(error.message);
    previewList.innerHTML = '<div class="preview-card"><p class="muted">Gagal memuat preview.</p></div>';
    const failedText = 'Gagal memuat preview.';
    renderPaginationPair({
      top: previewPaginationTop,
      bottom: previewPagination,
      metaTop: previewMetaTop,
      metaBottom: previewMeta,
      textTop: failedText,
      textBottom: failedText,
      currentPage: 1,
      totalPages: 1,
      onPageChange: () => undefined,
    });
  }
}

async function collectPublishedPostsForPreview() {
  const allPosts = await fetchPosts();
  return filterPostsByStatus(allPosts, 'publish');
}

document.querySelectorAll('.menu-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    setActiveMenu(btn.dataset.view);
    showView(btn.dataset.view);
  });
});

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((tab) => tab.classList.remove('active'));
    btn.classList.add('active');
    state.activeStatus = btn.dataset.status;
    state.tableOffset = 0;
    loadPosts();
  });
});

postSearchInput.addEventListener('input', () => {
  state.tableSearchQuery = postSearchInput.value.trim().toLowerCase();
  state.tableOffset = 0;
  loadPosts();
});

tablePageSizeSelect.addEventListener('change', () => {
  state.tableLimit = normalizePageValue(tablePageSizeSelect.value, state.tableLimit);
  state.tableOffset = 0;
  loadPosts();
});

previewPageSizeSelect.addEventListener('change', () => {
  state.previewLimit = normalizePageValue(previewPageSizeSelect.value, state.previewLimit);
  state.previewPage = 1;
  loadPreview();
});

// Add new
document.querySelectorAll('[data-save-as]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const payload = {
      title: document.getElementById('addTitle').value.trim(),
      content: document.getElementById('addContent').value.trim(),
      category: document.getElementById('addCategory').value.trim(),
      status: btn.dataset.saveAs,
    };

    try {
      await savePost('/article/', payload);
      notify('Artikel ditambahkan');
      document.getElementById('addForm').reset();
      postCache = [];
      state.activeStatus = 'publish';
      state.tableOffset = 0;
      setActiveMenu('all-posts');
      showView('all-posts');
      loadPosts();
    } catch (error) {
      notify(error.message);
    }
  });
});

// Edit actions
document.querySelector('[data-save-edit-as="publish"]').addEventListener('click', async () => {
  await saveEdit('publish');
});

document.querySelector('[data-save-edit-as="draft"]').addEventListener('click', async () => {
  await saveEdit('draft');
});

document.getElementById('backFromEdit').addEventListener('click', () => {
  clearEditCache();
  showView('all-posts');
  setActiveMenu('all-posts');
});

async function saveEdit(status) {
  const id = document.getElementById('editId').value;
  const payload = {
    title: document.getElementById('editTitle').value.trim(),
    content: document.getElementById('editContent').value.trim(),
    category: document.getElementById('editCategory').value.trim(),
    status,
  };

  try {
    await request(`/article/${id}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    notify('Artikel berhasil diperbarui');
    clearEditCache();
    postCache = [];
    setActiveMenu('all-posts');
    showView('all-posts');
    await loadPosts();
  } catch (error) {
    notify(error.message);
  }
}

showView('all-posts');
