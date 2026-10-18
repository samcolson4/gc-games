import './App.css'
import Box from '@mui/material/Box';
import HeaderBar from './components/header_bar'
import Scorecard from './components/Scorecard';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Scorebook from './components/scorebook';
import { colors } from './styles/tokens';
import { GAME_TYPES } from './games/gameTypes';

function AppContent() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: colors.paper,
      }}
    >
      <HeaderBar />
      <Box sx={{ width: '100%' }}>
        <Routes>
          <Route path="/" element={<Navigate to={`/${GAME_TYPES[0].slug}`} replace />} />
          {GAME_TYPES.map((game) => (
            <Route
              key={game.id}
              path={`/${game.slug}`}
              element={<Scorecard key={game.id} game={game} />}
            />
          ))}
          <Route path="/scorebook" element={<Scorebook />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App;
