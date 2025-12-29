import './App.css'
import Box from '@mui/material/Box';
import HeaderBar from './components/header_bar'
import Rummy from './components/rummy';
import RummyMobile from './components/rummy_mobile';
import Golf from './components/golf';
import MexicanTrain from './components/mexican_train';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NewZealandVideo from './components/nz';
import Suburb from './components/suburb';
import { useState, useEffect } from 'react';

// Responsive Rummy component that switches based on window width
function ResponsiveRummy() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <RummyMobile /> : <Rummy />;
}

function AppContent() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isRummyPage = location.pathname === '/';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide header bar on mobile for rummy page
  const showHeader = !(isMobile && isRummyPage);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      {showHeader && <HeaderBar />}
      <Box sx={{ mt: 1 }}>
        {showHeader && (
          <>
            <hr style={{ width: '90%', margin: '0.1rem auto' }} />
            <hr style={{ width: '90%', margin: '0.1rem auto' }} />
          </>
        )}
        <Routes>
          <Route path="/" element={<ResponsiveRummy />} />
          <Route path="/rummy-mobile" element={<RummyMobile />} />
          <Route path="/golf" element={<Golf />} />
          <Route path="/mexican-train" element={<MexicanTrain />} />
          <Route path="/nz" element={<NewZealandVideo />} />
          <Route path="/suburb" element={<Suburb />} />
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
