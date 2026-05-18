import LOCATIONS from "../lib/locations";
import type { Location } from "../lib/locations";

// Equirectangular projection: full world, y-axis inverted (lat decreases downward)
const VIEW_W = 360;
const VIEW_H = 180;
const toX = (lng: number) => lng + 180;
const toY = (lat: number) => 100 - lat;

interface Props {
  selected: Location | null;
  onSelect: (loc: Location) => void;
}

export default function LocationMap({ selected, onSelect }: Props) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="location-map"
      preserveAspectRatio="xMidYMid meet"
    >


      {LOCATIONS.map((loc) => {
        const cx = toX(loc.lng);
        const cy = toY(loc.lat);
        const isSelected = selected?.name === loc.name;

        return (
          <g
            key={loc.name}
            onClick={() => onSelect(loc)}
            className={`map-dot${isSelected ? " map-dot--active" : ""}`}
          >
            <title>{loc.name}</title>
            {isSelected && (
              <circle cx={cx} cy={cy} r={8} className="map-dot-ring" />
            )}
            <circle cx={cx} cy={cy} r={isSelected ? 4 : 2.5} className="map-dot-fill" />
          </g>
        );
      })}
    </svg>
  );
}
