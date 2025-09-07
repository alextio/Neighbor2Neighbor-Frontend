import React, { useCallback, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Location } from '../types';
import { useEffect } from 'react';
import CityCard from './CityCard';
import { useSelector } from 'react-redux';
import NearMeIcon from '@mui/icons-material/NearMe';
import { useToast } from './ui/toast';

interface MapProps {
  locations: Location[];
  currLocation: Location;
  onEditLocation?: (location: Location) => void;
  showFloodLayer?: boolean;
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

// Component to add flood layer using FEMA flood plains data
const FloodLayer: React.FC<{ visible: boolean }> = React.memo(({ visible }) => {
  const map = useMap();
  const [floodLayer, setFloodLayer] = useState<L.LayerGroup | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && !floodLayer && !loading) {
      console.log('🌊 Loading Houston flood hazard data...');
      setLoading(true);
      
      // Use official City of Houston flood hazard MapServer
      const fetchFloodData = async () => {
        try {
          console.log('📡 Fetching flood data from Houston MapServer...');
          
          // Fetch multiple flood layers from Houston's official MapServer
          const baseUrl = 'https://mycity2.houstontx.gov/pubgis02/rest/services/HoustonMap/Flood_Hazard/MapServer';
          
          // Define layers to fetch with their styling
          const floodLayers = [
            { id: 0, name: 'Floodway (Harris County)', color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.4 },
            { id: 1, name: '100 YR Flood Plain (Harris, FEMA)', color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.25 },
            { id: 6, name: '500 YR Flood Plain (Harris, FEMA)', color: '#0891b2', fillColor: '#06b6d4', fillOpacity: 0.2 },
            { id: 8, name: 'Hurricane Evacuation Zones', color: '#7c3aed', fillColor: '#8b5cf6', fillOpacity: 0.15 }
          ];
          
          const layerGroup = L.layerGroup();
          let totalFeatures = 0;
          
          // Fetch each layer
          for (const layerInfo of floodLayers) {
            try {
              const params = new URLSearchParams({
                where: '1=1',
                outFields: '*',
                f: 'geojson',
                outSR: '4326'
              });
              const layerUrl = `${baseUrl}/${layerInfo.id}/query?${params.toString()}`;
              
              console.log(`📡 Fetching ${layerInfo.name}...`);
              const response = await fetch(layerUrl);
              const geoJsonData = await response.json();
              
              if (geoJsonData.features && geoJsonData.features.length > 0) {
                console.log(`📥 ${layerInfo.name}: ${geoJsonData.features.length} features`);
                totalFeatures += geoJsonData.features.length;
                
                // Create layer with specific styling
                const layer = L.geoJSON(geoJsonData, {
                  style: () => ({
                    color: layerInfo.color,
                    weight: 1,
                    fillColor: layerInfo.fillColor,
                    fillOpacity: layerInfo.fillOpacity
                  }),
                  onEachFeature: (feature, layer) => {
                    // Create popup with all available properties
                    const props = feature.properties || {};
                    let popupContent = `<strong>${layerInfo.name}</strong><br/>`;
                    
                    // Add relevant properties to popup
                    Object.keys(props).forEach(key => {
                      if (key !== 'OBJECTID' && key !== 'Shape_Length' && key !== 'Shape_Area' && props[key]) {
                        popupContent += `<strong>${key}:</strong> ${props[key]}<br/>`;
                      }
                    });
                    
                    layer.bindPopup(popupContent);
                  }
                });
                
                layerGroup.addLayer(layer);
              }
            } catch (layerError) {
              console.warn(`⚠️ Failed to load ${layerInfo.name}:`, layerError);
            }
          }
          
          if (totalFeatures > 0) {
            layerGroup.addTo(map);
            setFloodLayer(layerGroup);
            setLoading(false);
            console.log(`✅ Houston flood layers added successfully (${totalFeatures} total features)`);
          } else {
            throw new Error('No flood data received from Houston MapServer');
          }
          
        } catch (error) {
          console.error('❌ Failed to load Houston flood data:', error);
          setLoading(false);
        }
      };
      
      fetchFloodData();
      
    } else if (!visible && floodLayer) {
      console.log('🌊 Removing flood layer...');
      map.removeLayer(floodLayer);
      setFloodLayer(null);
      console.log('✅ Flood layer removed');
    }
  }, [visible, floodLayer, loading, map]);

  return null;
});

const LocateControl: React.FC = React.memo(() => {
  const map = useMap();
  const { error } = useToast();

  // Callback to locate the user using browser's geolocation API, memoized to prevent unnecessary recreation
  const locateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 12);
        },
        (err) => {
          console.error('Error determining location', err);
          error('Unable to determine your location');
        },
      );
    } else {
      error('Geolocation is not supported by your browser');
    }
  }, [map, error]);

  return (
    <button
      onClick={locateUser}
      className="absolute bottom-28 right-2.5 z-[1000] p-1 bg-[#8e7cc3] text-white border-none rounded-sm">
      <NearMeIcon />
    </button>
  );
});

// Main map component
const Map: React.FC<MapProps> = ({ locations, currLocation, onEditLocation, showFloodLayer = false }) => {
  const defaultPosition: [number, number] = [29.7604, -95.3698]; // Default center position (Houston, TX)
  const [floodLayerVisible, setFloodLayerVisible] = useState(showFloodLayer);
  const [floodLoading, setFloodLoading] = useState(false);


  // Toggle flood layer visibility
  const toggleFloodLayer = useCallback(() => {
    if (!floodLayerVisible) {
      setFloodLoading(true);
      // Loading state will be cleared by the FloodLayer component
      setTimeout(() => setFloodLoading(false), 5000); // Fallback timeout
    }
    setFloodLayerVisible(!floodLayerVisible);
  }, [floodLayerVisible]);

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

        {/* Flood layer using custom component */}
        <FloodLayer visible={floodLayerVisible} />

        {/* Add markers for all locations */}
        {locations.map((location) => (
          <Marker key={location.id} position={[location.lat, location.lon]}>
            <CityCard location={location} onEdit={onEditLocation} />
          </Marker>
        ))}

        <MapView currLocation={currLocation} />

        <LocateControl />

        {/* Flood layer toggle button */}
        <button
          onClick={toggleFloodLayer}
          disabled={floodLoading}
          className={`absolute top-4 right-4 z-[1000] px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            floodLayerVisible 
              ? 'bg-blue-600 text-white' 
              : floodLoading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}>
          {floodLoading ? 'Loading Flood Data...' : floodLayerVisible ? 'Hide Flood Zones' : 'Show Flood Zones'}
        </button>
      </MapContainer>
    </div>
  );
};

export default React.memo(Map);
