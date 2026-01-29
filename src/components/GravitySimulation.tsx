import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { AutorenewRounded, PauseRounded, PlayArrowRounded } from '@mui/icons-material';
import { ControlSlider, useElementSize } from './simShared';

export const GravitySimulation = ({ learningMode }: { learningMode: boolean }) => {
  const [earthMass, setEarthMass] = useState(6);
  const [moonMass, setMoonMass] = useState(3);
  const [distance, setDistance] = useState(220);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'diagram' | 'explore'>('diagram');
  const [showAcceleration, setShowAcceleration] = useState(false);
  const [showOrbitPath, setShowOrbitPath] = useState(true);
  const [highlightPair, setHighlightPair] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showTextbook, setShowTextbook] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const size = useElementSize(containerRef);
  const animationRef = useRef<number | null>(null);
  const starsRef = useRef<{ x: number; y: number; r: number; a: number }[]>([]);
  const angleRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    starsRef.current = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * size.width,
      y: Math.random() * size.height,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.7 + 0.2,
    }));
  }, [size.width, size.height]);

  const calculateGravity = useCallback(() => {
    const G = 24000;
    const force = (G * earthMass * moonMass) / (distance * distance);
    return Math.max(0.5, force);
  }, [distance, earthMass, moonMass]);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    label: string,
    labelPosition: { x: number; y: number } | null = null,
  ) => {
    const headLength = 12;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = 'bold 13px "Pretendard", sans-serif';
      if (labelPosition) {
        ctx.fillText(label, labelPosition.x, labelPosition.y);
      } else {
        ctx.fillText(label, toX + Math.cos(angle) * 18, toY + Math.sin(angle) * 18);
      }
    }
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { width, height } = size;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const isDiagram = viewMode === 'diagram';

      ctx.clearRect(0, 0, width, height);
      if (isDiagram) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, width - 36, height - 36);
      } else {
        const spaceGradient = ctx.createRadialGradient(centerX, centerY - 180, 40, centerX, centerY, width * 0.9);
        spaceGradient.addColorStop(0, '#101b3a');
        spaceGradient.addColorStop(1, '#020617');
        ctx.fillStyle = spaceGradient;
        ctx.fillRect(0, 0, width, height);
      }

      if (!isDiagram) {
        starsRef.current.forEach((star) => {
          ctx.beginPath();
          ctx.fillStyle = `rgba(248, 250, 252, ${star.a})`;
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (!isPaused && viewMode === 'explore') {
        const angularSpeed = 0.003 + (260 / distance) * 0.002;
        angleRef.current += angularSpeed;
      }
      if (!isPaused) {
        timeRef.current += 0.02;
      }

      const earthRadius = 26 + earthMass * 2.6;
      const moonRadius = 12 + moonMass * 1.6;

      const moonX = isDiagram ? centerX + distance : centerX + Math.cos(angleRef.current) * distance;
      const moonY = isDiagram ? centerY : centerY + Math.sin(angleRef.current) * distance;

      if (!isDiagram && showOrbitPath) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.setLineDash([6, 10]);
        ctx.lineWidth = 1.5;
        ctx.arc(centerX, centerY, distance, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.strokeStyle = isDiagram ? 'rgba(15, 23, 42, 0.25)' : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = isDiagram ? 2 : 1;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(moonX, moonY);
      ctx.stroke();

      const forceMag = calculateGravity();
      const arrowLength = Math.min(distance - earthRadius - moonRadius - 6, 40 + forceMag * 1.4);
      const pulse =
        highlightPair && viewMode === 'diagram' ? 0.5 + Math.sin(timeRef.current * 2) * 0.5 : 0;
      const highlight = highlightPair ? 0.3 + pulse * 0.4 : 0;

      const angleToEarth = Math.atan2(centerY - moonY, centerX - moonX);
      const diagramColor = 'rgba(15, 23, 42, 0.85)';
      const actionColor = isDiagram ? diagramColor : `rgba(248, 113, 113, ${0.85 + highlight})`;
      const reactionColor = isDiagram ? diagramColor : `rgba(96, 165, 250, ${0.85 + highlight})`;
      drawArrow(
        ctx,
        moonX,
        moonY,
        moonX + Math.cos(angleToEarth) * arrowLength,
        moonY + Math.sin(angleToEarth) * arrowLength,
        actionColor,
        isDiagram ? '' : 'F_E',
      );

      const angleToMoon = Math.atan2(moonY - centerY, moonX - centerX);
      drawArrow(
        ctx,
        centerX,
        centerY,
        centerX + Math.cos(angleToMoon) * arrowLength,
        centerY + Math.sin(angleToMoon) * arrowLength,
        reactionColor,
        isDiagram ? '' : 'F_M',
      );

      if (isDiagram) {
        const midLeftX = (centerX + moonX) / 2 - 20;
        const midY = centerY - 18;
        ctx.font = 'bold 14px "Pretendard", sans-serif';
        ctx.fillStyle = diagramColor;
        ctx.fillText('F_M', midLeftX - 35, midY);
        ctx.fillText('F_E', midLeftX + 45, midY);
      }

      if (showAcceleration) {
        const accelEarth = forceMag / earthMass;
        const accelMoon = forceMag / moonMass;
        const accelScale = 10;
        const earthAccelLen = Math.min(60, accelEarth * accelScale);
        const moonAccelLen = Math.min(80, accelMoon * accelScale);

        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - earthRadius - 6, centerY);
        ctx.lineTo(centerX - earthRadius - 6 - earthAccelLen, centerY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(248, 113, 113, 0.45)';
        ctx.beginPath();
        ctx.moveTo(moonX + moonRadius + 6, moonY);
        ctx.lineTo(moonX + moonRadius + 6 + moonAccelLen, moonY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '600 12px "Pretendard", sans-serif';
        ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
        ctx.fillText('a_E', centerX - earthRadius - 10 - earthAccelLen, centerY - 10);
        ctx.fillText('a_M', moonX + moonRadius + 10 + moonAccelLen, moonY - 10);
      }

      ctx.beginPath();
      if (isDiagram) {
        ctx.fillStyle = '#cfe3f7';
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      } else {
        const earthGradient = ctx.createRadialGradient(
          centerX - earthRadius * 0.35,
          centerY - earthRadius * 0.35,
          earthRadius * 0.2,
          centerX,
          centerY,
          earthRadius,
        );
        earthGradient.addColorStop(0, '#bfdbfe');
        earthGradient.addColorStop(0.45, '#60a5fa');
        earthGradient.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = earthGradient;
        ctx.shadowBlur = 26;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.55)';
      }
      ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!isDiagram) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX - earthRadius * 0.2, centerY - earthRadius * 0.2, earthRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + earthRadius * 0.3, centerY + earthRadius * 0.1, earthRadius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      if (isDiagram) {
        ctx.fillStyle = '#d1d5db';
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      } else {
        const moonGradient = ctx.createRadialGradient(
          moonX - moonRadius * 0.4,
          moonY - moonRadius * 0.4,
          moonRadius * 0.2,
          moonX,
          moonY,
          moonRadius,
        );
        moonGradient.addColorStop(0, '#f1f5f9');
        moonGradient.addColorStop(0.55, '#cbd5e1');
        moonGradient.addColorStop(1, '#64748b');
        ctx.fillStyle = moonGradient;
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(248, 250, 252, 0.35)';
      }
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!isDiagram) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.beginPath();
        ctx.arc(moonX - moonRadius * 0.2, moonY + moonRadius * 0.1, moonRadius * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
        ctx.arc(moonX + moonRadius * 0.25, moonY + moonRadius * 0.25, moonRadius * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [
      calculateGravity,
      distance,
      earthMass,
      isPaused,
      moonMass,
      size,
      showAcceleration,
      showOrbitPath,
      viewMode,
      highlightPair,
    ],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const render = () => {
      draw(ctx);
      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw, size.height, size.width]);

  const reset = () => {
    setEarthMass(6);
    setMoonMass(3);
    setDistance(220);
    angleRef.current = 0;
  };

  const forceValue = calculateGravity();
  const earthAccel = forceValue / earthMass;
  const moonAccel = forceValue / moonMass;

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <Paper
        elevation={0}
        sx={{
          width: 320,
          height: '100%',
          borderRight: '1px solid rgba(15, 23, 42, 0.15)',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          overflow: 'auto',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.96) 100%)',
          color: '#f8fafc',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Example 2 — Non-contact force between the Earth and the Moon
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.85)' }}>
            Objects can interact without coming into contact. The Earth and the Moon continuously interact:
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="body2">• the Earth pulls on the Moon with a force F_E</Typography>
            <Typography variant="body2">• the Moon pulls on the Earth with a force F_M</Typography>
          </Stack>
        </Box>
        {learningMode && (
          <Box sx={{ position: 'sticky', top: 0, zIndex: 2, pb: 2, bgcolor: 'rgba(15, 23, 42, 0.92)' }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                bgcolor: 'rgba(59, 130, 246, 0.18)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: '#e2e8f0',
              }}
            >
              <CardContent>
                <Typography variant="overline" sx={{ color: 'rgba(191, 219, 254, 0.9)' }}>
                  Guided mode
                </Typography>
                <Stack spacing={0.6} sx={{ mt: 1 }}>
                  <Typography variant="body2">1) Change mass or distance.</Typography>
                  <Typography variant="body2">2) Compare F_E and F_M arrows.</Typography>
                  <Typography variant="body2">3) Check acceleration values.</Typography>
                </Stack>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1.5, fontWeight: 700, color: '#e2e8f0', borderColor: 'rgba(226, 232, 240, 0.5)' }}
                  onClick={() => setShowExplanation((prev) => !prev)}
                >
                  {showExplanation ? 'Hide explanation' : 'Show explanation'}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1, fontWeight: 700, bgcolor: '#1d4ed8' }}
                  onClick={() => setShowTextbook(true)}
                >
                  Open textbook explanation
                </Button>
              </CardContent>
            </Card>
          </Box>
        )}
        {learningMode && showExplanation && (
          <Box
            sx={{
              borderRadius: 3,
              bgcolor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              color: '#e2e8f0',
              px: 2.5,
              py: 2,
            }}
          >
            <Typography variant="overline" sx={{ color: 'rgba(191, 219, 254, 0.8)' }}>
              Explanation
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(226, 232, 240, 0.9)', lineHeight: 1.7 }}>
              Earth pulls on the Moon with F_E, while the Moon pulls on Earth with F_M. These forces are equal in
              magnitude and opposite in direction. Different masses mean different accelerations, not different forces.
            </Typography>
          </Box>
        )}
        <Box>
          <Typography variant="overline" sx={{ color: 'rgba(148, 163, 184, 0.9)' }}>
            View mode
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            <Typography variant="caption">Diagram</Typography>
            <Switch
              checked={viewMode === 'explore'}
              onChange={(_, checked) => setViewMode(checked ? 'explore' : 'diagram')}
              color="secondary"
            />
            <Typography variant="caption">Explore</Typography>
          </Stack>
        </Box>
        {viewMode === 'explore' && (
          <>
            <ControlSlider
              label="Earth Mass"
              value={earthMass}
              onChange={setEarthMass}
              min={1}
              max={10}
              unit="Mₑ"
              tone="dark"
            />
            <ControlSlider
              label="Moon Mass"
              value={moonMass}
              onChange={setMoonMass}
              min={1}
              max={10}
              unit="Mₘ"
              tone="dark"
            />
            <ControlSlider
              label="Distance"
              value={distance}
              onChange={setDistance}
              min={120}
              max={350}
              step={5}
              unit="px"
              tone="dark"
            />
            <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.3)' }} />
            <Box>
              <Typography variant="overline" sx={{ color: 'rgba(148, 163, 184, 0.9)' }}>
                Explore tools
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <Typography variant="caption">Orbit path</Typography>
                <Switch
                  checked={showOrbitPath}
                  onChange={(_, checked) => setShowOrbitPath(checked)}
                  color="secondary"
                />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <Typography variant="caption">Show acceleration</Typography>
                <Switch
                  checked={showAcceleration}
                  onChange={(_, checked) => setShowAcceleration(checked)}
                  color="secondary"
                />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <Typography variant="caption">Highlight force pair</Typography>
                <Switch
                  checked={highlightPair}
                  onChange={(_, checked) => setHighlightPair(checked)}
                  color="secondary"
                />
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setIsPaused((prev) => !prev)}
                startIcon={isPaused ? <PlayArrowRounded /> : <PauseRounded />}
                sx={{ py: 1.1, fontWeight: 700, bgcolor: '#1d4ed8' }}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <IconButton
                onClick={reset}
                sx={{
                  border: '1px solid rgba(226, 232, 240, 0.3)',
                  borderRadius: 2,
                  color: '#f8fafc',
                }}
              >
                <AutorenewRounded />
              </IconButton>
            </Stack>
          </>
        )}
        <Box
          sx={{
            mt: 'auto',
            width: '100%',
            borderRadius: 3,
            bgcolor: 'rgba(59, 130, 246, 0.14)',
            border: '1px solid rgba(96, 165, 250, 0.45)',
            color: '#e2e8f0',
            px: 2.5,
            py: 2,
          }}
        >
          <Typography variant="overline" sx={{ color: 'rgba(191, 219, 254, 0.85)' }}>
            Key statement
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'rgba(226, 232, 240, 0.9)' }}>
            The forces F_E and F_M are equal in magnitude, act in opposite directions, and are not acting on the same
            object.
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.75 }}>
            Formula: F ∝ (m₁ × m₂) / r²
          </Typography>
          <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.3)', my: 1.5 }} />
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
            Force (relative units): {forceValue.toFixed(1)}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
            Acceleration of Earth: {earthAccel.toFixed(2)}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
            Acceleration of Moon: {moonAccel.toFixed(2)}
          </Typography>
        </Box>
        {viewMode === 'explore' && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              bgcolor: 'rgba(148, 163, 184, 0.12)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              color: '#e2e8f0',
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: 'rgba(191, 219, 254, 0.8)' }}>
                What to observe
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(226, 232, 240, 0.9)' }}>
                Increase Earth mass or Moon mass. The force arrows stay the same length, but the smaller mass has a
                larger acceleration.
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                Scale note: values are in relative units (not real‑world Newtons).
              </Typography>
            </CardContent>
          </Card>
        )}
        {viewMode === 'explore' && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              bgcolor: 'rgba(59, 130, 246, 0.18)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#e2e8f0',
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: 'rgba(191, 219, 254, 0.9)' }}>
                Learning goal
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(226, 232, 240, 0.92)' }}>
                Explain why the Earth–Moon forces are equal even when the masses are different.
              </Typography>
            </CardContent>
          </Card>
        )}
        {viewMode === 'explore' && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              bgcolor: 'rgba(15, 23, 42, 0.2)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              color: '#e2e8f0',
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: 'rgba(191, 219, 254, 0.8)' }}>
                Check question
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(226, 232, 240, 0.9)' }}>
                If Earth is much larger, does it pull harder on the Moon?
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                Answer: No. The forces are equal; Earth’s larger mass means smaller acceleration.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Paper>

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          height: '100%',
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(circle at top, rgba(30, 64, 175, 0.2), rgba(2, 6, 23, 0.9))',
        }}
      >
        {viewMode === 'explore' && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              top: 24,
              left: 24,
              px: 2,
              py: 1.2,
              borderRadius: 2,
              bgcolor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              color: '#e2e8f0',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Force pair: |F_E| = |F_M|
            </Typography>
          </Paper>
        )}
        {viewMode === 'explore' && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              top: 88,
              left: 24,
              px: 2,
              py: 1.2,
              borderRadius: 2,
              bgcolor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              color: '#e2e8f0',
              minWidth: 180,
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
              Force (rel): {forceValue.toFixed(1)}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
              Distance r: {distance}px
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
              a_E: {earthAccel.toFixed(2)} | a_M: {moonAccel.toFixed(2)}
            </Typography>
          </Paper>
        )}
        {viewMode === 'explore' && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              top: 24,
              right: 24,
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: 'rgba(15, 23, 42, 0.75)',
              color: '#f8fafc',
              border: '1px solid rgba(148, 163, 184, 0.35)',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Equal magnitude
            </Typography>
          </Paper>
        )}

        <canvas ref={canvasRef} />

        {viewMode === 'explore' && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              px: 2.5,
              py: 2,
              borderRadius: 2,
              bgcolor: 'rgba(15, 23, 42, 0.72)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              color: '#e2e8f0',
              maxWidth: 260,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Common misconception check
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
              Bigger mass does not mean bigger force. The forces are equal; the acceleration is different because
              a = F / m.
            </Typography>
          </Paper>
        )}
      </Box>
      <Dialog open={showTextbook} onClose={() => setShowTextbook(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Textbook explanation — Example 2</DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src="/textbook_example2.png"
            alt="Textbook Example 2: Non-contact force between the Earth and the Moon"
            sx={{ width: '100%', borderRadius: 2, border: '1px solid rgba(148, 163, 184, 0.35)' }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
