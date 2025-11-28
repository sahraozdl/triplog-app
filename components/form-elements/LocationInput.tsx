"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import Script from "next/script";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function LocationInput({
  value,
  onChange,
  placeholder = "Search location...",
  className,
  id,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoCompleteRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && inputRef.current && window.google) {
      if (autoCompleteRef.current) return;

      const options = {
        fields: ["formatted_address", "geometry", "name"],
        strictBounds: false,
        types: ["geocode", "establishment"],
      };

      autoCompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options,
      );

      autoCompleteRef.current.addListener("place_changed", () => {
        const place = autoCompleteRef.current?.getPlace();

        if (!place) return;

        if (place.formatted_address) {
          onChangeRef.current(place.formatted_address);
        } else if (place.name) {
          onChangeRef.current(place.name);
        }
      });
    }
  }, [scriptLoaded]);

  return (
    <div className="relative w-full">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setScriptLoaded(true)}
        strategy="afterInteractive"
      />

      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pl-9 ${className}`}
          autoComplete="off"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}
