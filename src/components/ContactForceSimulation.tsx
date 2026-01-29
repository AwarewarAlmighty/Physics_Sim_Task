import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { AutorenewRounded, PlayArrowRounded } from '@mui/icons-material';
import { ControlSlider, ForceCard, useElementSize } from './simShared';

export const ContactForceSimulation = ({ learningMode }: { learningMode: boolean }) => {
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

    if (label) {
      ctx.font = 'bold 14px "Pretendard", sans-serif';
      ctx.fillText(label, toX + 10, (fromY + toY) / 2);
    }
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
        ctx.fillRect(nailX - 6 * scale, hammerY - hammerHandleHeight, 12 * scale, hammerHandleHeight);
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
        ctx.fillRect(nailX - 6 * scale, hammerY - hammerHandleHeight, 12 * scale, hammerHandleHeight);
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
              borderRadius: 3,
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
              borderRadius: 3,
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
              borderRadius: 3,
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
              borderRadius: 3,
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
              borderRadius: 2,
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
              borderRadius: 2,
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
    </Box>
  );
};
