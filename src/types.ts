export interface Location {
  id: string;
  name: string;
  description: string;
  lat: number;
  lon: number;
  moreInfoUrl?: string;
  mainImg?: string;
  imageUrls?: string[];
  type?: string;
  urgency?: number;
}
