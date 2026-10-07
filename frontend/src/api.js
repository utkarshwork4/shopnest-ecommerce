const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const apiFetch = (path, options) =>
  fetch(`${API_BASE_URL}${path}`, options);
