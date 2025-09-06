// API service for communicating with FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Pin {
  id: string;
  kind: 'need' | 'offer';
  categories: string[];
  title?: string;
  body: string;
  lat: number;
  lng: number;
  urgency: 1 | 2 | 3;
  author_anon_id: string;
  created_at: string;
  expires_at: string;
  distance_mi?: number;
}

export interface CreatePinRequest {
  kind: 'need' | 'offer';
  categories: string[];
  title?: string;
  body: string;
  lat: number;
  lng: number;
  urgency: 1 | 2 | 3;
  author_anon_id: string;
}

export interface Comment {
  id: string;
  pin_id: string;
  body: string;
  created_at: string;
}

export interface CreateCommentRequest {
  body: string;
  author_anon_id: string;
}

export interface Shelter {
  id?: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  capacity?: string;
  notes?: string;
  last_updated?: string;
}

export interface FoodSite {
  id?: string;
  name: string;
  kind: 'free_food' | 'drop_off';
  lat: number;
  lng: number;
  status?: string;
  needs?: string;
  source: string;
  last_updated?: string;
}

class ReliefLinkAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Pins API
  async getPins(params?: {
    kinds?: string[];
    categories?: string[];
    center?: [number, number];
    radius?: number;
  }): Promise<Pin[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.kinds) searchParams.set('kinds', params.kinds.join(','));
    if (params?.categories) searchParams.set('categories', params.categories.join(','));
    if (params?.center) searchParams.set('center', `${params.center[0]},${params.center[1]}`);
    if (params?.radius) searchParams.set('radius', params.radius.toString());
    
    const queryString = searchParams.toString();
    const endpoint = `/api/pins${queryString ? `?${queryString}` : ''}`;
    
    return this.request<Pin[]>(endpoint);
  }

  async createPin(pin: CreatePinRequest): Promise<Pin> {
    return this.request<Pin>('/api/pins', {
      method: 'POST',
      body: JSON.stringify(pin),
    });
  }

  async getComments(pinId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/api/pins/${pinId}/comments`);
  }

  async addComment(pinId: string, comment: CreateCommentRequest): Promise<Comment> {
    return this.request<Comment>(`/api/pins/${pinId}/comments`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  }

  async reportPin(pinId: string): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>(`/api/pins/${pinId}/report`, {
      method: 'POST',
    });
  }

  async dismissPin(pinId: string, authorAnonId: string): Promise<{ ok: boolean }> {
    const searchParams = new URLSearchParams({ author_anon_id: authorAnonId });
    return this.request<{ ok: boolean }>(`/api/pins/${pinId}/dismiss?${searchParams}`, {
      method: 'POST',
    });
  }

  // Reference Data API
  async getShelters(): Promise<Shelter[]> {
    return this.request<Shelter[]>('/api/shelters');
  }

  async getFoodSites(): Promise<FoodSite[]> {
    return this.request<FoodSite[]>('/api/food');
  }

  // Feeds API
  async getHouston311(): Promise<any> {
    return this.request<any>('/api/311');
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/healthz');
  }
}

export const api = new ReliefLinkAPI();
