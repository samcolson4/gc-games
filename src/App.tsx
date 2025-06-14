import './App.css'
import Box from '@mui/material/Box';
import HeaderBar from './components/header_bar'
import Rummy from './components/rummy';
import Golf from './components/golf';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NewZealandVideo from './components/nz';
import Suburb from './components/suburb';

function App() {
  return (
    <Router>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100%',
        }}
      >
        <HeaderBar />
        <Box sx={{ mt: 1 }}>
          <hr style={{ width: '90%', margin: '0.1rem auto' }} />
          <hr style={{ width: '90%', margin: '0.1rem auto' }} />
          <Routes>
            <Route path="/" element={<Rummy />} />
            <Route path="/golf" element={<Golf />} />
            <Route path="/nz" element={<NewZealandVideo />} />
            <Route path="/suburb" element={<Suburb />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  )
}

export default App;
