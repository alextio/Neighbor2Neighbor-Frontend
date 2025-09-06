import React, { useState, useEffect, Suspense } from 'react';
import BottomNavigation from './components/BottomNavigation';
import { Location } from './types';
import './styles/App.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPins } from './store/slices/pinsSlice';
import { RootState } from './store/store';
import ApiStatus from './components/ApiStatus';

const MapComponent = React.lazy(() => import('./components/Map'));

const App: React.FC = () => {
  const [currLocation, setCurrLocation] = useState<Location | null>(null);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<string>('home');
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
    setActiveTab(tab);
    console.log('Active tab changed to:', tab);
  };

  return (
    <div className="app">
      <ApiStatus />
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
    </div>
  );
};

export default React.memo(App);
