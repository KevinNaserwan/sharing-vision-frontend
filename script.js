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
const views = ['all-posts', 'add-new', 'edit-post', 'preview', 'article-view'];

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
const articleTitle = document.getElementById('articleTitle');
const articleMeta = document.getElementById('articleMeta');
const articleCategory = document.getElementById('articleCategory');
const articleContent = document.getElementById('articleContent');
const backFromPreview = document.getElementById('backFromPreview');
const confirmModal = document.getElementById('confirmModal');
const confirmModalTitle = document.getElementById('confirmModalTitle');
const confirmModalMessage = document.getElementById('confirmModalMessage');
const confirmOkBtn = document.getElementById('confirmOkBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');

let postCache = [];
let confirmResolver = null;

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
    const msg = formatApiError(payload, response.status);
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

function formatApiError(payload, status) {
  if (!payload) {
    return `HTTP ${status}`;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  const asString = (value) => {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  };

  if (typeof payload.errors === 'object' && payload.errors !== null) {
    const map = {
      title: 'Judul',
      content: 'Konten',
      category: 'Kategori',
      status: 'Status',
    };

    const collect = [];

    if (Array.isArray(payload.errors)) {
      payload.errors.forEach((item) => {
        if (!item) return;
        if (typeof item === 'string') {
          const parsed = asString(item);
          if (parsed) collect.push(parsed);
          return;
        }
        if (typeof item.field === 'string' && typeof item.message === 'string') {
          collect.push(`${map[item.field] || item.field}: ${item.message}`);
        }
      });
    } else {
      Object.entries(payload.errors)
        .forEach(([field, reason]) => {
          const text = asString(reason);
          if (text) {
            collect.push(`${map[field] || field}: ${text}`);
          }
        });
    }

    const fieldMessages = collect
      .filter((line) => line.length > 0);

    if (fieldMessages.length > 0) {
      return `Validasi gagal: ${fieldMessages.join('; ')}`;
    }
  }

  if (typeof payload.error === 'string' && payload.error.length > 0) {
    const msg = payload.error.trim();
    const lower = msg.toLowerCase();

    if (lower === 'validation failed' && typeof payload.message === 'string') {
      const msgLower = payload.message.toLowerCase();
      if (msgLower.includes('validation')) {
        return 'Validasi gagal: perbaiki data sesuai aturan validasi';
      }
      return payload.message;
    }

    if (msg.startsWith('{') || msg.startsWith('[')) {
      try {
        const parsed = JSON.parse(msg);
        if (typeof parsed === 'object' && parsed !== null) {
          const maybeErrors = parsed.errors;
          const map = {
            title: 'Judul',
            content: 'Konten',
            category: 'Kategori',
            status: 'Status',
          };

          const collect = [];
          if (maybeErrors) {
            if (Array.isArray(maybeErrors)) {
              maybeErrors.forEach((item) => {
                if (!item) return;
                if (typeof item.field === 'string' && typeof item.message === 'string') {
                  collect.push(`${map[item.field] || item.field}: ${item.message}`);
                }
              });
            } else {
              Object.entries(maybeErrors).forEach(([field, reason]) => {
                const text = asString(reason);
                if (text) collect.push(`${map[field] || field}: ${text}`);
              });
            }
          }

          if (collect.length > 0) {
            return `Validasi gagal: ${collect.join('; ')}`;
          }
        }
      } catch {
        // fallback below
      }
    }

    if (/validation/i.test(msg) && payload.message !== msg) {
      return `Validasi gagal: ${msg}`;
    }
    return msg;
  }

  if (typeof payload.message === 'string' && payload.message.length > 0) {
    return payload.message;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return `HTTP ${status}`;
  }
}

function notify(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const valid = new Set(['success', 'error', 'info']);
  const normalized = valid.has(type) ? type : 'info';
  toast.classList.remove('success', 'error', 'info');
  toast.classList.add(normalized);

  toast.textContent = message;
  toast.classList.add('show');

  if (toast.__timeout) {
    clearTimeout(toast.__timeout);
  }
  toast.__timeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

function closeConfirmModal() {
  if (!confirmModal) return;
  confirmModal.classList.remove('is-open');
  confirmModal.setAttribute('aria-hidden', 'true');
  if (confirmResolver) {
    const done = confirmResolver;
    confirmResolver = null;
    done(false);
  }
}

function askConfirm({
  title = 'Konfirmasi',
  message = 'Lanjutkan aksi ini?',
  confirmText = 'Ya',
  cancelText = 'Batal',
}) {
  if (!confirmModal || !confirmModalTitle || !confirmModalMessage || !confirmOkBtn || !confirmCancelBtn) {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise((resolve) => {
    if (confirmResolver) {
      const prev = confirmResolver;
      confirmResolver = null;
      prev(false);
    }

    confirmResolver = resolve;
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmOkBtn.textContent = confirmText;
    confirmCancelBtn.textContent = cancelText;

    confirmModal.classList.add('is-open');
    confirmModal.setAttribute('aria-hidden', 'false');
  });
}

confirmOkBtn?.addEventListener('click', () => {
  if (!confirmModal) return;
  confirmModal.classList.remove('is-open');
  confirmModal.setAttribute('aria-hidden', 'true');
  if (confirmResolver) {
    const done = confirmResolver;
    confirmResolver = null;
    done(true);
  }
});

confirmCancelBtn?.addEventListener('click', closeConfirmModal);

if (confirmModal) {
  confirmModal.addEventListener('click', (event) => {
    if (event.target === confirmModal) {
      closeConfirmModal();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (!confirmModal?.classList.contains('is-open')) {
    return;
  }
  if (event.key === 'Escape') {
    closeConfirmModal();
  }
});

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

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function formatPreviewDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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

function renderNumberedPagination(container, {
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast,
}) {
  container.innerHTML = '';
  if (totalPages < 2) {
    if (showFirstLast) {
      const prev = renderNavButton({ label: 'Previous', page: 1, disabled: true });
      const next = renderNavButton({ label: 'Next', page: 1, disabled: true });
      container.append(prev, next);
    }
    return;
  }

  if (showFirstLast) {
    const prevDisabled = currentPage <= 1;
    container.appendChild(
      renderNavButton({
        label: 'Previous',
        page: Math.max(1, currentPage - 1),
        disabled: prevDisabled,
        onPageChange,
      }),
    );
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

  if (showFirstLast) {
    const nextDisabled = currentPage >= totalPages;
    container.appendChild(
      renderNavButton({
        label: 'Next',
        page: Math.min(totalPages, currentPage + 1),
        disabled: nextDisabled,
        onPageChange,
      }),
    );
  }
}

function renderNavButton({ label, page, onPageChange, disabled }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'page-btn page-nav';
  btn.textContent = label;
  if (disabled) {
    btn.disabled = true;
    return btn;
  }
  btn.addEventListener('click', () => {
    onPageChange(page);
  });
  return btn;
}

function resolvePublishedById(id) {
  const post = postCache.find((item) => String(item.id) === String(id));
  if (post) return post;
  return null;
}

function formatArticleDate(dateValue) {
  return formatPreviewDate(dateValue);
}

function renderArticlePage(post) {
  if (!articleTitle || !articleMeta || !articleCategory || !articleContent || !post) {
    return;
  }

  const title = normalizeText(post.title);
  const category = normalizeText(post.category);
  const dateText = formatArticleDate(post.updated_date || post.created_date);
  const content = String(post.content || '').trim();

  articleTitle.textContent = title || 'Artikel';
  articleCategory.textContent = category ? `Kategori: ${category}` : '';

  articleMeta.innerHTML = '';
  if (dateText) {
    const publishedDate = document.createElement('span');
    publishedDate.textContent = dateText;
    articleMeta.appendChild(publishedDate);
  }

  articleContent.textContent = content || 'Tidak ada konten artikel.';
  showView('article-view');
  setActiveMenu('preview');
}

async function openArticlePage(articleId) {
  const cached = resolvePublishedById(articleId);
  if (cached) {
    renderArticlePage(cached);
    return;
  }

  try {
    const fetched = await request(`/article/${articleId}`);
    if (fetched) {
      renderArticlePage(fetched);
    }
  } catch {
    notify('Gagal memuat artikel untuk dibaca selengkapnya', 'error');
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
    renderNumberedPagination(top, {
      currentPage,
      totalPages,
      onPageChange,
      showFirstLast: true,
    });
  }
  if (bottom) {
    renderNumberedPagination(bottom, {
      currentPage,
      totalPages,
      onPageChange,
      showFirstLast: true,
    });
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
    notify(error.message, 'error');
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
    notify('Data tidak ditemukan', 'error');
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
    notify('Data tidak ditemukan', 'error');
    return;
  }

  if (getStatus(post) === 'thrash') {
    notify('Artikel sudah dalam Trashed', 'error');
    return;
  }

  try {
    const approved = await askConfirm({
      title: 'Pindahkan ke Trashed',
      message: `Yakin ingin memindahkan artikel "${post.title}" ke Trashed?`,
      confirmText: 'Ya, Pindahkan',
      cancelText: 'Batal',
    });
    if (!approved) return;

    await request(`/article/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...post,
        status: 'thrash',
      }),
    });

    notify('Dipindahkan ke trash', 'success');
    postCache = [];
    await loadPosts();
  } catch (error) {
    notify(error.message, 'error');
  }
}

async function moveToDraft(id) {
  const post = postCache.find((item) => String(item.id) === String(id));
  if (!post) {
    notify('Data tidak ditemukan', 'error');
    return;
  }

  if (getStatus(post) === 'draft') {
    notify('Artikel sudah dalam draft', 'error');
    return;
  }

  try {
    const approved = await askConfirm({
      title: 'Kembalikan ke Draft',
      message: `Yakin ingin mengembalikan artikel "${post.title}" ke Draft?`,
      confirmText: 'Ya, Kembalikan',
      cancelText: 'Batal',
    });
    if (!approved) return;

    await request(`/article/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...post,
        status: 'draft',
      }),
    });

    notify('Status artikel dikembalikan ke Draft', 'success');
    postCache = [];
    await loadPosts();
  } catch (error) {
    notify(error.message, 'error');
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
        <article class="preview-article is-empty">
          <h3 class="preview-title">Belum ada artikel publish</h3>
          <p class="preview-meta">
            Gunakan tab <strong>Add New</strong> lalu klik <strong>Publish</strong> untuk menampilkan artikel di preview.
          </p>
        </article>
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
      article.className = 'preview-article';
      const category = normalizeText(post.category);
      const title = normalizeText(post.title);
      const dateText = formatPreviewDate(post.updated_date || post.created_date);
      const excerpt = normalizeText(post.content) || 'Tidak ada konten artikel.';
      const readTime = Math.max(1, Math.round((normalizeText(post.content || '').split(' ').filter(Boolean).length || 0) / 140));

      const visualText = title ? title.slice(0, 2).toUpperCase() : 'AR';

      article.innerHTML = `
        <div class="preview-visual" aria-hidden="true">
          <span>${escapeHtml(visualText)}</span>
        </div>
        <div class="preview-content-body">
          <div class="preview-article-header">
            <h3 class="preview-title">${escapeHtml(post.title)}</h3>
            <span class="preview-status">Publish</span>
          </div>
          <div class="preview-meta">
            ${dateText ? `<span>${escapeHtml(dateText)}</span>` : ''}
            ${category ? `<span class="meta-sep"></span><span class="preview-cat">${escapeHtml(category)}</span>` : ''}
            <span class="meta-sep"></span>
            <span>${readTime} min read</span>
          </div>
          <p class="preview-excerpt">${escapeHtml(excerpt || 'Tidak ada konten artikel.')}</p>
    <div class="preview-footer">
            <a
              href="#"
              class="preview-read-link"
              data-preview-read-id="${escapeHtml(String(post.id))}"
              aria-label="Baca ${escapeHtml(title)}"
            >
              Baca selengkapnya →
            </a>
          </div>
        </div>
      `;
      previewList.appendChild(article);
    }

    previewList.querySelectorAll('[data-preview-read-id]').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.preventDefault();
        openArticlePage(el.dataset.previewReadId);
      });
    });

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
    notify(error.message, 'error');
    previewList.innerHTML = '<article class="preview-article is-empty"><p class="preview-title">Gagal memuat preview.</p><p class="preview-meta">Cek koneksi ke endpoint lalu coba lagi.</p></article>';
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
      notify('Artikel ditambahkan', 'success');
      document.getElementById('addForm').reset();
      postCache = [];
      state.activeStatus = 'publish';
      state.tableOffset = 0;
      setActiveMenu('all-posts');
      showView('all-posts');
      loadPosts();
    } catch (error) {
      notify(error.message, 'error');
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

if (backFromPreview) {
  backFromPreview.addEventListener('click', () => {
    showView('preview');
    setActiveMenu('preview');
  });
}

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

    notify('Artikel berhasil diperbarui', 'success');
    clearEditCache();
    postCache = [];
    setActiveMenu('all-posts');
    showView('all-posts');
    await loadPosts();
  } catch (error) {
    notify(error.message, 'error');
  }
}

showView('all-posts');
