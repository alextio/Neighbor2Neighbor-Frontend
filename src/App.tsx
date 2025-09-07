import React, { useState, useEffect, Suspense } from 'react';
import BottomNavigation from './components/BottomNavigation';
import PostTooltip from './components/PostTooltip';
import { Location } from './types';
import './styles/App.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPins } from './store/slices/pinsSlice';
import { fetchHouston311 } from './store/slices/houston311Slice';
import { fetchShelters } from './store/slices/sheltersSlice';
import { fetchFoodSites } from './store/slices/foodSlice';
import { RootState } from './store/store';
import { api, CreatePinRequest } from './services/api';

const MapComponent = React.lazy(() => import('./components/Map'));

const App: React.FC = () => {
  const [currLocation, setCurrLocation] = useState<Location | null>(null);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isTooltipOpen, setIsTooltipOpen] = useState<boolean>(false);
  const dispatch = useDispatch();

  // Get data from Redux store
  const { pins } = useSelector((state: RootState) => state.pins);
  const { data: houston311Data } = useSelector((state: RootState) => state.houston311);
  const { shelters } = useSelector((state: RootState) => state.shelters);
  const { foodSites } = useSelector((state: RootState) => state.food);

  // Convert pins to locations for compatibility
  const pinLocations: Location[] = pins.map(pin => ({
    id: pin.id,
    name: pin.title || `${pin.kind} - ${pin.categories.join(', ')}`,
    lat: pin.lat,
    lon: pin.lng,
    description: pin.body,
    type: pin.kind,
    urgency: pin.urgency,
  }));

  // Convert Houston 311 data to locations
  const houston311Locations: Location[] = houston311Data?.features.map(feature => ({
    id: `311-${feature.geometry.coordinates[0]}-${feature.geometry.coordinates[1]}-${feature.properties.category}`,
    name: `311: ${feature.properties.category}`,
    lat: feature.geometry.coordinates[1], // GeoJSON uses [lng, lat]
    lon: feature.geometry.coordinates[0],
    description: `Houston 311 report: ${feature.properties.category}${feature.properties.updated ? ` (Updated: ${new Date(feature.properties.updated).toLocaleDateString()})` : ''}`,
    type: '311',
    urgency: 1, // Default urgency for 311 reports
  })) || [];

  // Convert shelters to locations
  const shelterLocations: Location[] = shelters.map(shelter => ({
    id: shelter.id || `shelter-${shelter.lat}-${shelter.lng}`,
    name: shelter.name,
    lat: shelter.lat,
    lon: shelter.lng,
    description: `${shelter.type} shelter${shelter.capacity ? ` - ${shelter.capacity}` : ''}${shelter.notes ? ` - ${shelter.notes}` : ''}`,
    type: 'shelter',
    urgency: 2,
  }));

  // Convert food sites to locations
  const foodLocations: Location[] = foodSites.map(foodSite => ({
    id: foodSite.id || `food-${foodSite.lat}-${foodSite.lng}`,
    name: foodSite.name,
    lat: foodSite.lat,
    lon: foodSite.lng,
    description: `${foodSite.kind === 'free_food' ? 'Free food' : 'Food drop-off'} site${foodSite.status ? ` - ${foodSite.status}` : ''}${foodSite.needs ? ` - Needs: ${foodSite.needs}` : ''}`,
    type: 'food',
    urgency: 2,
  }));

  // Combine all locations
  const locations: Location[] = [...pinLocations, ...houston311Locations, ...shelterLocations, ...foodLocations];

  // Fetch data from API
  useEffect(() => {
    dispatch(fetchPins() as any);
    dispatch(fetchHouston311() as any);
    dispatch(fetchShelters() as any);
    dispatch(fetchFoodSites() as any);
  }, [dispatch]);

  // Update filtered locations when any data changes
  useEffect(() => {
    setFilteredLocations(locations);
    if (locations.length > 0 && !currLocation) {
      setCurrLocation(locations[0]);
    }
  }, [pins, houston311Data, shelters, foodSites, currLocation]);


  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setIsTooltipOpen(true);
    } else {
      setActiveTab(tab);
      console.log('Active tab changed to:', tab);
    }
  };

  // Map emojis to categories for API
  const mapEmojisToCategories = (emojis: string[]): string[] => {
    const emojiMap: { [key: string]: string[] } = {
      '🥖': ['food'],
      '🏠': ['shelter'],
      '🚗': ['transportation'],
      '❓': ['other']
    };
    
    const categories = new Set<string>();
    emojis.forEach(emoji => {
      const emojiCategories = emojiMap[emoji] || ['other'];
      emojiCategories.forEach(cat => categories.add(cat));
    });
    
    return Array.from(categories);
  };

  // Generate anonymous user ID (in real app, this would be more sophisticated)
  const getAnonUserId = (): string => {
    let anonId = localStorage.getItem('anon_user_id');
    if (!anonId) {
      anonId = 'anon_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('anon_user_id', anonId);
    }
    return anonId;
  };

  const handlePostSubmit = async (data: { emojis: string[]; message: string; images: File[]; lat: number; lng: number }) => {
    console.log('🚀 Starting pin submission process...');
    console.log('📍 User location:', { lat: data.lat, lng: data.lng });
    console.log('📝 Form data:', data);
    
    try {
      const pinRequest: CreatePinRequest = {
        kind: 'need', // All posts from this form are help requests
        categories: mapEmojisToCategories(data.emojis),
        body: data.message,
        lat: data.lat,
        lng: data.lng,
        urgency: 2, // Default to medium urgency
        author_anon_id: getAnonUserId()
      };

      console.log('📤 API Request payload:', pinRequest);
      console.log('🌐 API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:8000');
      
      const newPin = await api.createPin(pinRequest);
      console.log('✅ Pin created successfully!');
      console.log('📋 Response data:', newPin);
      
      // Refresh pins to show the new marker
      console.log('🔄 Refreshing pins list...');
      dispatch(fetchPins() as any);
      
      // Show success message
      alert(`✅ Help request posted successfully!\nID: ${newPin.id}\nLocation: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
      
    } catch (error) {
      console.error('❌ Failed to create pin:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Show user-friendly error
      alert(`❌ Failed to post help request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Re-throw to let PostTooltip handle the error
    }
  };

  const handleTooltipClose = () => {
    setIsTooltipOpen(false);
  };

  return (
    <div className="h-screen w-screen m-0 p-0 overflow-hidden">
      {/* <ApiStatus /> */}
      {/* <Sidebar
        locations={filteredLocations}
        searchInputRef={searchInputRef}
        onLocationSelect={handleLocationSelect}
        handleSearch={handleSearch}
      /> */}
      <Suspense fallback={<div>Loading map...</div>}>
        <MapComponent locations={filteredLocations} currLocation={currLocation || locations[0]} />
      </Suspense>
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <PostTooltip 
        isOpen={isTooltipOpen} 
        onClose={handleTooltipClose} 
        onSubmit={handlePostSubmit} 
      />
    </div>
  );
};

export default React.memo(App);
