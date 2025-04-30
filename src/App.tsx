import './App.css'
import Box from '@mui/material/Box';
import HeaderBar from './components/header_bar'
import { useState } from 'react';
import Rummy from './components/rummy';
import Golf from './components/golf';

function App() {
  const [page, setPage] = useState('rummy');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <HeaderBar setPage={setPage} />
      <Box sx={{ mt: 0.25 }}>
        <hr style={{ width: '90%', margin: '0.1rem auto' }} />
        <hr style={{ width: '90%', margin: '0.1rem auto' }} />
        {page === 'rummy' && <Rummy />}
        {page === 'golf' && <Golf />}
      </Box>
    </Box>
  )
}

export default App
