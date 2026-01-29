import { getToken } from './token';
import { socketId } from './socket';
const isAdminUrl = (url: string): boolean => {
  return url.startsWith('/admin');
};

export const fetchData = async <T = unknown>(
  url: string,
  data?: object,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET'
): Promise<T> => {
  const token = getToken();
  const isAdmin = isAdminUrl(url);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (isAdmin) {
    if (!token) {
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
      throw new Error('Unauthorized: Admin token required');
    }
    headers['Authorization'] = `Bearer ${token}`;
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (socketId) {
    headers['x-socket-id'] = socketId;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(apiUrl + url, {
    headers,
    method,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (isAdmin && response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const postData = async <T = unknown>(url: string, data?: object): Promise<T> => {
  return fetchData(url, data, 'POST');
};

export const getData = async <T = unknown>(url: string): Promise<T> => {
  return fetchData(url, undefined, 'GET');
};

export const putData = async <T = unknown>(url: string, data?: object): Promise<T> => {
  return fetchData(url, data, 'PUT');
};