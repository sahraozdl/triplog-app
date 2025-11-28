"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
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
  const [isReady, setIsReady] = useState(false);

  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const checkGoogleMaps = () => {
      // @ts-ignore
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsReady(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    const intervalId = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isReady && inputRef.current && !autoCompleteRef.current) {
      try {
        // @ts-ignore
        const places = window.google.maps.places;

        const options = {
          fields: ["formatted_address", "geometry", "name"],
          strictBounds: false,
          types: ["geocode", "establishment"],
        };

        autoCompleteRef.current = new places.Autocomplete(
          inputRef.current,
          options,
        );

        autoCompleteRef.current.addListener("place_changed", () => {
          const place = autoCompleteRef.current?.getPlace();
          if (!place) return;

          const val = place.formatted_address || place.name;
          if (val) {
            onChangeRef.current(val);
          }
        });
      } catch (error) {
        console.error("Autocomplete init error:", error);
      }
    }
  }, [isReady]);

  return (
    <div className="relative w-full">
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
