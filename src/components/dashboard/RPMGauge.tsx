import { useMemo } from 'react';

interface RPMGaugeProps {
  value: number | null;
  maxRPM?: number;
}

export function RPMGauge({ value, maxRPM = 8000 }: RPMGaugeProps) {
  const rpm = value ?? 0;
  
  const { needleRotation, segments, tickMarks } = useMemo(() => {
    const minAngle = -135;
    const maxAngle = 135;
    const angleRange = maxAngle - minAngle;
    
    const rotation = minAngle + (rpm / maxRPM) * angleRange;
    const clampedRotation = Math.min(Math.max(rotation, minAngle), maxAngle);

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

  // Radius percentages for positioning elements
  const tickRadius = 0.38; // 38% from center
  const segmentRadius = 0.32; // 32% from center
  const needleLength = 0.30; // 30% of container

  return (
    <div className="relative w-56 h-56 xs:w-64 xs:h-64 sm:w-72 sm:h-72 md:w-80 md:h-80">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full bg-gauge-bg border-4 border-gauge-border gauge-shadow">
        {/* Inner shadow ring */}
        <div className="absolute inset-2 xs:inset-3 sm:inset-4 rounded-full bg-gradient-to-b from-secondary/50 to-transparent" />
        
        {/* Tick marks with numbers */}
        {tickMarks.map((tick, index) => {
          const angleRad = (tick.angle - 90) * (Math.PI / 180);
          const x = 50 + tickRadius * 100 * Math.cos(angleRad);
          const y = 50 + tickRadius * 100 * Math.sin(angleRad);
          
          return (
            <div
              key={index}
              className="absolute flex flex-col items-center"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Tick line */}
              <div
                className={`w-0.5 h-2.5 xs:h-3 sm:h-3.5 rounded-full ${
                  tick.isRedZone ? 'bg-destructive' : 'bg-muted-foreground'
                }`}
                style={{ transform: `rotate(${tick.angle}deg)` }}
              />
              {/* Number label */}
              <span
                className={`text-[10px] xs:text-xs sm:text-sm font-bold mt-0.5 ${
                  tick.isRedZone ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {tick.label}
              </span>
            </div>
          );
        })}

        {/* Arc segments */}
        {segments.map((seg, index) => {
          const angleRad = (seg.angle - 90) * (Math.PI / 180);
          const x = 50 + segmentRadius * 100 * Math.cos(angleRad);
          const y = 50 + segmentRadius * 100 * Math.sin(angleRad);
          
          return (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${seg.angle}deg)`
              }}
            >
              <div
                className={`w-0.5 xs:w-1 h-3.5 xs:h-4 sm:h-5 rounded-full transition-colors duration-100 ${
                  seg.isActive
                    ? seg.isRedZone
                      ? 'bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]'
                      : 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]'
                    : 'bg-secondary/30'
                }`}
              />
            </div>
          );
        })}

        {/* Needle */}
        <div
          className="absolute left-1/2 top-1/2 origin-center transition-transform duration-150 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          style={{ 
            transform: `translate(-50%, -50%) rotate(${needleRotation}deg)`,
            width: '4px',
            height: '100%'
          }}
        >
          <div className="relative h-full flex flex-col items-center">
            {/* Needle body */}
            <div
              className="w-0.5 xs:w-1 bg-gradient-to-t from-gauge-needle to-destructive rounded-full shadow-[0_0_12px_hsl(var(--gauge-needle))]"
              style={{
                height: `${needleLength * 100}%`,
                marginTop: '8%'
              }}
            />
          </div>
        </div>

        {/* Center cap */}
        <div className="absolute left-1/2 top-1/2 w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-muted to-secondary border border-border transform -translate-x-1/2 -translate-y-1/2" />

        {/* RPM Label */}
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-center">
          <span className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground tracking-widest">x1000 RPM</span>
        </div>
      </div>
    </div>
  );
}
