import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

function EmergencyMapPanel({
  points = [],
  title = "Emergency Map",
  subtitle = "Live incident and infrastructure locations",
}) {
  const safePoints = Array.isArray(points) ? points : [];

  const validPoints = safePoints.filter(
    (point) =>
      point &&
      Number.isFinite(Number(point.latitude)) &&
      Number.isFinite(Number(point.longitude))
  );

  const center = validPoints[0]
    ? [Number(validPoints[0].latitude), Number(validPoints[0].longitude)]
    : [26.9124, 75.7873];

  return (
    <section className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">
        Map Layer
      </p>

      <h2 className="mt-2 font-display text-2xl text-ink-950">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-ink-800">
        {subtitle}
      </p>

      <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={false}
          className="h-[320px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validPoints.map((point) => (
            <CircleMarker
              key={point.id || `${point.latitude}-${point.longitude}`}
              center={[Number(point.latitude), Number(point.longitude)]}
              radius={10}
              pathOptions={{
                color: point.color || "#0f766e",
                fillColor: point.color || "#16a34a",
                fillOpacity: 0.75,
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-ink-950">
                    {point.title}
                  </p>

                  {point.subtitle ? (
                    <p className="text-sm text-ink-800">
                      {point.subtitle}
                    </p>
                  ) : null}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}

export default EmergencyMapPanel;