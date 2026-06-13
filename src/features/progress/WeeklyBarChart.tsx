import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { fonts } from '../../shared/theme/tokens';

interface WeeklyBarChartProps {
  data: number[];
  labels: string[];
  width: number;
  barColor: string;
  gridColor: string;
  labelColor: string;
}

const HEIGHT = 200;
const PAD_LEFT = 28;
const PAD_TOP = 12;
const PAD_BOTTOM = 26;
const BAR_BODY_OPACITY = 0.12;
const BAR_TOP_OPACITY = 0.65;
const BAR_TOP_HEIGHT = 3;

export function WeeklyBarChart({ data, labels, width, barColor, gridColor, labelColor }: WeeklyBarChartProps) {
  const maxValue = Math.max(1, ...data);
  const plotWidth = width - PAD_LEFT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const yOf = (value: number) => PAD_TOP + plotHeight - (value / maxValue) * plotHeight;
  const slotWidth = plotWidth / data.length;
  const barWidth = slotWidth * 0.5;

  const ticks = Array.from({ length: maxValue + 1 }, (_, i) => i);

  return (
    <Svg width={width} height={HEIGHT}>
      {ticks.map((tick) => (
        <Line
          key={`grid-${tick}`}
          x1={PAD_LEFT}
          y1={yOf(tick)}
          x2={width}
          y2={yOf(tick)}
          stroke={gridColor}
          strokeWidth={1}
        />
      ))}
      {ticks.map((tick) => (
        <SvgText
          key={`ylabel-${tick}`}
          x={PAD_LEFT - 8}
          y={yOf(tick) + 4}
          fontSize={11}
          fill={labelColor}
          textAnchor="end"
          fontFamily={fonts.body}
        >
          {String(tick)}
        </SvgText>
      ))}
      {data.map((value, index) => {
        if (value <= 0) return null;
        const x = PAD_LEFT + index * slotWidth + (slotWidth - barWidth) / 2;
        const top = yOf(value);
        return (
          <Rect
            key={`bar-${index}`}
            x={x}
            y={top}
            width={barWidth}
            height={PAD_TOP + plotHeight - top}
            fill={barColor}
            opacity={BAR_BODY_OPACITY}
          />
        );
      })}
      {data.map((value, index) => {
        if (value <= 0) return null;
        const x = PAD_LEFT + index * slotWidth + (slotWidth - barWidth) / 2;
        return (
          <Rect
            key={`bartop-${index}`}
            x={x}
            y={yOf(value)}
            width={barWidth}
            height={BAR_TOP_HEIGHT}
            fill={barColor}
            opacity={BAR_TOP_OPACITY}
          />
        );
      })}
      {labels.map((label, index) =>
        label ? (
          <SvgText
            key={`xlabel-${index}`}
            x={PAD_LEFT + index * slotWidth + slotWidth / 2}
            y={HEIGHT - 8}
            fontSize={11}
            fill={labelColor}
            textAnchor="middle"
            fontFamily={fonts.body}
          >
            {label}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
}
