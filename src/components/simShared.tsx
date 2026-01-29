import React, { useLayoutEffect, useState } from 'react';
import { Box, Card, CardContent, Chip, Slider, Stack, Typography } from '@mui/material';

export const useElementSize = <T extends HTMLElement>(ref: React.RefObject<T>) => {
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

export const ForceCard = ({
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

export const ControlSlider = ({
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
