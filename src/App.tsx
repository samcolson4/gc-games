import './App.css'
import Box from '@mui/material/Box';
import HeaderBar from './components/header_bar'

function App() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <HeaderBar />
      <Box sx={{ mt: 0.25 }}>
        <hr style={{ width: '90%', margin: '0.25rem auto' }} />
        <hr style={{ width: '90%', margin: '0.25rem auto' }} />
      </Box>
    </Box>
  )
}

export default App
