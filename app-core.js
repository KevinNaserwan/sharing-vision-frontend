export function normalizeApiBase(base) {
  const value = String(base || '').trim();
  if (!value) {
    return value;
  }
  if (value === '/api') {
    return '/api';
  }
  return value.replace(/\/+$/, '');
}

export function isBackendDomainHost(base) {
  const stripped = String(base || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .toLowerCase();
  return (
    stripped.startsWith('be-sharing-vision.meetsin.id') ||
    stripped.startsWith('127.0.0.1:8000')
  );
}

export function finalizeApiBase(candidate, { isVercel = false, isLocal = false } = {}) {
  const normalized = normalizeApiBase(candidate);
  if (!normalized) {
    return isLocal ? 'http://127.0.0.1:8000' : '/api';
  }

  if (normalized === '/api') {
    return isVercel ? '/api' : (isLocal ? 'http://127.0.0.1:8000' : '/api');
  }

  if (isVercel && isBackendDomainHost(normalized)) {
    return '/api';
  }

  return normalized;
}

export function resolveApiBase({ host, search, windowBase, metaBase }) {
  const normalizedHost = String(host || '').toLowerCase();
  const isVercel = normalizedHost.endsWith('.vercel.app');
  const isLocal =
    normalizedHost === 'localhost' ||
    normalizedHost === '127.0.0.1' ||
    normalizedHost === '0.0.0.0' ||
    normalizedHost === '' ;

  const query = new URLSearchParams(search || '').get('api')?.trim();
  if (query) {
    return finalizeApiBase(query, { isVercel, isLocal });
  }

  if (windowBase) {
    return finalizeApiBase(windowBase.trim(), { isVercel, isLocal });
  }

  if (metaBase) {
    return finalizeApiBase(metaBase.trim(), { isVercel, isLocal });
  }

  return isVercel ? '/api' : (isLocal ? 'http://127.0.0.1:8000' : '/api');
}

export function filterPostsByStatus(posts, status) {
  return (posts || []).filter(
    (post) => String(post.status || '').toLowerCase() === String(status || '').toLowerCase(),
  );
}

export function buildPublishedMeta(post) {
  return {
    id: post.id,
    title: post.title || '',
    category: post.category || '',
    content: post.content || '',
  };
}
