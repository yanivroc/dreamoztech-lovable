import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

const GOOGLE_MAPS_KEY = "AIzaSyCCZm8rWSRHkhIVNbcu1Low2__CmcGVWPg";

declare global {
  interface Window {
    google?: any;
    __googleMapsPlacesLoading?: Promise<void>;
  }
}

function loadGooglePlaces(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__googleMapsPlacesLoading) return window.__googleMapsPlacesLoading;
  window.__googleMapsPlacesLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&loading=async`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
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
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (parts: Parts) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadGooglePlaces()
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return;
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          fields: ["address_components", "formatted_address"],
          componentRestrictions: { country: ["au"] },
        });
        acRef.current = ac;
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const comps: any[] = place.address_components ?? [];
          const get = (t: string) =>
            comps.find((c) => c.types.includes(t))?.long_name ?? "";
          const streetNumber = get("street_number");
          const route = get("route");
          const city =
            get("locality") || get("postal_town") || get("administrative_area_level_2");
          const postcode = get("postal_code");
          const country = comps.find((c) => c.types.includes("country"))?.short_name ?? "";
          const address =
            place.formatted_address?.split(",")[0] ||
            `${streetNumber} ${route}`.trim();
          onChange(address);
          onSelect?.({ address, city, postcode, country });
        });
      })
      .catch((e) => console.error("Google Places load failed", e));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
}
