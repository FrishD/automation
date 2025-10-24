
import React, { useEffect, useRef } from 'react';

const CircularWaveform = ({
  isAnimating = false,
  barCount = 60,
  barWidth = 4,
  waveAmplitude = 50,
  radius = 100,
  barMinHeight = 5,
  strokeLinecap = "round",
  rotationOffset = 0,
  growOutwardsOnly = false,
  barColor = "rgb(129, 140, 248)", // Indigo-400
  height = 250,
  width = 250,
}) => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = width / 2;
    const centerY = height / 2;
    let frame = 0;

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      const waveformSamples = Array(barCount).fill(0).map((_, i) => {
        const seed = i * 1000;
        const random = () => {
          var x = Math.sin(seed++) * 10000;
          return x - Math.floor(x);
        };
        return (
          Math.max(
            0.1,
            Math.abs(Math.sin(frame / 20 + i / (barCount / (2 * Math.PI)))) +
            random() * 0.3
          ) * 0.5 + 0.25
        );
      });

      waveformSamples.forEach((sample, i) => {
        const angleRad = (i / barCount) * 2 * Math.PI + (rotationOffset * Math.PI) / 180;
        const dynamicHeight = Math.max(barMinHeight, sample * waveAmplitude);

        let startRadius, endRadius;

        if (growOutwardsOnly) {
          startRadius = radius;
          endRadius = radius + dynamicHeight;
        } else {
          startRadius = radius - dynamicHeight / 2;
          endRadius = radius + dynamicHeight / 2;
        }

        const x1 = centerX + startRadius * Math.cos(angleRad);
        const y1 = centerY + startRadius * Math.sin(angleRad);
        const x2 = centerX + endRadius * Math.cos(angleRad);
        const y2 = centerY + endRadius * Math.sin(angleRad);

        const hue = (frame / 2 + i * 5) % 360;
        const color = `hsl(${hue}, 80%, 70%)`;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = barWidth;
        ctx.lineCap = strokeLinecap;
        ctx.stroke();
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    if (isAnimating) {
      animate();
    } else {
      ctx.clearRect(0, 0, width, height); // Clear canvas when not animating
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isAnimating, barCount, barWidth, waveAmplitude, radius, barMinHeight, strokeLinecap, rotationOffset, growOutwardsOnly, barColor, height, width]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block' }}
    />
  );
};

export default CircularWaveform;
