import { memo, useEffect, useRef, useState } from "react";
import type { Location } from "../lib/locations";
import LOCATIONS from "../lib/locations";
import LocationMap from "./LocationMap";
import "./styles/LocationPicker.css";

interface Props {
  selected: Location | null;
  onSelect: (loc: Location) => void;
  onDismiss: () => void;
}

export default memo(function LocationPicker({ selected, onSelect, onDismiss }: Props) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const activeItemRef = useRef<HTMLLIElement>(null);

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
