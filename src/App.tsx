import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CssBaseline,
  Divider,
  GlobalStyles,
  IconButton,
  Paper,
  Slider,
  Stack,
  Tab,
  Tabs,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import {
  AutorenewRounded,
  CloseRounded,
  GavelRounded,
  InfoOutlined,
  PauseRounded,
  PlayArrowRounded,
  PublicRounded,
  ScienceRounded,
} from '@mui/icons-material';

type TabKey = 'contact' | 'gravity';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1f6feb',
    },
    secondary: {
      main: '#f97316',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: '"MaruBuri", "Pretendard", "Elice DX Neolli", "Segoe UI", sans-serif',
    h4: {
      fontWeight: 800,
    },
    h6: {
      fontWeight: 700,
    },
    body1: {
      fontSize: 15,
    },
  },
  shape: {
    borderRadius: 16,
  },
});

const useElementSize = <T extends HTMLElement>(ref: React.RefObject<T>) => {
  const [size, setSize] = useState({ width: 960, height: 600 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({
        width: Math.max(320, Math.floor(width)),
        height: Math.max(320, Math.floor(height)),
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return size;
};

const ForceCard = ({
  title,
  value,
  color,
  sub,
  variant = 'light',
}: {
  title: string;
  value: string;
  color: string;
  sub?: string;
  variant?: 'light' | 'dark';
}) => (
  <Card
    elevation={0}
    sx={{
      minWidth: 170,
      borderRadius: 3,
      border: variant === 'light' ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255,255,255,0.15)',
      background:
        variant === 'light'
          ? 'rgba(255,255,255,0.9)'
          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.8))',
      color: variant === 'light' ? '#0f172a' : '#f8fafc',
      backdropFilter: 'blur(10px)',
    }}
  >
    <CardContent sx={{ py: 2, px: 2.5 }}>
      <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>
        {title}
      </Typography>
      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {sub}
          </Typography>
        )}
      </Stack>
    </CardContent>
  </Card>
);

const ControlSlider = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled,
  tone = 'light',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  tone?: 'light' | 'dark';
}) => (
  <Box>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, color: tone === 'light' ? 'inherit' : 'rgba(226, 232, 240, 0.92)' }}
      >
        {label}
      </Typography>
      <Chip
        label={`${value}${unit ? ` ${unit}` : ''}`}
        size="small"
        sx={{
          fontWeight: 700,
          bgcolor: tone === 'light' ? 'rgba(15, 23, 42, 0.06)' : 'rgba(148, 163, 184, 0.2)',
          color: tone === 'light' ? 'inherit' : '#e2e8f0',
        }}
      />
    </Stack>
    <Slider
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(_, nextValue) => onChange(nextValue as number)}
      disabled={disabled}
      valueLabelDisplay="auto"
      sx={{
        mt: 1.5,
        color: tone === 'light' ? 'primary.main' : '#60a5fa',
        '& .MuiSlider-track': {
          backgroundColor: tone === 'light' ? undefined : '#60a5fa',
        },
        '& .MuiSlider-rail': {
          opacity: 0.35,
        },
        '& .MuiSlider-valueLabel': {
          bgcolor: tone === 'light' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.9)',
        },
      }}
    />
  </Box>
);

const ContactForceSimulation = () => {
  const [mass, setMass] = useState(5);
  const [velocity, setVelocity] = useState(5);
  const [isStriking, setIsStriking] = useState(false);
  const [impact, setImpact] = useState({ force: 0, active: false });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const size = useElementSize(containerRef);
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef({
    phase: 'idle' as 'idle' | 'down' | 'contact' | 'up',
    hammerY: 0,
    nailY: 0,
    impactFrames: 0,
    targetNailY: 0,
    ready: false,
  });

  const reset = useCallback(() => {
    stateRef.current = {
      phase: 'idle',
      hammerY: 0,
      nailY: 0,
      impactFrames: 0,
      targetNailY: 0,
      ready: false,
    };
    setImpact({ force: 0, active: false });
    setIsStriking(false);
  }, []);

  useEffect(() => {
    reset();
  }, [size.width, size.height, reset]);

  const calculateForce = useCallback(() => Math.round(mass * velocity * 22), [mass, velocity]);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    label: string,
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

    ctx.font = 'bold 14px "Pretendard", sans-serif';
    ctx.fillText(label, toX + 10, (fromY + toY) / 2);
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { width, height } = size;
      const scale = height / 600;
      const groundY = height * 0.72;
      const nailHeight = 70 * scale;
      const hammerHeadHeight = 40 * scale;
      const hammerHeadWidth = 70 * scale;
      const hammerHandleHeight = 110 * scale;
      const nailX = width * 0.5;

      if (!stateRef.current.ready) {
        stateRef.current.hammerY = groundY - 200 * scale;
        stateRef.current.nailY = groundY - nailHeight;
        stateRef.current.ready = true;
      }

      ctx.clearRect(0, 0, width, height);

      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#fef3c7');
      bgGradient.addColorStop(0.55, '#fef9c3');
      bgGradient.addColorStop(1, '#fde68a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, groundY, width, height - groundY);
      ctx.fillStyle = 'rgba(120, 53, 15, 0.35)';
      for (let i = 0; i < width; i += 45 * scale) {
        ctx.fillRect(i, groundY + 8 * scale, 20 * scale, 8 * scale);
      }

      const state = stateRef.current;
      const targetHammerY = state.nailY - hammerHeadHeight * 0.6;
      const step = velocity * 2.6 * scale;

      if (state.phase === 'down') {
        state.hammerY += step;
        if (state.hammerY >= targetHammerY) {
          state.hammerY = targetHammerY;
          state.phase = 'contact';
          state.impactFrames = 0;
          const forceVal = calculateForce();
          setImpact({ force: forceVal, active: true });
          const depth = Math.min(32 * scale, forceVal / 55);
          state.targetNailY = Math.min(groundY - 10 * scale, state.nailY + depth);
        }
      } else if (state.phase === 'contact') {
        state.impactFrames += 1;
        if (state.nailY < state.targetNailY) {
          state.nailY += 1.5 * scale;
          state.hammerY += 1.5 * scale;
        }
        if (state.impactFrames > 32) {
          state.phase = 'up';
          setImpact((prev) => ({ ...prev, active: false }));
        }
      } else if (state.phase === 'up') {
        state.hammerY -= 4 * scale;
        if (state.hammerY <= groundY - 200 * scale) {
          state.hammerY = groundY - 200 * scale;
          state.phase = 'idle';
          setIsStriking(false);
        }
      }

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(nailX - 5 * scale, state.nailY, 10 * scale, nailHeight);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(nailX - 14 * scale, state.nailY, 28 * scale, 8 * scale);

      ctx.fillStyle = '#475569';
      ctx.fillRect(nailX - hammerHeadWidth / 2, state.hammerY, hammerHeadWidth, hammerHeadHeight);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(
        nailX - 6 * scale,
        state.hammerY - hammerHandleHeight,
        12 * scale,
        hammerHandleHeight,
      );

      if (state.phase === 'contact') {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 4;
        ctx.arc(nailX, state.nailY + 5 * scale, 26 * scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (state.phase === 'contact') {
        const forceMag = calculateForce();
        const arrowLength = Math.min(150 * scale, forceMag / 9);
        const arrowX = nailX - 36 * scale;
        drawArrow(
          ctx,
          arrowX,
          state.nailY + 6 * scale,
          arrowX,
          state.nailY + arrowLength,
          '#ef4444',
          'F_H',
        );
        drawArrow(
          ctx,
          arrowX,
          state.nailY + 6 * scale,
          arrowX,
          state.nailY - arrowLength + 6 * scale,
          '#3b82f6',
          'F_N',
        );
      }
    },
    [calculateForce, size, velocity],
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

  const handleStrike = () => {
    if (isStriking) return;
    setIsStriking(true);
    setImpact({ force: 0, active: false });
    stateRef.current.phase = 'down';
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <Paper
        elevation={0}
        sx={{
          width: 320,
          height: '100%',
          borderRight: '1px solid rgba(15, 23, 42, 0.08)',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          overflow: 'auto',
          background:
            'linear-gradient(180deg, rgba(255, 247, 237, 0.95) 0%, rgba(255, 237, 213, 0.95) 100%)',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Example 1 — Contact Force
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(51, 65, 85, 0.9)' }}>
            Change mass and swing speed, then strike to observe the equal and opposite force pair at contact.
          </Typography>
        </Box>
        <ControlSlider label="Hammer Mass" value={mass} onChange={setMass} min={1} max={10} unit="kg" />
        <ControlSlider
          label="Swing Speed"
          value={velocity}
          onChange={setVelocity}
          min={1}
          max={10}
          unit="m/s"
        />
        <Divider />
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleStrike}
            disabled={isStriking}
            startIcon={<PlayArrowRounded />}
            sx={{ py: 1.2, fontWeight: 700 }}
          >
            Strike
          </Button>
          <IconButton
            onClick={reset}
            disabled={isStriking}
            sx={{
              border: '1px solid rgba(15, 23, 42, 0.2)',
              borderRadius: 2,
            }}
          >
            <AutorenewRounded />
          </IconButton>
        </Stack>
        <Box>
          <Typography variant="overline" sx={{ color: 'rgba(100, 116, 139, 0.8)' }}>
            Observation focus
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'rgba(51, 65, 85, 0.85)' }}>
            During contact, the red and blue arrows appear with the same length. That indicates the action and
            reaction forces are equal in magnitude but opposite in direction.
          </Typography>
        </Box>
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Chip label="Newton's 3rd Law: F_action = F_reaction" color="primary" sx={{ fontWeight: 700 }} />
        </Box>
      </Paper>

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          height: '100%',
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at top, rgba(255, 255, 255, 0.8), rgba(254, 243, 199, 0.4))',
        }}
      >
        <Stack direction="row" spacing={2} sx={{ position: 'absolute', top: 24, left: 24, zIndex: 2 }}>
          <ForceCard
            title="Force on nail"
            value={impact.active ? `${impact.force} N` : '--'}
            color="#ef4444"
            sub="F_H"
          />
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'rgba(51, 65, 85, 0.6)' }}>
            =
          </Typography>
          <ForceCard
            title="Force on hammer"
            value={impact.active ? `${impact.force} N` : '--'}
            color="#3b82f6"
            sub="F_N"
          />
        </Stack>

        <canvas ref={canvasRef} />

        {!isStriking && impact.force === 0 && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              bottom: 28,
              left: '50%',
              transform: 'translateX(-50%)',
              px: 3,
              py: 1.2,
              borderRadius: 999,
              bgcolor: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(51, 65, 85, 0.85)' }}>
              Press STRIKE to trigger the interaction
            </Typography>
          </Paper>
        )}

        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            right: 24,
            bottom: 24,
            px: 2.5,
            py: 2,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(15, 23, 42, 0.1)',
            boxShadow: '0 16px 30px rgba(15, 23, 42, 0.12)',
            maxWidth: 260,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Force pair checklist
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="caption">• Equal in magnitude</Typography>
            <Typography variant="caption">• Opposite in direction</Typography>
            <Typography variant="caption">• Not acting on the same object</Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

const GravitySimulation = () => {
  const [earthMass, setEarthMass] = useState(6);
  const [moonMass, setMoonMass] = useState(3);
  const [distance, setDistance] = useState(220);
  const [isPaused, setIsPaused] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const size = useElementSize(containerRef);
  const animationRef = useRef<number | null>(null);
  const starsRef = useRef<{ x: number; y: number; r: number; a: number }[]>([]);
  const phaseRef = useRef(0);

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
    return Math.max(1, Math.round(force));
  }, [distance, earthMass, moonMass]);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    label: string,
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

    ctx.font = 'bold 13px "Pretendard", sans-serif';
    ctx.fillText(label, toX + Math.cos(angle) * 18, toY + Math.sin(angle) * 18);
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { width, height } = size;
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      ctx.clearRect(0, 0, width, height);
      const spaceGradient = ctx.createRadialGradient(centerX, centerY - 120, 40, centerX, centerY, width * 0.7);
      spaceGradient.addColorStop(0, '#0f172a');
      spaceGradient.addColorStop(1, '#020617');
      ctx.fillStyle = spaceGradient;
      ctx.fillRect(0, 0, width, height);

      starsRef.current.forEach((star) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(248, 250, 252, ${star.a})`;
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!isPaused) {
        phaseRef.current += 0.02;
      }

      const earthRadius = 26 + earthMass * 2.6;
      const moonRadius = 12 + moonMass * 1.6;

      const moonX = centerX + distance + Math.sin(phaseRef.current) * 6;
      const moonY = centerY;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(moonX, moonY);
      ctx.stroke();

      const forceMag = calculateGravity();
      const arrowLength = Math.min(distance - earthRadius - moonRadius - 6, forceMag * 1.6);

      const angleToEarth = Math.atan2(centerY - moonY, centerX - moonX);
      drawArrow(
        ctx,
        moonX,
        moonY,
        moonX + Math.cos(angleToEarth) * arrowLength,
        moonY + Math.sin(angleToEarth) * arrowLength,
        '#f87171',
        'F_E',
      );

      const angleToMoon = Math.atan2(moonY - centerY, moonX - centerX);
      drawArrow(
        ctx,
        centerX,
        centerY,
        centerX + Math.cos(angleToMoon) * arrowLength,
        centerY + Math.sin(angleToMoon) * arrowLength,
        '#60a5fa',
        'F_M',
      );

      ctx.beginPath();
      ctx.fillStyle = '#3b82f6';
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
      ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.fillStyle = '#cbd5f5';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(248, 250, 252, 0.35)';
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
    [calculateGravity, distance, earthMass, isPaused, moonMass, size],
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
    phaseRef.current = 0;
  };

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
            Example 2 — Non-contact Force
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.8)' }}>
            Adjust both masses and the separation distance. The action and reaction arrows stay the same length.
          </Typography>
        </Box>
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
        <Card
          elevation={0}
          sx={{
            mt: 'auto',
            borderRadius: 3,
            bgcolor: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(96, 165, 250, 0.4)',
            color: '#e2e8f0',
          }}
        >
          <CardContent>
            <Typography variant="overline" sx={{ color: 'rgba(191, 219, 254, 0.8)' }}>
              Discovery note
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(226, 232, 240, 0.9)' }}>
              Even if one mass is much larger, the gravitational pull on each body is the same size. Only the
              acceleration changes.
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
              Formula: F ∝ (m₁ × m₂) / r²
            </Typography>
          </CardContent>
        </Card>
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
        <Stack direction="row" spacing={2} sx={{ position: 'absolute', top: 24, left: 24, zIndex: 2 }}>
          <ForceCard
            title="Force on moon"
            value={`${calculateGravity()} G`}
            color="#f87171"
            sub="F_E"
            variant="dark"
          />
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'rgba(226, 232, 240, 0.5)' }}>
            =
          </Typography>
          <ForceCard
            title="Force on earth"
            value={`${calculateGravity()} G`}
            color="#60a5fa"
            sub="F_M"
            variant="dark"
          />
        </Stack>

        <canvas ref={canvasRef} />

        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            px: 2.5,
            py: 2,
            borderRadius: 3,
            bgcolor: 'rgba(15, 23, 42, 0.72)',
            border: '1px solid rgba(148, 163, 184, 0.35)',
            color: '#e2e8f0',
            maxWidth: 260,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Force pair checklist
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="caption">• Equal in magnitude</Typography>
            <Typography variant="caption">• Opposite in direction</Typography>
            <Typography variant="caption">• Not acting on the same object</Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('contact');
  const [showInfo, setShowInfo] = useState(true);

  const tabIcon = useMemo(() => {
    if (tab === 'contact') return <GavelRounded />;
    return <PublicRounded />;
  }, [tab]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          html: { height: '100%', overflow: 'hidden' },
          body: { height: '100%', margin: 0, overflow: 'hidden' },
          '#root': { height: '100%', overflow: 'hidden' },
        }}
      />
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
          bgcolor: 'background.default',
          backgroundImage:
            'radial-gradient(circle at 10% 10%, rgba(250, 204, 21, 0.2), transparent 45%), radial-gradient(circle at 90% 20%, rgba(59, 130, 246, 0.15), transparent 45%)',
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 64, 175, 0.95))',
            color: '#f8fafc',
            px: 2,
            py: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <ScienceRounded />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">Newton’s Third Law Lab</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Explore action-reaction pairs in two textbook examples
              </Typography>
            </Box>
            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              textColor="inherit"
              TabIndicatorProps={{ style: { background: '#f97316', height: 3 } }}
              sx={{
                bgcolor: 'rgba(15, 23, 42, 0.4)',
                borderRadius: 999,
                px: 1,
                minHeight: 44,
              }}
            >
              <Tab
                value="contact"
                icon={<GavelRounded />}
                iconPosition="start"
                label="Example 1: Contact Force"
                sx={{ textTransform: 'none', fontWeight: 700, minHeight: 44 }}
              />
              <Tab
                value="gravity"
                icon={<PublicRounded />}
                iconPosition="start"
                label="Example 2: Non-contact Force"
                sx={{ textTransform: 'none', fontWeight: 700, minHeight: 44 }}
              />
            </Tabs>
            <IconButton onClick={() => setShowInfo((prev) => !prev)} sx={{ color: '#e2e8f0' }}>
              <InfoOutlined />
            </IconButton>
          </Stack>
        </AppBar>

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {tab === 'contact' ? <ContactForceSimulation /> : <GravitySimulation />}
        </Box>

        {showInfo && (
          <Paper
            elevation={0}
            sx={{
              position: 'fixed',
              right: 20,
              bottom: 20,
              width: 320,
              p: 2.5,
              borderRadius: 3,
              border: '1px solid rgba(15, 23, 42, 0.12)',
              bgcolor: 'rgba(255,255,255,0.92)',
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                {tabIcon}
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Key concept
                </Typography>
              </Stack>
              <IconButton size="small" onClick={() => setShowInfo(false)}>
                <CloseRounded fontSize="small" />
              </IconButton>
            </Stack>
            <Typography variant="body2" sx={{ mt: 1.5, color: 'rgba(51, 65, 85, 0.9)' }}>
              Whenever two objects interact, they exert forces on each other that are equal in magnitude and opposite
              in direction. Look for matching values in the force cards.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
              <Chip label="Always paired" size="small" />
              <Chip label="Equal magnitude" size="small" />
              <Chip label="Opposite direction" size="small" />
            </Stack>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default App;
