import React, { useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '../types';
import { useEffect } from 'react';
import CityCard from './CityCard';
import { useSelector } from 'react-redux';
import NearMeIcon from '@mui/icons-material/NearMe';

interface MapProps {
  locations: Location[];
  currLocation: Location;
}

// Component to display and move the map to the current location
const MapView: React.FC<{ currLocation: Location }> = React.memo(({ currLocation }) => {
  const map = useMap();

  // Selector for triggering map movements, memoized to prevent re-renders
  const mapMovements = useSelector(useMemo(() => (state: any) => state.map.mapMovedTrigger, []));

  useEffect(() => {
    if (currLocation) {
      const { lat, lon } = currLocation;

      if (map.getCenter().lat !== lat || map.getCenter().lng !== lon) {
        map.flyTo([lat, lon], 10, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    }
    map.zoomControl.setPosition('bottomright');
  }, [currLocation, map, mapMovements]);

  return null; // No UI rendering, just side-effects for controlling map behavior
});

const LocateControl: React.FC = React.memo(() => {
  const map = useMap();

  // Callback to locate the user using browser's geolocation API, memoized to prevent unnecessary recreation
  const locateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 12);
        },
        (error) => {
          console.error('Error determining location', error);
          alert('Unable to determine your location');
        },
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  }, [map]);

  return (
    <button
      onClick={locateUser}
      className="absolute bottom-28 right-2.5 z-[1000] p-1 bg-[#8e7cc3] text-white border-none rounded-sm">
      <NearMeIcon />
    </button>
  );
});

// Main map component
const Map: React.FC<MapProps> = ({ locations, currLocation }) => {
  const defaultPosition: [number, number] = [29.7604, -95.3698]; // Default center position (Houston, TX)

  return (
    <div className="h-screen w-screen fixed top-0 left-0 z-10 p-0 m-0">
      <MapContainer
        center={defaultPosition}
        zoom={10}
        style={{ height: '100%', width: '100%', margin: '0px' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          attribution=""
        />

        {/* Add markers for all locations */}
        {locations.map((location) => (
          <Marker key={location.id} position={[location.lat, location.lon]}>
            <CityCard location={location} />
          </Marker>
        ))}

        <MapView currLocation={currLocation} />

        <LocateControl />
      </MapContainer>
    </div>
  );
};

export default React.memo(Map);
