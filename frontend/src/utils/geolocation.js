export const toNumberOrNull = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue.toLowerCase() === 'null' || trimmedValue.toLowerCase() === 'undefined') {
      return null;
    }
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

export const haversineDistanceKm = (fromPos, toPos) => {
  if (!fromPos || !toPos) return null;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const [lat1, lon1] = fromPos;
  const [lat2, lon2] = toPos;

  const latDelta = toRadians(lat2 - lat1);
  const lonDelta = toRadians(lon2 - lon1);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
    * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};
