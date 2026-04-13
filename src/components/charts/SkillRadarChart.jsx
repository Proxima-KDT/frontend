import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LabelList,
} from 'recharts';

/** 꼭짓점(축)마다 구분되는 색 — 점수·라벨·막대 그래프에 동일 적용 */
export const SKILL_AXIS_COLORS = [
  '#2563ab',
  '#2d7a52',
  '#b45309',
  '#a84868',
  '#5b4d9a',
  '#0d9488',
  '#7c2d12',
];

const AXIS_COLORS = SKILL_AXIS_COLORS;

function axisLabelFromTickPayload(payload) {
  if (payload == null) return '';
  if (typeof payload === 'string') return payload;
  const inner = payload.payload ?? payload;
  if (typeof inner === 'string') return inner;
  return (
    inner?.subject ?? inner?.value ?? payload.subject ?? payload.value ?? ''
  );
}

/** 긴 한글 라벨이 잘리지 않도록 2줄로 나눔 (대략 중간·공백 우선) */
function splitAxisLabel(text) {
  const t = String(text || '').trim();
  if (t.length <= 6) return [t];
  const space = t.indexOf(' ');
  if (space > 0 && space < t.length - 1) {
    return [t.slice(0, space), t.slice(space + 1)];
  }
  const mid = Math.ceil(t.length / 2);
  return [t.slice(0, mid), t.slice(mid)];
}

export default function SkillRadarChart({
  data,
  color = '#3B82F6',
  size = 'full',
  variant = 'default',
}) {
  const isEditorial = variant === 'editorial';
  const height = size === 'mini' ? 220 : isEditorial ? 320 : 360;
  const outerRadius = size === 'mini' ? 78 : isEditorial ? 88 : 108;
  const chartMargin = isEditorial
    ? { top: 36, right: 52, bottom: 36, left: 52 }
    : { top: 24, right: 24, bottom: 24, left: 24 };

  const renderAngleTick = (props) => {
    const { payload, x, y, textAnchor, index } = props;
    if (x == null || y == null) return null;
    const label = axisLabelFromTickPayload(payload);
    if (!label) return null;
    const fill = AXIS_COLORS[(index ?? 0) % AXIS_COLORS.length];
    const fontSize = isEditorial ? 10 : size === 'mini' ? 10 : 11.5;
    if (isEditorial) {
      const lines = splitAxisLabel(label);
      const firstDy = lines.length > 1 ? '-0.35em' : '0.35em';
      return (
        <text
          x={x}
          y={y}
          textAnchor={textAnchor || 'middle'}
          fill={fill}
          fontSize={fontSize}
          fontWeight={600}
          fontFamily="'Inter', 'Pretendard Variable', 'Pretendard', system-ui, sans-serif"
        >
          {lines.map((line, i) => (
            <tspan key={i} x={x} dy={i === 0 ? firstDy : '1.05em'}>
              {line}
            </tspan>
          ))}
        </text>
      );
    }
    const lines = splitAxisLabel(label);
    const firstDy = lines.length > 1 ? '-0.35em' : '0.35em';
    return (
      <text
        x={x}
        y={y}
        textAnchor={textAnchor || 'middle'}
        fill={fill}
        fontSize={fontSize}
        fontWeight={600}
        fontFamily="'Inter', 'Pretendard Variable', 'Pretendard', system-ui, sans-serif"
      >
        {lines.map((line, i) => (
          <tspan key={i} x={x} dy={i === 0 ? firstDy : '1.2em'}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  const renderScoreDot = (props) => {
    const { cx, cy, index } = props;
    if (typeof cx !== 'number' || typeof cy !== 'number') return null;
    const fill = AXIS_COLORS[(index ?? 0) % AXIS_COLORS.length];
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isEditorial ? 4.5 : 9.5}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    );
  };

  const renderScoreLabel = (props) => {
    const { x, y, value, index } = props;
    if (typeof x !== 'number' || typeof y !== 'number') return null;
    const fill = AXIS_COLORS[(index ?? 0) % AXIS_COLORS.length];
    return (
      <text
        x={x}
        y={y - 10}
        textAnchor="middle"
        fontSize={isEditorial ? 10 : 15}
        fontWeight={700}
        fill={fill}
        fontFamily="'Inter', 'Pretendard Variable', 'Pretendard', system-ui, sans-serif"
      >
        {Math.round(Number(value) || 0)}
      </text>
    );
  };

  const gridStroke = isEditorial ? '#e3e0da' : '#D8DEE8';
  const radiusTickFill = isEditorial ? '#a8a29e' : '#94A3B8';
  const radarStroke = isEditorial ? '#5c5852' : color;
  const radarFill = isEditorial ? '#6b6560' : color;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart
        data={data}
        cx="50%"
        cy="50%"
        outerRadius={outerRadius}
        margin={chartMargin}
      >
        <PolarGrid stroke={gridStroke} strokeOpacity={isEditorial ? 1 : 0.9} />
        <PolarAngleAxis dataKey="subject" tickLine={false} tick={false} />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: isEditorial ? 9 : 10, fill: radiusTickFill }}
          tickCount={5}
        />
        {!isEditorial && (
          <Radar
            name="기준 역량"
            dataKey={(entry) => Math.max(0, (entry?.score ?? 0) - 12)}
            stroke="#f2be3f"
            fill="#f2be3f"
            fillOpacity={0.5}
            strokeWidth={1.5}
          />
        )}
        {isEditorial && (
          <Radar
            name="기준"
            dataKey={(entry) => Math.max(0, (entry?.score ?? 0) - 18)}
            stroke="#d6d3cd"
            fill="#d6d3cd"
            fillOpacity={0.22}
            strokeWidth={1}
          />
        )}
        <Radar
          name="역량"
          dataKey="score"
          stroke={radarStroke}
          fill={radarFill}
          fillOpacity={isEditorial ? 0.22 : 0.45}
          strokeWidth={isEditorial ? 2 : 2.4}
          dot={renderScoreDot}
        >
          <LabelList dataKey="score" content={renderScoreLabel} />
        </Radar>
      </RadarChart>
    </ResponsiveContainer>
  );
}
