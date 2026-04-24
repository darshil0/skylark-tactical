import { useState, useEffect, useCallback } from 'react';
import { UserLocation } from '../types';

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>();

  const getUserLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  return { userLocation, getUserLocation };
}
