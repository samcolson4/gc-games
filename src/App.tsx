import './App.css'
import Box from '@mui/material/Box';
import HeaderBar from './components/header_bar'
import { useState } from 'react';
import Rummy from './components/rummy';
import Golf from './components/golf';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NewZealandVideo from './components/nz';

function App() {
  const [page, setPage] = useState('rummy');

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
        <HeaderBar setPage={setPage} />
        <Box sx={{ mt: 1 }}>
          <hr style={{ width: '90%', margin: '0.1rem auto' }} />
          <hr style={{ width: '90%', margin: '0.1rem auto' }} />
          <Routes>
            <Route path="/" element={page === 'rummy' ? <Rummy /> : <Golf />} />
            <Route path="/nz" element={<NewZealandVideo />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  )
}

export default App;
