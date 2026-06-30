import L from "leaflet";

type BusMarkerIconOptions = {
  isLive: boolean;
  speed?: number | null;
  heading?: number;
  label?: string;
};

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

export function bearingBetweenPoints(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const phi1 = (fromLat * Math.PI) / 180;
  const phi2 = (toLat * Math.PI) / 180;
  const deltaLng = ((toLng - fromLng) * Math.PI) / 180;
  const y = Math.sin(deltaLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLng);
  return normalizeAngle((Math.atan2(y, x) * 180) / Math.PI);
}

export function createBusMarkerIcon({ isLive, speed, heading = 0, label = "الحافلة" }: BusMarkerIconOptions) {
  const statusClass = isLive ? "is-live" : "is-offline";
  const speedText = speed && speed > 1 ? `${Math.round(speed)} كم/س` : isLive ? "مباشر" : "آخر موقع";

  return L.divIcon({
    className: "smart-bus-marker-wrap",
    html: `
      <div class="smart-bus-marker ${statusClass}" style="--bus-heading:${normalizeAngle(heading)}deg">
        <div class="smart-bus-marker__pulse"></div>
        <div class="smart-bus-marker__ground"></div>
        <div class="smart-bus-marker__body">
          <div class="smart-bus-marker__roof"></div>
          <div class="smart-bus-marker__windows">
            <span></span><span></span><span></span>
          </div>
          <div class="smart-bus-marker__front"></div>
          <div class="smart-bus-marker__stripe"></div>
          <div class="smart-bus-marker__lights">
            <span></span><span></span>
          </div>
          <div class="smart-bus-marker__wheels">
            <span></span><span></span>
          </div>
        </div>
        <div class="smart-bus-marker__pin"></div>
        <div class="smart-bus-marker__label">
          <strong>${label}</strong>
          <small>${speedText}</small>
        </div>
      </div>
    `,
    iconSize: [78, 86],
    iconAnchor: [39, 68],
    popupAnchor: [0, -66],
  });
}
