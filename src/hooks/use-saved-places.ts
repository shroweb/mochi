import { useEffect, useState } from "react";

import type { GeoResult } from "@/lib/weather";

const STORAGE_KEY = "mochi-saved-places-v1";
const MAX_PLACES = 5;

export function placeKey(place: GeoResult) {
  return `${place.latitude.toFixed(4)}:${place.longitude.toFixed(4)}`;
}

export function useSavedPlaces(initialPlace: GeoResult) {
  const [places, setPlaces] = useState<GeoResult[]>([initialPlace]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setPlaces(parsed.slice(0, MAX_PLACES));
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    } catch {
      return;
    }
  }, [places]);

  const savePlace = (place: GeoResult) => {
    setPlaces((current) => {
      const next = [place, ...current.filter((p) => placeKey(p) !== placeKey(place))];
      return next.slice(0, MAX_PLACES);
    });
  };

  const removePlace = (place: GeoResult) => {
    setPlaces((current) => current.filter((p) => placeKey(p) !== placeKey(place)));
  };

  return {
    places,
    savePlace,
    removePlace,
    isSaved: (place: GeoResult) => places.some((p) => placeKey(p) === placeKey(place)),
  };
}
