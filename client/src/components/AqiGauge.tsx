import { AQI_BANDS } from '@/lib/aqi';

const CX = 150,
  CY = 150,
  R = 118;
const toXY = (value: number, radius = R) => {
  const theta = Math.PI - (Math.min(500, Math.max(0, value)) / 500) * Math.PI; // 0 → left, 500 → right
  return { x: CX + radius * Math.cos(theta), y: CY - radius * Math.sin(theta) };
};
const arc = (from: number, to: number) => {
  const a = toXY(from),
    b = toXY(to);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};

/** Semicircular AQI gauge. Colour is never the only signal: the number and category are printed in text. */
export function AqiGauge({
  aqi,
  label,
  color,
}: {
  aqi: number;
  label: string;
  /** Text colour for the category label; pass the accessible dark `fg`, not the bright band colour. */ color: string;
}) {
  const deg = (Math.min(500, Math.max(0, aqi)) / 500) * 180;
  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 300 238"
        role="img"
        aria-label={`Air quality index ${aqi} out of 500, category ${label}`}
        className="mx-auto w-full max-w-[320px]"
      >
        {AQI_BANDS.map((b, i) => (
          <path
            key={b.key}
            d={arc(i === 0 ? 0 : b.min - 1, b.max)}
            fill="none"
            stroke={b.color}
            strokeWidth="18"
            strokeLinecap="butt"
            opacity={aqi <= b.max && aqi >= b.min - 1 ? 1 : 0.38}
          />
        ))}
        <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: `${CX}px ${CY}px`, transition: 'transform 600ms ease-out' }}>
          <line x1={CX} y1={CY} x2={CX - (R - 26)} y2={CY} stroke="#0B2E19" strokeWidth="4" strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r="9" fill="#0B2E19" />
        <text x={CX} y={CY + 56} textAnchor="middle" fontSize="46" fontWeight="700" fill="#0B2E19">
          {aqi}
        </text>
        <text x={CX} y={CY + 78} textAnchor="middle" fontSize="15" fontWeight="700" fill={color}>
          {label}
        </text>
        <text x="32" y={CY + 18} textAnchor="middle" fontSize="10" fill="#3F5247">
          0
        </text>
        <text x="268" y={CY + 18} textAnchor="middle" fontSize="10" fill="#3F5247">
          500
        </text>
      </svg>
    </figure>
  );
}
