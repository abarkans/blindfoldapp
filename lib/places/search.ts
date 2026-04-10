export interface VenueAIEnrichment {
  title: string;
  description: string;
  emoji: string;
  vibe: string;
  duration: string;
  budget_range: string;
  tags: string[];
}

export interface VenueMeta {
  primary_type_display_name?: string;
  editorial_summary?: string;
  user_rating_count?: number;
  reviews?: string[];
  outdoor_seating?: boolean;
  live_music?: boolean;
  serves_cocktails?: boolean;
  serves_beer?: boolean;
  serves_wine?: boolean;
  serves_breakfast?: boolean;
  serves_brunch?: boolean;
  serves_lunch?: boolean;
  serves_dinner?: boolean;
  takeout?: boolean;
  reservable?: boolean;
}

export interface VenueDateIdea {
  type: "venue";
  place_id: string;
  display_name: string;
  formatted_address: string;
  photo_name: string | null;
  rating: number;
  price_level: string;
  meta: VenueMeta;
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

  // Exclude accommodation and event-venue types that are not suitable for dates
  // Only using type names confirmed in the Places API (New) type table
  const EXCLUDED_TYPES = [
    "hotel",
    "motel",
    "hostel",
    "extended_stay_hotel",
    "resort_hotel",
    "campground",
    "bed_and_breakfast",
    "guest_house",
    "wedding_venue",
    "event_venue",
  ];

  const body = {
    includedTypes: types,
    excludedTypes: EXCLUDED_TYPES,
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
          "places.id,places.displayName,places.formattedAddress,places.photos,places.rating,places.priceLevel,places.primaryTypeDisplayName,places.editorialSummary,places.userRatingCount,places.reviews,places.outdoorSeating,places.liveMusic,places.servesCocktails,places.servesBeer,places.servesWine,places.servesBreakfast,places.servesBrunch,places.servesLunch,places.servesDinner,places.takeout,places.reservable",
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
    primaryTypeDisplayName?: { text: string };
    editorialSummary?: { text: string };
    userRatingCount?: number;
    reviews?: { text?: { text: string } }[];
    outdoorSeating?: boolean;
    liveMusic?: boolean;
    servesCocktails?: boolean;
    servesBeer?: boolean;
    servesWine?: boolean;
    servesBreakfast?: boolean;
    servesBrunch?: boolean;
    servesLunch?: boolean;
    servesDinner?: boolean;
    takeout?: boolean;
    reservable?: boolean;
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

  const reviews = (place.reviews ?? [])
    .map((r) => r.text?.text)
    .filter(Boolean)
    .slice(0, 2) as string[];

  const meta: VenueMeta = {
    primary_type_display_name: place.primaryTypeDisplayName?.text,
    editorial_summary: place.editorialSummary?.text,
    user_rating_count: place.userRatingCount,
    reviews: reviews.length > 0 ? reviews : undefined,
    outdoor_seating: place.outdoorSeating || undefined,
    live_music: place.liveMusic || undefined,
    serves_cocktails: place.servesCocktails || undefined,
    serves_beer: place.servesBeer || undefined,
    serves_wine: place.servesWine || undefined,
    serves_breakfast: place.servesBreakfast || undefined,
    serves_brunch: place.servesBrunch || undefined,
    serves_lunch: place.servesLunch || undefined,
    serves_dinner: place.servesDinner || undefined,
    takeout: place.takeout || undefined,
    reservable: place.reservable || undefined,
  };

  return {
    type: "venue" as const,
    place_id: place.id,
    display_name: place.displayName.text,
    formatted_address: place.formattedAddress,
    photo_name: place.photos?.[0]?.name ?? null,
    rating: place.rating ?? 0,
    price_level: place.priceLevel ?? "PRICE_LEVEL_UNSPECIFIED",
    meta,
    ai: null,
  };
}
