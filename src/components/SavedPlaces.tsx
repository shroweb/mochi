import { MapPin, Star, X } from "lucide-react";

import type { GeoResult } from "@/lib/weather";
import { Button } from "@/components/ui/button";
import { placeKey } from "@/hooks/use-saved-places";

interface SavedPlacesProps {
  places: GeoResult[];
  currentPlace: GeoResult;
  onSelect: (place: GeoResult) => void;
  onSave: (place: GeoResult) => void;
  onRemove: (place: GeoResult) => void;
  isCurrentSaved: boolean;
}

export function SavedPlaces({
  places,
  currentPlace,
  onSelect,
  onSave,
  onRemove,
  isCurrentSaved,
}: SavedPlacesProps) {
  return (
    <section className="mt-4 flex flex-wrap items-center gap-2 animate-fade-up">
      <Button
        size="sm"
        variant={isCurrentSaved ? "secondary" : "default"}
        className="rounded-full"
        onClick={() => onSave(currentPlace)}
        disabled={isCurrentSaved}
      >
        <Star className="h-3.5 w-3.5" />
        {isCurrentSaved ? "Saved" : "Save place"}
      </Button>

      {places.map((place) => {
        const active = placeKey(place) === placeKey(currentPlace);
        return (
          <span
            key={placeKey(place)}
            className="inline-flex items-center rounded-full bg-secondary/70"
          >
            <button
              type="button"
              onClick={() => onSelect(place)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-l-full px-3 text-xs font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {place.name}
            </button>
            <button
              type="button"
              onClick={() => onRemove(place)}
              className="grid h-8 w-8 place-items-center rounded-r-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Remove ${place.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        );
      })}
    </section>
  );
}
