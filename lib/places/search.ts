export interface VenueAIEnrichment {
  title: string;
  description: string;
  mission: string;
  vibe: string;
  duration: string;
  budget_range: string;
  tags: string[];
  preparation?: string;
  conversation_starter?: string;
}

export interface VenueMeta {
  primary_type?: string;
  primary_type_display_name?: string;
  types?: string[];
  editorial_summary?: string;
  user_rating_count?: number;
  reviews?: string[];
  outdoor_seating?: boolean;
  live_music?: boolean;
  serves_cocktails?: boolean;
  serves_beer?: boolean;
  serves_wine?: boolean;
  serves_dinner?: boolean;
  reservable?: boolean;
}

export interface VenueDateIdea {
  type: "venue";
  place_id: string;
  display_name: string;
  formatted_address: string;
  short_formatted_address: string | null;
  national_phone_number: string | null;
  international_phone_number: string | null;
  photo_name: string | null;
  rating: number;
  price_level: string;
  meta: VenueMeta;
  ai: VenueAIEnrichment | null;
}

type PlaceBusinessStatus =
  | "BUSINESS_STATUS_UNSPECIFIED"
  | "OPERATIONAL"
  | "CLOSED_TEMPORARILY"
  | "CLOSED_PERMANENTLY"
  | "FUTURE_OPENING";

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

interface PlaceAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

function getAddressComponent(
  components: PlaceAddressComponent[] | undefined,
  type: string
): string | null {
  const component = components?.find((item) => item.types?.includes(type));
  return component?.longText ?? component?.shortText ?? null;
}

function formatShortAddress(
  components: PlaceAddressComponent[] | undefined,
  formattedAddress: string
): string | null {
  const streetNumber = getAddressComponent(components, "street_number");
  const route = getAddressComponent(components, "route");
  const city =
    getAddressComponent(components, "locality") ??
    getAddressComponent(components, "postal_town") ??
    getAddressComponent(components, "administrative_area_level_2") ??
    getAddressComponent(components, "administrative_area_level_1");

  const street = [route, streetNumber].filter(Boolean).join(" ");
  const shortAddress = [street, city].filter(Boolean).join(", ");

  if (shortAddress) return shortAddress;

  const fallbackParts = formattedAddress.split(",").map((part) => part.trim());
  return fallbackParts.slice(0, 2).join(", ") || null;
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

  // Exclude accommodation, utilitarian, and big-box retail types that are not suitable for dates
  // Only using type names confirmed in the Places API (New) type table
  const EXCLUDED_TYPES = [
    "gas_station",
    "electric_vehicle_charging_station",
    "rest_stop",
    "truck_stop",
    "parking",
    "parking_garage",
    "parking_lot",
    "car_dealer",
    "car_rental",
    "car_repair",
    "car_wash",
    "tire_shop",
    "department_store",
    "discount_store",
    "warehouse_store",
    "supermarket",
    "grocery_store",
    "food_store",
    "asian_grocery_store",
    "convenience_store",
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

  const UNSUITABLE_NAME_PATTERNS = [
    /\bgas\s*station\b/i,
    /\bwalmart\b/i,
    /\bsam'?s\s+club\b/i,
    /\bcostco\b/i,
    /\btarget\b/i,
    /\bdollar\s+general\b/i,
    /\bfamily\s+dollar\b/i,
    /\bdollar\s+tree\b/i,
    /\baldi\b/i,
    /\blidl\b/i,
    /\btesco\b/i,
    /\basda\b/i,
    /\bcarrefour\b/i,
  ];

  const isSuitableDateVenue = (place: {
    displayName: { text: string };
    primaryType?: string;
    types?: string[];
    businessStatus?: PlaceBusinessStatus;
  }) => {
    if (
      place.businessStatus === "CLOSED_TEMPORARILY" ||
      place.businessStatus === "CLOSED_PERMANENTLY" ||
      place.businessStatus === "FUTURE_OPENING"
    ) {
      return false;
    }

    const placeTypes = new Set(
      [place.primaryType, ...(place.types ?? [])].filter(Boolean)
    );

    if (EXCLUDED_TYPES.some((type) => placeTypes.has(type))) return false;

    return !UNSUITABLE_NAME_PATTERNS.some((pattern) =>
      pattern.test(place.displayName.text)
    );
  };

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
          "places.id,places.displayName,places.formattedAddress,places.addressComponents,places.nationalPhoneNumber,places.internationalPhoneNumber,places.photos,places.rating,places.priceLevel,places.businessStatus,places.primaryType,places.types,places.primaryTypeDisplayName,places.editorialSummary,places.userRatingCount,places.reviews.text,places.outdoorSeating,places.liveMusic,places.servesCocktails,places.servesBeer,places.servesWine,places.servesDinner,places.reservable",
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
    addressComponents?: PlaceAddressComponent[];
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    photos?: { name: string }[];
    rating?: number;
    priceLevel?: string;
    businessStatus?: PlaceBusinessStatus;
    primaryType?: string;
    types?: string[];
    primaryTypeDisplayName?: { text: string };
    editorialSummary?: { text: string };
    userRatingCount?: number;
    reviews?: { text?: { text: string } }[];
    outdoorSeating?: boolean;
    liveMusic?: boolean;
    servesCocktails?: boolean;
    servesBeer?: boolean;
    servesWine?: boolean;
    servesDinner?: boolean;
    reservable?: boolean;
  }[] = data.places ?? [];

  // Filter: rating >= 4.0 and not previously visited
  const filtered = allPlaces.filter(
    (p) =>
      (p.rating ?? 0) >= 4.0 &&
      !previousPlaceIds.includes(p.id) &&
      isSuitableDateVenue(p)
  );

  // Fall back to unvisited places with any rating if none qualify
  const pool =
    filtered.length > 0
      ? filtered
      : allPlaces.filter(
          (p) => !previousPlaceIds.includes(p.id) && isSuitableDateVenue(p)
        );

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
    primary_type: place.primaryType,
    primary_type_display_name: place.primaryTypeDisplayName?.text,
    types: place.types?.length ? place.types : undefined,
    editorial_summary: place.editorialSummary?.text,
    user_rating_count: place.userRatingCount,
    reviews: reviews.length > 0 ? reviews : undefined,
    outdoor_seating: place.outdoorSeating || undefined,
    live_music: place.liveMusic || undefined,
    serves_cocktails: place.servesCocktails || undefined,
    serves_beer: place.servesBeer || undefined,
    serves_wine: place.servesWine || undefined,
    serves_dinner: place.servesDinner || undefined,
    reservable: place.reservable || undefined,
  };

  return {
    type: "venue" as const,
    place_id: place.id,
    display_name: place.displayName.text,
    formatted_address: place.formattedAddress,
    short_formatted_address: formatShortAddress(
      place.addressComponents,
      place.formattedAddress
    ),
    national_phone_number: place.nationalPhoneNumber ?? null,
    international_phone_number: place.internationalPhoneNumber ?? null,
    photo_name: place.photos?.[0]?.name ?? null,
    rating: place.rating ?? 0,
    price_level: place.priceLevel ?? "PRICE_LEVEL_UNSPECIFIED",
    meta,
    ai: null,
  };
}
