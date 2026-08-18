const state = {
  activeView: 'all-posts',
  activeStatus: 'publish',
  editId: null,
  previewOffset: 0,
  previewLimit: 5,
};

const API_BASE = 'http://localhost:8000';
const views = ['all-posts', 'add-new', 'edit-post', 'preview'];

const tableBody = document.getElementById('postsTableBody');
const previewList = document.getElementById('previewList');
let postCache = [];

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

  if (view === 'all-posts') loadPosts();
  if (view === 'preview') loadPreview();
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}

async function fetchPostsForTable() {
  const response = await request('/article/200/0');
  postCache = Array.isArray(response) ? response : [];
  return postCache;
}

async function loadPosts() {
  try {
    const posts = await fetchPostsForTable();
    const rows = posts.filter((post) => post.status === state.activeStatus);

    tableBody.innerHTML = '';
    if (!rows.length) {
      tableBody.innerHTML = '<tr><td colspan="3" class="muted">Tidak ada data.</td></tr>';
      return;
    }

    for (const post of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(post.title)}</td>
        <td>${escapeHtml(post.category)}</td>
        <td>
          <div class="action-icons">
            <button class="action-btn" data-action="edit" data-id="${post.id}" title="Edit">✏️</button>
            <button class="action-btn trash" data-action="trash" data-id="${post.id}" title="Pindahkan ke Trashed">🗑️</button>
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
  } catch (error) {
    notify(error.message);
    tableBody.innerHTML = '<tr><td colspan="3" class="muted">Gagal memuat data.</td></tr>';
  }
}

async function openEdit(id) {
  const post = postCache.find((item) => String(item.id) === String(id));
  if (!post) return;

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

  try {
    await request(`/article/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...post,
        status: 'thrash',
      }),
    });

    notify('Dipindahkan ke trash');
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
  document.getElementById('editForm').reset?.();
}

async function loadPreview() {
  try {
    const posts = await request(`/article/${state.previewLimit}/${state.previewOffset}`);
    const published = Array.isArray(posts) ? posts.filter((p) => p.status === 'publish') : [];

    previewList.innerHTML = '';
    if (!published.length) {
      previewList.innerHTML = '<div class="preview-card"><p class="muted">Tidak ada artikel publish.</p></div>';
    }

    for (const post of published) {
      const article = document.createElement('article');
      article.className = 'preview-card';
      article.innerHTML = `
        <h3 class="preview-title">${escapeHtml(post.title)}</h3>
        <p class="preview-cat">${escapeHtml(post.category)} • #${post.id}</p>
        <p class="preview-content">${escapeHtml(post.content).slice(0, 250)}...</p>
      `;
      previewList.appendChild(article);
    }

    document.getElementById('previewPrev').disabled = state.previewOffset === 0;
    document.getElementById('previewNext').disabled = posts.length < state.previewLimit;
  } catch (error) {
    notify(error.message);
  }
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
    loadPosts();
  });
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
      state.activeStatus = 'publish';
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
    setActiveMenu('all-posts');
    showView('all-posts');
    await loadPosts();
  } catch (error) {
    notify(error.message);
  }
}

// Preview pagination
document.getElementById('previewPrev').addEventListener('click', () => {
  if (state.previewOffset > 0) {
    state.previewOffset = Math.max(0, state.previewOffset - state.previewLimit);
    loadPreview();
  }
});

document.getElementById('previewNext').addEventListener('click', () => {
  state.previewOffset += state.previewLimit;
  loadPreview();
});

showView('all-posts');
loadPosts();
