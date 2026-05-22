const BASE_URL = '/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

// Status
export const getStatus = () => fetchJSON('/status');

// Contacts
export const getContacts = () => fetchJSON('/contacts');
export const updateContact = (id, data) =>
  fetchJSON(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteContact = (id) =>
  fetchJSON(`/contacts/${id}`, { method: 'DELETE' });

// Templates
export const getTemplates = () => fetchJSON('/templates');
export const getTemplate = (id) => fetchJSON(`/templates/${id}`);
export const createTemplate = (data) =>
  fetchJSON('/templates', { method: 'POST', body: JSON.stringify(data) });
export const updateTemplate = (id, data) =>
  fetchJSON(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTemplateApi = (id) =>
  fetchJSON(`/templates/${id}`, { method: 'DELETE' });

// Wishes
export const getTodayWishes = () => fetchJSON('/wishes/today');
