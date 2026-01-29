import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Chip,
  CssBaseline,
  GlobalStyles,
  IconButton,
  Stack,
  Switch,
  Tab,
  Tabs,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import { CloseRounded, GavelRounded, InfoOutlined, PublicRounded, ScienceRounded } from '@mui/icons-material';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ContactForceSimulation } from './components/ContactForceSimulation';
import { GravitySimulation } from './components/GravitySimulation';

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

const App: React.FC = () => {
  const [showInfo, setShowInfo] = useState(true);
  const [learningMode, setLearningMode] = useState(false);
  const location = useLocation();
  const tab: TabKey = location.pathname.startsWith('/example2') ? 'gravity' : 'contact';

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
                component={Link}
                to="/example1"
                icon={<GavelRounded />}
                iconPosition="start"
                label="Example 1: Contact Force"
                sx={{ textTransform: 'none', fontWeight: 700, minHeight: 44 }}
              />
              <Tab
                value="gravity"
                component={Link}
                to="/example2"
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
          <Routes>
            <Route path="/" element={<Navigate to="/example1" replace />} />
            <Route path="/example1" element={<ContactForceSimulation learningMode={learningMode} />} />
            <Route path="/example2" element={<GravitySimulation learningMode={learningMode} />} />
          </Routes>
        </Box>

        {showInfo && (
          <Box
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
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default App;
