import { ServiceRequest, User } from '../types';

// En PROD (Vercel), VITE_API_URL sera défini (ex: https://mon-backend.onrender.com/api)
// En DEV, il est vide, donc on utilise '/api' qui passe par le proxy Vite
const BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://pastore-backend.onrender.com/api"
    : "/api";

// Suppression du slash final s'il existe pour éviter les doubles slashs
const API_URL = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

export const ApiService = {
  getToken: () => localStorage.getItem('pastore_token'),
  
  getUser: (): User | null => {
    const data = localStorage.getItem('pastore_user');
    return data ? JSON.parse(data) : null;
  },

  _handleResponse: async (res: Response) => {
    if (!res.ok) {
        let errorMessage = 'Une erreur est survenue';
        try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
            errorMessage = res.statusText;
        }
        throw new Error(errorMessage);
    }
    return res.json();
  },

  register: async (name: string, email: string, phone: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    
    const data = await ApiService._handleResponse(res);
    localStorage.setItem('pastore_token', data.token);
    localStorage.setItem('pastore_user', JSON.stringify(data.user));
    return data.user;
  },

  login: async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await ApiService._handleResponse(res);
    localStorage.setItem('pastore_token', data.token);
    localStorage.setItem('pastore_user', JSON.stringify(data.user));
    return data.user;
  },

  forgotPassword: async (email: string): Promise<{message: string}> => {
    const res = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    return await ApiService._handleResponse(res);
  },

  logout: () => {
    localStorage.removeItem('pastore_user');
    localStorage.removeItem('pastore_token');
  },

  createRequest: async (
    requestData: Omit<ServiceRequest, 'id' | 'createdAt' | 'status' | 'photos'>,
    photoFiles: File[]
  ): Promise<ServiceRequest> => {
    
    const formData = new FormData();
    formData.append('data', JSON.stringify(requestData));
    
    photoFiles.forEach(file => {
      formData.append('photos', file);
    });

    const token = ApiService.getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers,
      body: formData
    });

    return await ApiService._handleResponse(res);
  },

  getRequests: async (): Promise<ServiceRequest[]> => {
    const token = ApiService.getToken();
    if (!token) return [];

    const res = await fetch(`${API_URL}/requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) return [];
    return await res.json();
  },

  deleteRequest: async (id: string): Promise<void> => {
    const token = ApiService.getToken();
    const res = await fetch(`${API_URL}/requests/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await ApiService._handleResponse(res);
  }
};