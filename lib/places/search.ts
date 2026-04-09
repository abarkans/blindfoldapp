export interface VenueAIEnrichment {
  title: string;
  description: string;
  emoji: string;
  vibe: string;
  duration: string;
  budget_range: string;
  tags: string[];
}

export interface VenueDateIdea {
  type: "venue";
  place_id: string;
  display_name: string;
  formatted_address: string;
  photo_name: string | null;
  rating: number;
  price_level: string;
  ai: VenueAIEnrichment | null;
}

const INTEREST_TO_PLACE_TYPES: Record<string, string[]> = {
  food: ["restaurant", "cafe", "bakery"],
  music: ["night_club", "bar"],
  nature: ["park", "national_park"],
  art: ["art_gallery", "museum"],
  fitness: ["gym", "spa"],
  cinema: ["movie_theater"],
  books: ["library", "book_store"],
  coffee: ["cafe"],
  beach: ["beach"],
  photography: ["tourist_attraction", "art_gallery"],
  gaming: ["amusement_center", "bowling_alley"],
  romance: ["spa", "restaurant"],
};

const PRICE_LEVEL_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "€",
  PRICE_LEVEL_MODERATE: "€€",
  PRICE_LEVEL_EXPENSIVE: "€€€",
  PRICE_LEVEL_VERY_EXPENSIVE: "€€€€",
  PRICE_LEVEL_UNSPECIFIED: "",
};

export function getPriceLevelLabel(priceLevel: string): string {
  return PRICE_LEVEL_LABELS[priceLevel] ?? "";
}

export async function searchNearbyVenues({
  interests,
  lat,
  lng,
  radiusMeters,
  previousPlaceIds = [],
}: {
  interests: string[];
  lat: number;
  lng: number;
  radiusMeters: number;
  previousPlaceIds?: string[];
}): Promise<VenueDateIdea> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is not configured.");

  // Map interests to place types, deduplicate
  const types = [
    ...new Set(interests.flatMap((i) => INTEREST_TO_PLACE_TYPES[i] ?? [])),
  ].slice(0, 20);

  if (types.length === 0) {
    throw new Error("No place types could be mapped from your interests.");
  }

  const body = {
    includedTypes: types,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: Math.min(radiusMeters, 50000), // Google Places API max is 50km
      },
    },
  };

  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.photos,places.rating,places.priceLevel",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Places API error: ${text}`);
  }

  const data = await res.json();
  const allPlaces: {
    id: string;
    displayName: { text: string };
    formattedAddress: string;
    photos?: { name: string }[];
    rating?: number;
    priceLevel?: string;
  }[] = data.places ?? [];

  // Filter: rating >= 4.0 and not previously visited
  const filtered = allPlaces.filter(
    (p) => (p.rating ?? 0) >= 4.0 && !previousPlaceIds.includes(p.id)
  );

  // Fall back to unvisited places with any rating if none qualify
  const pool =
    filtered.length > 0
      ? filtered
      : allPlaces.filter((p) => !previousPlaceIds.includes(p.id));

  if (pool.length === 0) {
    throw new Error(
      "No venues found nearby. Try increasing your search radius in Settings."
    );
  }

  const place = pool[Math.floor(Math.random() * pool.length)];

  return {
    type: "venue" as const,
    place_id: place.id,
    display_name: place.displayName.text,
    formatted_address: place.formattedAddress,
    photo_name: place.photos?.[0]?.name ?? null,
    rating: place.rating ?? 0,
    price_level: place.priceLevel ?? "PRICE_LEVEL_UNSPECIFIED",
    ai: null,
  };
}
