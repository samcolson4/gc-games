import './App.css'
import Box from '@mui/material/Box';
import HeaderBar from './components/header_bar'
import { useState } from 'react';

function App() {
  const [page, setPage] = useState('home');

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

        {page === 'rummy' && <div style={{ textAlign: 'center' }}>Rummy</div>}
        {page === 'golf' && <div style={{ textAlign: 'center' }}>Golf</div>}
      </Box>
    </Box>
  )
}

export default App
