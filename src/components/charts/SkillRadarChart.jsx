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
