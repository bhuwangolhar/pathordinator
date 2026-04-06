import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { useWebSocket } from '../contexts/WebSocketContext';
import './DeliveryMap.css';

interface DeliveryLocation {
  id: number;
  user_id: number;
  user_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface DeliveryMapProps {
  deliverySessionId?: number;
  organizationId: number;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  deliverySessionId,
  organizationId
}) => {
  const { locationUpdates, isConnected, trackDelivery } = useWebSocket();
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [route, setRoute] = useState<Array<{ lat: number; lng: number }>>([]);

  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Fetch initial locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const url = deliverySessionId
          ? `http://localhost:8080/location-updates?delivery_session_id=${deliverySessionId}`
          : `http://localhost:8080/location-updates?organization_id=${organizationId}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.data) {
          setLocations(data.data);
          
          // Calculate center from all locations
          if (data.data.length > 0) {
            const avgLat = data.data.reduce((sum: number, loc: any) => sum + parseFloat(loc.latitude), 0) / data.data.length;
            const avgLng = data.data.reduce((sum: number, loc: any) => sum + parseFloat(loc.longitude), 0) / data.data.length;
            setCenter({ lat: avgLat, lng: avgLng });
          }

          // Build route from locations
          if (deliverySessionId && data.data.length > 0) {
            const sortedByTime = [...data.data].sort((a: any, b: any) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            setRoute(sortedByTime.map((loc: any) => ({
              lat: parseFloat(loc.latitude),
              lng: parseFloat(loc.longitude)
            })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };

    fetchLocations();
  }, [deliverySessionId, organizationId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (deliverySessionId && isConnected) {
      trackDelivery(deliverySessionId, organizationId);
    }
  }, [deliverySessionId, organizationId, isConnected, trackDelivery]);

  // Update locations from WebSocket
  useEffect(() => {
    if (Object.keys(locationUpdates).length > 0) {
      const newLocations = Object.values(locationUpdates)
        .filter((update: any) => {
          if (deliverySessionId) {
            return update.delivery_session_id === deliverySessionId;
          }
          return true;
        })
        .map((update: any) => ({
          id: update.id,
          user_id: update.delivery_partner_id,
          user_name: update.user_name || `Delivery Partner ${update.id}`,
          latitude: parseFloat(update.latitude),
          longitude: parseFloat(update.longitude),
          timestamp: update.timestamp
        }));

      if (newLocations.length > 0) {
        setLocations(newLocations);
        
        // Update center
        const avgLat = newLocations.reduce((sum, loc) => sum + loc.latitude, 0) / newLocations.length;
        const avgLng = newLocations.reduce((sum, loc) => sum + loc.longitude, 0) / newLocations.length;
        setCenter({ lat: avgLat, lng: avgLng });

        // Update route
        if (deliverySessionId) {
          const sortedLocs = [...newLocations].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setRoute(sortedLocs.map(loc => ({
            lat: loc.latitude,
            lng: loc.longitude
          })));
        }
      }
    }
  }, [locationUpdates, deliverySessionId]);

  const mapStyles = {
    height: '100%',
    width: '100%'
  };

  return (
    <div className="delivery-map-container">
      {!API_KEY && (
        <div className="api-key-warning">
          Google Maps API key not configured. Set REACT_APP_GOOGLE_MAPS_API_KEY environment variable.
        </div>
      )}
      
      {API_KEY ? (
        <LoadScript googleMapsApiKey={API_KEY}>
          <GoogleMap
            mapContainerStyle={mapStyles}
            center={center}
            zoom={13}
            options={{
              styles: [
                {
                  featureType: 'all',
                  elementType: 'geometry.stroke',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            }}
          >
            {/* Delivery Route Path */}
            {route.length > 1 && (
              <Polyline
                path={route}
                options={{
                  strokeColor: '#FF6B6B',
                  strokeOpacity: 0.7,
                  strokeWeight: 3,
                  geodesic: true
                }}
              />
            )}

            {/* Location Markers */}
            {locations.map((location, index) => (
              <Marker
                key={location.id}
                position={{ lat: location.latitude, lng: location.longitude }}
                title={location.user_name}
                icon={{
                  path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
                  fillColor: index === 0 ? '#FF6B6B' : '#4ECDC4',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                  scale: 2
                }}
                onClick={() => setSelectedMarker(location.id)}
              />
            ))}

            {/* Info Window for Selected Marker */}
            {selectedMarker !== null && locations.find(l => l.id === selectedMarker) && (
              <InfoWindow
                position={{
                  lat: locations.find(l => l.id === selectedMarker)!.latitude,
                  lng: locations.find(l => l.id === selectedMarker)!.longitude
                }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="info-window-content">
                  <div className="info-window-name">
                    {locations.find(l => l.id === selectedMarker)!.user_name}
                  </div>
                  <div className="info-window-coordinates">
                    Lat: {locations.find(l => l.id === selectedMarker)!.latitude.toFixed(4)}<br />
                    Lng: {locations.find(l => l.id === selectedMarker)!.longitude.toFixed(4)}
                  </div>
                  <div className="info-window-timestamp">
                    {new Date(locations.find(l => l.id === selectedMarker)!.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      ) : (
        <div className="map-placeholder">
          Map placeholder - Configure Google Maps API
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;
