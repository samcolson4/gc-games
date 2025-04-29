import './App.css'
import Box from '@mui/material/Box';
import HeaderBar from './components/header_bar'

function App() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderBar />
    </Box>
  )
}

export default App
