import { ServiceRequest, User } from '../types';

const BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://pastore-backend.onrender.com/api"
    : "http://localhost:3000/api";

const API_URL = BASE_URL;

export const ApiService = {
  // Gestion du token JWT
  getToken: () => localStorage.getItem('pastore_token'),
  
  getUser: (): User | null => {
    const data = localStorage.getItem('pastore_user');
    return data ? JSON.parse(data) : null;
  },

  register: async (name: string, email: string, phone: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    
    if (!res.ok) throw new Error('Erreur inscription');
    
    const data = await res.json();
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

    if(!res.ok) throw new Error('Identifiants invalides');

    const data = await res.json();
    localStorage.setItem('pastore_token', data.token);
    localStorage.setItem('pastore_user', JSON.stringify(data.user));
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('pastore_user');
    localStorage.removeItem('pastore_token');
  },

  // Modification : Accepte maintenant un tableau de File pour les photos
  createRequest: async (
    requestData: Omit<ServiceRequest, 'id' | 'createdAt' | 'status' | 'photos'>,
    photoFiles: File[]
  ): Promise<ServiceRequest> => {
    
    const formData = new FormData();
    // On passe les données textuelles en JSON stringifié
    formData.append('data', JSON.stringify(requestData));
    
    // On ajoute les fichiers
    photoFiles.forEach(file => {
      formData.append('photos', file);
    });

    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: {
        // Ne PAS mettre Content-Type ici, fetch le fait automatiquement pour FormData avec le boundary
      },
      body: formData
    });

    if (!res.ok) throw new Error("Erreur lors de l'envoi");
    
    return await res.json();
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
    await fetch(`${API_URL}/requests/${id}`, {
      method: 'DELETE'
    });
  }
};