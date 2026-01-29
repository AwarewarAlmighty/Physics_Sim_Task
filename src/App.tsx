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
  Dialog,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  IconButton,
  Paper,
  Switch,
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

const ContactForceSimulation = ({ learningMode }: { learningMode: boolean }) => {
  const [mass, setMass] = useState(5);
  const [velocity, setVelocity] = useState(5);
  const [isStriking, setIsStriking] = useState(false);
  const [isHoldingContact, setIsHoldingContact] = useState(false);
  const [impact, setImpact] = useState({ force: 0, active: false });
  const [viewMode, setViewMode] = useState<'diagram' | 'explore'>('diagram');
  const [showExplanation, setShowExplanation] = useState(false);
  const [showTextbook, setShowTextbook] = useState(false);

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
    setIsHoldingContact(false);
  }, []);

  useEffect(() => {
    reset();
  }, [size.width, size.height, reset]);

  useEffect(() => {
    if (!isHoldingContact) return;
    const timer = window.setTimeout(() => {
      setIsHoldingContact(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [isHoldingContact]);

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
      const isDiagram = viewMode === 'diagram';

      if (!stateRef.current.ready) {
        stateRef.current.hammerY = groundY - 200 * scale;
        stateRef.current.nailY = groundY - nailHeight;
        stateRef.current.ready = true;
      }

      ctx.clearRect(0, 0, width, height);

      if (isDiagram) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, width - 36, height - 36);
      } else {
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
      }

      const state = stateRef.current;
      const targetHammerY = state.nailY - hammerHeadHeight * 0.6;
      const step = velocity * 2.6 * scale;

      if (isDiagram) {
        state.hammerY = groundY - 170 * scale;
        state.nailY = groundY - nailHeight;
        state.phase = 'contact';
        if (!impact.active) {
          const forceVal = calculateForce();
          setImpact({ force: forceVal, active: true });
        }
      } else {
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
            setIsHoldingContact(true);
          }
        } else if (state.phase === 'contact') {
          if (!isHoldingContact) {
            state.impactFrames += 1;
            if (state.nailY < state.targetNailY) {
              state.nailY += 1.5 * scale;
              state.hammerY += 1.5 * scale;
            }
            if (state.impactFrames > 32) {
              state.phase = 'up';
              setImpact((prev) => ({ ...prev, active: false }));
            }
          }
        } else if (state.phase === 'up') {
          state.hammerY -= 4 * scale;
          if (state.hammerY <= groundY - 200 * scale) {
            state.hammerY = groundY - 200 * scale;
            state.phase = 'idle';
            setIsStriking(false);
          }
        }
      }

      if (isDiagram) {
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(nailX - 5 * scale, state.nailY, 10 * scale, nailHeight);
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(nailX - 14 * scale, state.nailY, 28 * scale, 8 * scale);
      } else {
        const nailGradient = ctx.createLinearGradient(nailX, state.nailY, nailX + 10 * scale, state.nailY);
        nailGradient.addColorStop(0, '#cbd5e1');
        nailGradient.addColorStop(0.5, '#94a3b8');
        nailGradient.addColorStop(1, '#64748b');
        ctx.fillStyle = nailGradient;
        ctx.fillRect(nailX - 5 * scale, state.nailY, 10 * scale, nailHeight);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(nailX - 14 * scale, state.nailY, 28 * scale, 8 * scale);
      }

      const hammerY = isDiagram ? groundY - 170 * scale : state.hammerY;
      if (isDiagram) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(nailX - hammerHeadWidth / 2, hammerY, hammerHeadWidth, hammerHeadHeight);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(
          nailX - 6 * scale,
          hammerY - hammerHandleHeight,
          12 * scale,
          hammerHandleHeight,
        );
      } else {
        const headGradient = ctx.createLinearGradient(
          nailX - hammerHeadWidth / 2,
          hammerY,
          nailX + hammerHeadWidth / 2,
          hammerY,
        );
        headGradient.addColorStop(0, '#1f2937');
        headGradient.addColorStop(0.55, '#475569');
        headGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = headGradient;
        ctx.fillRect(nailX - hammerHeadWidth / 2, hammerY, hammerHeadWidth, hammerHeadHeight);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(nailX - hammerHeadWidth / 2, hammerY + hammerHeadHeight - 4 * scale, hammerHeadWidth, 4 * scale);

        const handleGradient = ctx.createLinearGradient(
          nailX - 6 * scale,
          hammerY - hammerHandleHeight,
          nailX + 6 * scale,
          hammerY,
        );
        handleGradient.addColorStop(0, '#92400e');
        handleGradient.addColorStop(0.5, '#d97706');
        handleGradient.addColorStop(1, '#7c2d12');
        ctx.fillStyle = handleGradient;
        ctx.fillRect(
          nailX - 6 * scale,
          hammerY - hammerHandleHeight,
          12 * scale,
          hammerHandleHeight,
        );
      }

      if (state.phase === 'contact' && !isDiagram) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 4;
        ctx.arc(nailX, state.nailY + 5 * scale, 26 * scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (state.phase === 'contact') {
        const forceMag = calculateForce();
        const arrowLength = Math.min(140 * scale, forceMag / 9);
        const arrowX = nailX - 45 * scale;
        const arrowColor = isDiagram ? 'rgba(15, 23, 42, 0.85)' : '#ef4444';
        const arrowColor2 = isDiagram ? 'rgba(15, 23, 42, 0.85)' : '#3b82f6';
        drawArrow(
          ctx,
          arrowX,
          state.nailY + 10 * scale,
          arrowX,
          state.nailY + arrowLength,
          arrowColor,
          isDiagram ? '' : 'F_H',
        );
        drawArrow(
          ctx,
          arrowX,
          state.nailY + 10 * scale,
          arrowX,
          state.nailY - arrowLength + 10 * scale,
          arrowColor2,
          isDiagram ? '' : 'F_N',
        );
        if (isDiagram) {
          ctx.font = 'bold 14px "Pretendard", sans-serif';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillText('F_N', arrowX - 28 * scale, state.nailY - arrowLength + 4 * scale);
          ctx.fillText('F_H', arrowX - 28 * scale, state.nailY + arrowLength + 14 * scale);
        }
      }
    },
    [calculateForce, size, velocity, viewMode, impact.active, isHoldingContact],
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
    setIsHoldingContact(false);
    setImpact({ force: 0, active: false });
    stateRef.current.phase = 'down';
  };
  const continueAfterContact = () => {
    setIsHoldingContact(false);
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
            Example 1 — Contact force between a hammer and a nail
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(51, 65, 85, 0.9)' }}>
            Two objects interact when they come into contact with each other. During this interaction:
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="body2">• the hammer exerts a force F_H on the nail</Typography>
            <Typography variant="body2">• the nail exerts a force F_N on the hammer</Typography>
          </Stack>
        </Box>
        {learningMode && (
          <Box sx={{ position: 'sticky', top: 0, zIndex: 2, pb: 2, bgcolor: 'rgba(255, 247, 237, 0.92)' }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                bgcolor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
              }}
            >
              <CardContent>
                <Typography variant="overline" sx={{ color: 'rgba(30, 64, 175, 0.9)' }}>
                  Guided mode
                </Typography>
                <Stack spacing={0.6} sx={{ mt: 1 }}>
                  <Typography variant="body2">1) Set mass and speed.</Typography>
                  <Typography variant="body2">2) Press Strike to reach contact.</Typography>
                  <Typography variant="body2">3) Compare F_H and F_N arrows.</Typography>
                </Stack>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1.5, fontWeight: 700 }}
                  onClick={() => setShowExplanation((prev) => !prev)}
                >
                  {showExplanation ? 'Hide explanation' : 'Show explanation'}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1, fontWeight: 700 }}
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
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(15, 23, 42, 0.12)',
              px: 2.5,
              py: 2,
            }}
          >
            <Typography variant="overline" sx={{ color: 'rgba(100, 116, 139, 0.8)' }}>
              Explanation
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(51, 65, 85, 0.9)', lineHeight: 1.7 }}>
              The hammer pushes on the nail with F_H. At the same instant, the nail pushes back on the hammer with F_N.
              These two forces are equal in magnitude, opposite in direction, and act on different objects.
            </Typography>
          </Box>
        )}
        <Box>
          <Typography variant="overline" sx={{ color: 'rgba(100, 116, 139, 0.8)' }}>
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
            {isHoldingContact && (
              <Button variant="outlined" onClick={continueAfterContact} sx={{ mt: 1, fontWeight: 700 }}>
                Continue
              </Button>
            )}
          </>
        )}
        <Box
          sx={{
            width: '100%',
            borderRadius: 3,
            bgcolor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            px: 2.5,
            py: 2,
          }}
        >
          <Typography variant="overline" sx={{ color: 'rgba(30, 64, 175, 0.9)' }}>
            Key statement
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'rgba(51, 65, 85, 0.9)' }}>
            The forces F_H and F_N are equal in magnitude, act in opposite directions, and are not acting on the same
            object.
          </Typography>
        </Box>
        {viewMode === 'explore' && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              bgcolor: 'rgba(15, 23, 42, 0.06)',
              border: '1px solid rgba(15, 23, 42, 0.1)',
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: 'rgba(100, 116, 139, 0.8)' }}>
                What to observe
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(51, 65, 85, 0.85)' }}>
                During contact, the two force arrows always match in length. That is the action–reaction pair.
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.75 }}>
                Scale note: forces are shown in relative units (not real‑world Newtons).
              </Typography>
            </CardContent>
          </Card>
        )}
        {viewMode === 'explore' && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              bgcolor: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: 'rgba(161, 98, 7, 0.9)' }}>
                Learning goal
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(120, 53, 15, 0.9)' }}>
                Identify the action–reaction pair and explain why their magnitudes are equal during contact.
              </Typography>
            </CardContent>
          </Card>
        )}
        {viewMode === 'explore' && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              bgcolor: 'rgba(15, 23, 42, 0.04)',
              border: '1px solid rgba(15, 23, 42, 0.08)',
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: 'rgba(100, 116, 139, 0.8)' }}>
                Check question
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(51, 65, 85, 0.85)' }}>
                If the hammer is heavier, does it exert a larger force on the nail during contact?
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.75 }}>
                Answer: No. The forces on each object are equal in magnitude; only the motion changes.
              </Typography>
            </CardContent>
          </Card>
        )}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Chip label="Newton's 3rd Law: F_action = F_reaction" color="primary" sx={{ fontWeight: 700 }} />
        </Box>
      </Paper>
      <Dialog open={showTextbook} onClose={() => setShowTextbook(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Textbook explanation — Example 1</DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src="/textbook_example1.png"
            alt="Textbook Example 1: Contact force between a hammer and a nail"
            sx={{ width: '100%', borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.12)' }}
          />
        </DialogContent>
      </Dialog>

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
        {viewMode === 'explore' && isHoldingContact && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              top: 120,
              left: 24,
              px: 2.5,
              py: 2,
              borderRadius: 3,
              bgcolor: 'rgba(255, 255, 255, 0.92)',
              border: '1px solid rgba(15, 23, 42, 0.12)',
              boxShadow: '0 12px 26px rgba(15, 23, 42, 0.12)',
              maxWidth: 260,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Contact moment
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(51, 65, 85, 0.9)' }}>
              This is the instant of interaction. The forces on the hammer and nail are equal in size and opposite in
              direction.
            </Typography>
          </Paper>
        )}
        {viewMode === 'explore' && (
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
        )}

        {viewMode === 'explore' && impact.active && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              top: 24,
              right: 24,
              px: 2,
              py: 1,
              borderRadius: 999,
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

        {viewMode === 'explore' && !isStriking && impact.force === 0 && (
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

        {viewMode === 'explore' && (
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
        )}
      </Box>
    </Box>
  );
};

const GravitySimulation = ({ learningMode }: { learningMode: boolean }) => {
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
              borderRadius: 3,
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
              borderRadius: 3,
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
              borderRadius: 999,
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
              borderRadius: 3,
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
    </Box>
  );
};

const App: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('contact');
  const [showInfo, setShowInfo] = useState(true);
  const [learningMode, setLearningMode] = useState(false);

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
            <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Learning mode
              </Typography>
              <Switch checked={learningMode} onChange={(_, checked) => setLearningMode(checked)} color="secondary" />
            </Stack>
            <IconButton onClick={() => setShowInfo((prev) => !prev)} sx={{ color: '#e2e8f0' }}>
              <InfoOutlined />
            </IconButton>
          </Stack>
        </AppBar>

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {tab === 'contact' ? (
            <ContactForceSimulation learningMode={learningMode} />
          ) : (
            <GravitySimulation learningMode={learningMode} />
          )}
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
