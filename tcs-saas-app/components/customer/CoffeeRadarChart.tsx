// Pure SVG hexagon radar chart — 6 coffee profile axes
// Opposing axes are intentional contrasts: Body↔Sweetness, Acidity↔Creaminess, Freshness↔Aroma

const SIZE = 200
const CX = SIZE / 2
const CY = SIZE / 2
const MAX_R = 74
const LEVELS = 5

export const PROFILE_DIMS = [
  { key: 'body',      label: 'Body',    low: 'Ringan',  high: 'Full'    },
  { key: 'acidity',   label: 'Asam',    low: 'Mellow',  high: 'Bright'  },
  { key: 'freshness', label: 'Segar',   low: 'Berat',   high: 'Crisp'   },
  { key: 'sweetness', label: 'Manis',   low: 'Pahit',   high: 'Manis'   },
  { key: 'creaminess',label: 'Creamy',  low: 'Clean',   high: 'Rich'    },
  { key: 'aroma',     label: 'Aroma',   low: 'Subtle',  high: 'Bold'    },
]

export interface CoffeeProfile {
  body:       number
  acidity:    number
  freshness:  number
  sweetness:  number
  creaminess: number
  aroma:      number
}

function angleRad(i: number) {
  return -Math.PI / 2 + (i * Math.PI * 2) / 6
}

function pt(r: number, i: number) {
  const a = angleRad(i)
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

function hexPoints(r: number) {
  return PROFILE_DIMS.map((_, i) => {
    const p = pt(r, i)
    return `${p.x},${p.y}`
  }).join(' ')
}

export default function CoffeeRadarChart({ profile }: { profile: CoffeeProfile }) {
  const dataPoints = PROFILE_DIMS.map((d, i) => {
    const val = Math.max(1, Math.min(5, profile[d.key as keyof CoffeeProfile] ?? 3))
    const p = pt((val / LEVELS) * MAX_R, i)
    return `${p.x},${p.y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} style={{ overflow: 'visible' }}>
      {/* Grid rings */}
      {[1, 2, 3, 4, 5].map((lvl) => (
        <polygon
          key={lvl}
          points={hexPoints((lvl / LEVELS) * MAX_R)}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={lvl === 5 ? 1.5 : 1}
        />
      ))}

      {/* Axis spokes */}
      {PROFILE_DIMS.map((_, i) => {
        const p = pt(MAX_R, i)
        return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      })}

      {/* Data fill */}
      <polygon points={dataPoints} fill="rgba(244,185,66,0.22)" stroke="#F4B942" strokeWidth="2" strokeLinejoin="round" />

      {/* Data dots */}
      {PROFILE_DIMS.map((d, i) => {
        const val = Math.max(1, Math.min(5, profile[d.key as keyof CoffeeProfile] ?? 3))
        const p = pt((val / LEVELS) * MAX_R, i)
        return (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#F4B942" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
        )
      })}

      {/* Labels */}
      {PROFILE_DIMS.map((d, i) => {
        const p = pt(MAX_R + 17, i)
        return (
          <text
            key={i}
            x={p.x} y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9.5"
            fill="rgba(255,255,255,0.7)"
            fontWeight="600"
            fontFamily="system-ui"
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}
