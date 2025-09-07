import React, { useState, useEffect, Suspense } from 'react';
import BottomNavigation from './components/BottomNavigation';
import PostTooltip from './components/PostTooltip';
import { Location } from './types';
import './styles/App.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPins, updatePin, removePin } from './store/slices/pinsSlice';
import { RootState } from './store/store';
import { api, CreatePinRequest } from './services/api';

const MapComponent = React.lazy(() => import('./components/Map'));

const App: React.FC = () => {
  const [currLocation, setCurrLocation] = useState<Location | null>(null);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isTooltipOpen, setIsTooltipOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
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
    console.log('📍 Pins changed, updating locations:', pins.length, 'pins');
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
      '💪': ['manpower'],
      '🫂': ['friendship'],
      '❓': ['other']
    };
    return emojiMap[emoji] || ['other'];
  };

  // Map multiple emojis to combined categories
  const mapEmojisToCategories = (emojis: string[]): string[] => {
    const allCategories = emojis.flatMap(emoji => mapEmojiToCategory(emoji));
    return [...new Set(allCategories)]; // Remove duplicates
  };

  // Map location type to emoji for editing
  const mapLocationTypeToEmoji = (type?: string): string => {
    const typeMap: { [key: string]: string } = {
      'food': '🥖',
      'shelter': '🏠',
      'transportation': '🚗',
      'manpower': '💪',
      'friendship': '🫂',
      'need': '❓',
      'offer': '💪',
    };
    return typeMap[type?.toLowerCase() || ''] || '❓';
  };

  // Map categories array to emojis array for editing
  const mapCategoriesToEmojis = (categories?: string[]): string[] => {
    if (!categories || categories.length === 0) return ['❓'];
    
    const categoryToEmojiMap: { [key: string]: string } = {
      'food': '🥖',
      'shelter': '🏠',
      'transportation': '🚗',
      'manpower': '💪',
      'friendship': '🫂',
      'other': '❓',
    };
    
    return categories.map(cat => categoryToEmojiMap[cat] || '❓');
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
    const isEditing = !!editingLocation;
    
    console.log(`🚀 Starting pin ${isEditing ? 'update' : 'creation'} process...`);
    console.log('📍 User location:', { lat: data.lat, lng: data.lng });
    console.log('📝 Form data:', data);
    
    try {
      if (isEditing) {
        // Handle update - update local state only since backend doesn't support updates
        const originalPin = pins.find(pin => pin.id === editingLocation.id);
        console.log('🔍 Original pin found:', originalPin);
        
        const updatedPin = {
          ...originalPin!,
          body: data.message,
          categories: mapEmojisToCategories(data.emojis),
          lat: data.lat,
          lng: data.lng,  // Pin uses lng, data comes with lng
        };
        
        console.log('🔄 Updating pin locally...');
        console.log('📝 Updated pin data:', updatedPin);
        dispatch(updatePin(updatedPin));
        
        // Show success message
        console.log(`✅ Location updated successfully!\nID: ${editingLocation.id}`);
        
      } else {
        // Handle create - existing logic
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
        console.log(`✅ Help request posted successfully!\nID: ${newPin.id}\nLocation: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to ${isEditing ? 'update' : 'create'} pin:`, error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Show user-friendly error
      alert(`❌ Failed to ${isEditing ? 'update' : 'post'} help request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Re-throw to let PostTooltip handle the error
    }
  };

  const handleTooltipClose = () => {
    setIsTooltipOpen(false);
    setEditingLocation(null);
  };

  const handleEditLocation = (location: Location) => {
    console.log('🔧 Edit location clicked:', location);
    setEditingLocation(location);
    setIsTooltipOpen(true);
  };

  const handleDeleteLocation = async (id: string) => {
    console.log('🗑️ Delete location clicked:', id);
    try {
      // Call API to dismiss/hide the pin on the backend
      await api.dismissPin(id, getAnonUserId());
      console.log('✅ Pin dismissed successfully on backend');
      
      // Remove from local state
      dispatch(removePin(id));
      
      // Show success message as a toast message
      // alert('✅ Post deleted successfully!');
      
    } catch (error) {
      console.error('❌ Failed to delete pin:', error);
      alert(`❌ Failed to delete post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        <MapComponent 
          locations={filteredLocations} 
          currLocation={currLocation || locations[0]} 
          onEditLocation={handleEditLocation}
        />
      </Suspense>
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <PostTooltip 
        isOpen={isTooltipOpen} 
        onClose={handleTooltipClose} 
        onSubmit={handlePostSubmit} 
        onDelete={handleDeleteLocation}
        editData={editingLocation ? (() => {
          // Find the original pin to get categories
          const originalPin = pins.find(pin => pin.id === editingLocation.id);
          const editData = {
            id: editingLocation.id,
            emojis: originalPin ? mapCategoriesToEmojis(originalPin.categories) : [mapLocationTypeToEmoji(editingLocation.type)],
            message: editingLocation.description,
            lat: editingLocation.lat,
            lng: editingLocation.lon  // Location uses 'lon', but PostTooltip expects 'lng'
          };
          console.log('📝 Passing editData to PostTooltip:', editData);
          return editData;
        })() : undefined}
      />
    </div>
  );
};

export default React.memo(App);
