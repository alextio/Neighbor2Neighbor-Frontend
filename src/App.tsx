import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import BottomNavigation from './components/BottomNavigation';
import PostTooltip from './components/PostTooltip';
import { Location } from './types';
import './styles/App.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPins, updatePin, removePin } from './store/slices/pinsSlice';
import { fetchHouston311 } from './store/slices/houston311Slice';
import { fetchShelters } from './store/slices/sheltersSlice';
import { fetchFoodSites } from './store/slices/foodSlice';
import { RootState } from './store/store';
import { api, CreatePinRequest } from './services/api';
import { useToast } from './components/ui/toast';

const MapComponent = React.lazy(() => import('./components/Map'));

const App: React.FC = () => {
  const [currLocation, setCurrLocation] = useState<Location | null>(null);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isTooltipOpen, setIsTooltipOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const dispatch = useDispatch();
  const { success, error } = useToast();

  // Get data from Redux store
  const { pins } = useSelector((state: RootState) => state.pins);
  const { data: houston311Data } = useSelector((state: RootState) => state.houston311);
  const { shelters } = useSelector((state: RootState) => state.shelters);
  const { foodSites } = useSelector((state: RootState) => state.food);

  // Convert pins to locations for compatibility - memoized to prevent unnecessary re-renders
  const pinLocations: Location[] = useMemo(() => 
    pins.map(pin => ({
      id: pin.id,
      name: pin.title || `${pin.kind} - ${pin.categories.join(', ')}`,
      lat: pin.lat,
      lon: pin.lng,
      description: pin.body,
      type: pin.kind,
      urgency: pin.urgency,
    })), [pins]);

  // Convert Houston 311 data to locations - memoized
  const houston311Locations: Location[] = useMemo(() => 
    houston311Data?.features.map(feature => ({
      id: `311-${feature.geometry.coordinates[0]}-${feature.geometry.coordinates[1]}-${feature.properties.category}`,
      name: `311: ${feature.properties.category}`,
      lat: feature.geometry.coordinates[1], // GeoJSON uses [lng, lat]
      lon: feature.geometry.coordinates[0],
      description: `Houston 311 report: ${feature.properties.category}${feature.properties.updated ? ` (Updated: ${new Date(feature.properties.updated).toLocaleDateString()})` : ''}`,
      type: '311',
      urgency: 1, // Default urgency for 311 reports
    })) || [], [houston311Data]);

  // Convert shelters to locations - memoized
  const shelterLocations: Location[] = useMemo(() => 
    shelters.map(shelter => ({
      id: shelter.id || `shelter-${shelter.lat}-${shelter.lng}`,
      name: shelter.name,
      lat: shelter.lat,
      lon: shelter.lng,
      description: `${shelter.type} shelter${shelter.capacity ? ` - ${shelter.capacity}` : ''}${shelter.notes ? ` - ${shelter.notes}` : ''}`,
      type: 'shelter',
      urgency: 2,
    })), [shelters]);

  // Convert food sites to locations - memoized
  const foodLocations: Location[] = useMemo(() => 
    foodSites.map(foodSite => ({
      id: foodSite.id || `food-${foodSite.lat}-${foodSite.lng}`,
      name: foodSite.name,
      lat: foodSite.lat,
      lon: foodSite.lng,
      description: `${foodSite.kind === 'free_food' ? 'Free food' : 'Food drop-off'} site${foodSite.status ? ` - ${foodSite.status}` : ''}${foodSite.needs ? ` - Needs: ${foodSite.needs}` : ''}`,
      type: 'food',
      urgency: 2,
    })), [foodSites]);

  // Combine all locations - memoized
  const locations: Location[] = useMemo(() => 
    [...pinLocations, ...houston311Locations, ...shelterLocations, ...foodLocations], 
    [pinLocations, houston311Locations, shelterLocations, foodLocations]);

  // Memoize the current location to prevent unnecessary re-renders
  const memoizedCurrLocation = useMemo(() => 
    currLocation || locations[0], 
    [currLocation, locations]);

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
  }, [locations, currLocation]);

  // Memoize filtered locations to prevent unnecessary re-renders
  const memoizedFilteredLocations = useMemo(() => filteredLocations, [filteredLocations]);


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
      '💪': ['manpower'],
      '🫂': ['friendship'],
      '❓': ['other']
    };
    
    const categories = new Set<string>();
    emojis.forEach(emoji => {
      const emojiCategories = emojiMap[emoji] || ['other'];
      emojiCategories.forEach(cat => categories.add(cat));
    });
    
    return Array.from(categories);
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
          lng: data.lng,
        };
        
        console.log('🔄 Updating pin locally...');
        console.log('📝 Updated pin data:', updatedPin);
        dispatch(updatePin(updatedPin));
        
        success('Location updated successfully!', '✅ Update Complete');
        
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
        success(
          `ID: ${newPin.id} • Location: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
          '✅ Help request posted successfully!'
        );
      }
      
    } catch (err) {
      console.error(`❌ Failed to ${isEditing ? 'update' : 'create'} pin:`, err);
      console.error('🔍 Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      
      // Show user-friendly error
      error(
        `${err instanceof Error ? err.message : 'Unknown error'}`,
        `❌ Failed to ${isEditing ? 'update' : 'post'} help request`
      );
      throw err; // Re-throw to let PostTooltip handle the error
    }
  };

  const handleTooltipClose = () => {
    setIsTooltipOpen(false);
    setEditingLocation(null);
  };

  const handleEditLocation = useCallback((location: Location) => {
    console.log('🔧 Edit location clicked:', location);
    console.log('🔍 App handleEditLocation called');
    setEditingLocation(location);
    setIsTooltipOpen(true);
  }, []);

  const handleDeleteLocation = useCallback(async (id: string) => {
    console.log('🗑️ Delete location clicked:', id);
    try {
      // Call API to dismiss/hide the pin on the backend
      await api.dismissPin(id, getAnonUserId());
      console.log('✅ Pin dismissed successfully on backend');
      
      // Remove from local state
      dispatch(removePin(id));
      
      success('Post deleted successfully!', '✅ Deleted');
      
    } catch (err) {
      console.error('❌ Failed to delete pin:', err);
      error(`${err instanceof Error ? err.message : 'Unknown error'}`, '❌ Failed to delete post');
    }
  }, [dispatch, success, error]);

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
            locations={memoizedFilteredLocations} 
            currLocation={memoizedCurrLocation} 
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
            emojis: originalPin ? mapCategoriesToEmojis(originalPin.categories) : ['❓'],
            message: editingLocation.description,
            lat: editingLocation.lat,
            lng: editingLocation.lon
          };
          console.log('📝 Passing editData to PostTooltip:', editData);
          return editData;
        })() : undefined}
      />
    </div>
  );
};

export default React.memo(App);
