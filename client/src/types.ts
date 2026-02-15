export type ServiceCategory = 'bricolage' | 'jardin' | 'informatique' | 'admin' | 'montage' | 'peinture' | 'karcher';

export interface ServiceDef {
  id: ServiceCategory;
  title: string;
  icon: string;
  color: string;
  description: string;
  longDescription?: string; // Added for the detail view
}

export interface BookingSlot {
  date: string; // ISO date string YYYY-MM-DD
  time: string; // HH:mm
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface ContactDetails {
  name: string;
  phone: string;
  zip: string;
  address: string;
  email: string;
}

export interface ServiceRequest {
  id: string;
  userId: string | 'guest';
  category: ServiceCategory;
  description: string;
  photos: string[]; // Base64 strings or URLs
  booking: BookingSlot;
  contact: ContactDetails;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: number;
}