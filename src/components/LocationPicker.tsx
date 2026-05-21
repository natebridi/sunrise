import { memo, useEffect, useRef, useState } from "react";
import type { Location } from "../lib/locations";
import LOCATIONS from "../lib/locations";
import LocationMap from "./LocationMap";
import "./styles/LocationPicker.css";

type GeoStatus = "idle" | "loading" | "error";

interface Props {
  selected: Location | null;
  onSelect: (loc: Location) => void;
  onDismiss: () => void;
}

export default memo(function LocationPicker({ selected, onSelect, onDismiss }: Props) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const activeItemRef = useRef<HTMLLIElement>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoError, setGeoError] = useState<string | null>(null);

  // Scroll the active item into view when the picker opens
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, []);

  function handleSelect(loc: Location) {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    onSelect(loc);
    setTimeout(onDismiss, 380);
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoStatus("loading");
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        handleSelect({
          name: "Current Location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          tz,
        });
      },
      (err) => {
        setGeoStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location access was denied. Check your browser settings.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError("Location information is unavailable.");
        } else {
          setGeoError("Request timed out. Try again.");
        }
      },
      { timeout: 10000 },
    );
  }

  return (
    <div
      className={`picker-overlay${closing ? " picker-overlay--out" : ""}`}
      onClick={selected ? onDismiss : undefined}
    >
      <div className="picker-panel" onClick={(e) => e.stopPropagation()}>
        {selected && (
          <button className="picker-close" onClick={onDismiss} aria-label="Close">
            ✕
          </button>
        )}

        <div className="picker-list-col">
          <div className="picker-geo">
            <button
              className={`picker-geo-btn${geoStatus === "loading" ? " picker-geo-btn--loading" : ""}`}
              onClick={handleUseCurrentLocation}
              disabled={geoStatus === "loading"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="btn-icon">
                <path d="M150.50 361.50Q194 405 256 405Q318 405 361.50 361.50Q405 318 405 256Q405 194 361.50 150.50Q318 107 256 107Q194 107 150.50 150.50Q107 194 107 256Q107 318 150.50 361.50M447 235L491 235L491 277L447 277Q440 340 390 390Q340 440 277 447L277 491L235 491L235 447Q172 440 122 390Q72 340 65 277L21 277L21 235L65 235Q72 172 122 122Q172 72 235 65L235 21L277 21L277 65Q340 72 390 122Q440 172 447 235M196 196Q221 171 256 171Q291 171 316 196Q341 221 341 256Q341 291 316 316Q291 341 256 341Q221 341 196 316Q171 291 171 256Q171 221 196 196" fill="currentColor" />
              </svg>
              {geoStatus === "loading" ? "Locating…" : "Use current location"}

            </button>
            {geoStatus === "error" && geoError && (
              <span className="picker-geo-error">{geoError}</span>
            )}
          </div>
          <p className="picker-label">or select a city</p>
          <ul className="picker-list">
            {LOCATIONS.map((loc) => {
              const isActive = selected?.name === loc.name;
              return (
                <li
                  key={loc.name}
                  ref={isActive ? activeItemRef : null}
                  className={`picker-item${isActive ? " picker-item--active" : ""}`}
                  onClick={() => handleSelect(loc)}
                >
                  {loc.name}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="picker-map-col">
          <LocationMap selected={selected} onSelect={handleSelect} />
        </div>
      </div>
    </div>
  );
});
