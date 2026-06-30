import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

const GOOGLE_MAPS_KEY =
  import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY ||
  "AIzaSyCCZm8rWSRHkhIVNbcu1Low2__CmcGVWPg";
const GOOGLE_MAPS_CHANNEL = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;

declare global {
  interface Window {
    google?: any;
    __googleMapsPlacesLoading?: Promise<void>;
    __dreamozGoogleMapsReady?: () => void;
  }
}

function loadGooglePlaces(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps?.importLibrary) {
    return window.google.maps.importLibrary("places").then(() => undefined);
  }
  if (window.__googleMapsPlacesLoading) return window.__googleMapsPlacesLoading;
  window.__googleMapsPlacesLoading = new Promise((resolve, reject) => {
    window.__dreamozGoogleMapsReady = () => {
      window.google?.maps
        ?.importLibrary("places")
        .then(() => resolve())
        .catch(reject);
    };
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_KEY,
      loading: "async",
      callback: "__dreamozGoogleMapsReady",
    });
    if (GOOGLE_MAPS_CHANNEL) params.set("channel", GOOGLE_MAPS_CHANNEL);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return window.__googleMapsPlacesLoading;
}

type Parts = {
  address: string;
  city?: string;
  postcode?: string;
  country?: string;
};

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  required,
  placeholder = "Start typing your address",
  country = "au",
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (parts: Parts) => void;
  required?: boolean;
  placeholder?: string;
  country?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const regionCodes = useMemo(() => {
    const normalized = country?.trim().toLowerCase();
    return normalized ? [normalized] : undefined;
  }, [country]);

  useEffect(() => {
    let cancelled = false;
    loadGooglePlaces()
      .then(() => {
        if (cancelled) return;
        if (!window.google?.maps?.places?.AutocompleteSuggestion) {
          setError("Google Places is unavailable for this domain/API key.");
          return;
        }
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        setReady(true);
      })
      .catch((e) => {
        console.error("Google Places load failed", e);
        if (!cancelled) setError("Google address lookup could not load.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const { suggestions } =
          await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: value,
            includedRegionCodes: regionCodes,
            sessionToken: sessionTokenRef.current,
          });
        if (cancelled) return;
        setSuggestions(suggestions ?? []);
        setOpen((suggestions ?? []).length > 0);
      } catch (e) {
        console.error("Google Places suggestions failed", e);
        if (!cancelled) {
          setError("Google address lookup is blocked. Check API restrictions for this domain.");
          setSuggestions([]);
          setOpen(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ready, regionCodes, value]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function selectSuggestion(suggestion: any) {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "addressComponents"] });
      const comps: any[] = place.addressComponents ?? [];
      const get = (t: string, short = false) => {
        const component = comps.find((c) => c.types?.includes(t));
        return short
          ? component?.shortText || component?.short_name || ""
          : component?.longText || component?.long_name || "";
      };
      const streetNumber = get("street_number");
      const route = get("route");
      const city = get("locality") || get("postal_town") || get("administrative_area_level_2");
      const postcode = get("postal_code");
      const selectedCountry = get("country", true);
      const address =
        place.formattedAddress?.split(",")[0] ||
        prediction.text?.text?.split(",")[0] ||
        `${streetNumber} ${route}`.trim();
      onChange(address);
      onSelect?.({ address, city, postcode, country: selectedCountry });
      setOpen(false);
      setSuggestions([]);
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    } catch (e) {
      console.error("Google Places detail failed", e);
      const address = prediction.text?.text?.split(",")[0] ?? value;
      onChange(address);
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setError(null);
          onChange(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
          {suggestions.map((suggestion, index) => {
            const prediction = suggestion.placePrediction;
            const label = prediction?.text?.text ?? "";
            return (
              <button
                key={prediction?.placeId ?? index}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
