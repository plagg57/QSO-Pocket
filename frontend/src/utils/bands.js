// Auto-detect ham radio band from frequency (MHz)
const BANDS = [
  { min: 0.1357, max: 0.1378, band: "2200m" },
  { min: 0.472, max: 0.479, band: "630m" },
  { min: 1.8, max: 2.0, band: "160m" },
  { min: 3.5, max: 3.8, band: "80m" },
  { min: 5.3515, max: 5.3665, band: "60m" },
  { min: 7.0, max: 7.2, band: "40m" },
  { min: 10.1, max: 10.15, band: "30m" },
  { min: 14.0, max: 14.35, band: "20m" },
  { min: 18.068, max: 18.168, band: "17m" },
  { min: 21.0, max: 21.45, band: "15m" },
  { min: 24.89, max: 24.99, band: "12m" },
  { min: 28.0, max: 29.7, band: "10m" },
  { min: 50.0, max: 52.0, band: "6m" },
  { min: 70.0, max: 70.5, band: "4m" },
  { min: 144.0, max: 146.0, band: "2m" },
  { min: 430.0, max: 440.0, band: "70cm" },
  { min: 1240.0, max: 1300.0, band: "23cm" },
  { min: 2300.0, max: 2450.0, band: "13cm" },
];

export function getBand(frequencyMHz) {
  if (!frequencyMHz || frequencyMHz <= 0) return null;
  const freq = parseFloat(frequencyMHz);
  for (const b of BANDS) {
    if (freq >= b.min && freq <= b.max) return b.band;
  }
  return null;
}
