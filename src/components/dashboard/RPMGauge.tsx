import { useMemo } from 'react';

interface RPMGaugeProps {
  value: number | null;
  maxRPM?: number;
}

export function RPMGauge({ value, maxRPM = 8000 }: RPMGaugeProps) {
  const rpm = value ?? 0;
  
  const { needleRotation, segments, tickMarks } = useMemo(() => {
    // Gauge goes from -135deg to 135deg (270deg total arc)
    const minAngle = -135;
    const maxAngle = 135;
    const angleRange = maxAngle - minAngle;
    
    const rotation = minAngle + (rpm / maxRPM) * angleRange;
    const clampedRotation = Math.min(Math.max(rotation, minAngle), maxAngle);

    // Create tick marks
    const ticks = [];
    const majorTickCount = 8;
    for (let i = 0; i <= majorTickCount; i++) {
      const tickRPM = (maxRPM / majorTickCount) * i;
      const tickAngle = minAngle + (i / majorTickCount) * angleRange;
      const isRedZone = tickRPM >= 6000;
      ticks.push({
        angle: tickAngle,
        label: tickRPM / 1000,
        isRedZone
      });
    }

    // Create arc segments for visual effect
    const segs = [];
    const segmentCount = 30;
    for (let i = 0; i < segmentCount; i++) {
      const segAngle = minAngle + (i / segmentCount) * angleRange;
      const segRPM = (maxRPM / segmentCount) * i;
      const isActive = segRPM <= rpm;
      const isRedZone = segRPM >= 6000;
      segs.push({ angle: segAngle, isActive, isRedZone });
    }

    return {
      needleRotation: clampedRotation,
      segments: segs,
      tickMarks: ticks
    };
  }, [rpm, maxRPM]);

  return (
    <div className="relative w-72 h-72 sm:w-80 sm:h-80">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full bg-gauge-bg border-4 border-gauge-border gauge-shadow">
        {/* Inner shadow ring */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-b from-secondary/50 to-transparent" />
        
        {/* Tick marks */}
        {tickMarks.map((tick, index) => (
          <div
            key={index}
            className="absolute left-1/2 top-1/2 origin-center"
            style={{
              transform: `rotate(${tick.angle}deg) translateY(-110px)`,
              width: '2px',
              marginLeft: '-1px'
            }}
          >
            <div
              className={`w-0.5 h-4 ${
                tick.isRedZone ? 'bg-destructive' : 'bg-muted-foreground'
              }`}
            />
            <div
              className={`text-xs font-bold mt-1 -ml-2 ${
                tick.isRedZone ? 'text-destructive' : 'text-muted-foreground'
              }`}
              style={{ transform: `rotate(${-tick.angle}deg)` }}
            >
              {tick.label}
            </div>
          </div>
        ))}

        {/* Arc segments */}
        {segments.map((seg, index) => (
          <div
            key={index}
            className="absolute left-1/2 top-1/2 origin-center"
            style={{ transform: `rotate(${seg.angle}deg)` }}
          >
            <div
              className={`w-1 h-6 -ml-0.5 rounded-full transition-all duration-150 ${
                seg.isActive
                  ? seg.isRedZone
                    ? 'bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]'
                    : 'bg-primary shadow-[0_0_10px_hsl(var(--primary))]'
                  : 'bg-secondary/30'
              }`}
              style={{ transform: 'translateY(-90px)' }}
            />
          </div>
        ))}

        {/* Needle */}
        <div
          className="absolute left-1/2 top-1/2 origin-center transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${needleRotation}deg)` }}
        >
          <div className="relative">
            {/* Needle body */}
            <div
              className="w-1 bg-gradient-to-t from-gauge-needle to-destructive rounded-full shadow-[0_0_15px_hsl(var(--gauge-needle))]"
              style={{
                height: '100px',
                transform: 'translateX(-50%) translateY(-95px)',
                marginLeft: '50%'
              }}
            />
            {/* Needle cap */}
            <div
              className="absolute left-1/2 top-1/2 w-6 h-6 -ml-3 -mt-3 rounded-full bg-gradient-to-br from-secondary to-muted border-2 border-gauge-border"
            />
          </div>
        </div>

        {/* Center cap */}
        <div className="absolute left-1/2 top-1/2 w-8 h-8 -ml-4 -mt-4 rounded-full bg-gradient-to-br from-muted to-secondary border border-border" />

        {/* RPM Label */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
          <span className="text-xs text-muted-foreground tracking-widest">x1000 RPM</span>
        </div>
      </div>
    </div>
  );
}
