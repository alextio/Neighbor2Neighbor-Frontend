import React, { useState, useEffect, Suspense } from 'react';
import BottomNavigation from './components/BottomNavigation';
import PostTooltip from './components/PostTooltip';
import { Location } from './types';
import './styles/App.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPins } from './store/slices/pinsSlice';
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

  // Convert pins to locations for compatibility
  const locations: Location[] = pins.map(pin => ({
    id: pin.id,
    name: pin.title || `${pin.kind} - ${pin.categories.join(', ')}`,
    lat: pin.lat,
    lon: pin.lng,
    description: pin.body,
    type: pin.kind,
    urgency: pin.urgency,
  }));

  // Fetch data from API
  useEffect(() => {
    dispatch(fetchPins() as any);
  }, [dispatch]);

  // Update filtered locations when pins change
  useEffect(() => {
    setFilteredLocations(locations);
    if (locations.length > 0 && !currLocation) {
      setCurrLocation(locations[0]);
    }
  }, [pins, currLocation]);


  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setIsTooltipOpen(true);
    } else {
      setActiveTab(tab);
      console.log('Active tab changed to:', tab);
    }
  };

  // Map emoji to categories for API
  const mapEmojiToCategory = (emoji: string): string[] => {
    const emojiMap: { [key: string]: string[] } = {
      '🥖': ['food'],
      '🏠': ['shelter'],
      '🚗': ['transportation'],
      '❓': ['other']
    };
    return emojiMap[emoji] || ['other'];
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

  const handlePostSubmit = async (data: { emoji: string; message: string; images: File[]; lat: number; lng: number }) => {
    console.log('🚀 Starting pin submission process...');
    console.log('📍 User location:', { lat: data.lat, lng: data.lng });
    console.log('📝 Form data:', data);
    
    try {
      const pinRequest: CreatePinRequest = {
        kind: 'need', // All posts from this form are help requests
        categories: mapEmojiToCategory(data.emoji),
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
