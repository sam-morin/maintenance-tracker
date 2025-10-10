import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css';
import { BrowserRouter } from "react-router-dom";

const theme = {
  colorScheme: 'light',
  fontFamily: 'Poppins, sans-serif',
};

createRoot(document.getElementById('root')).render(
  <MantineProvider withGlobalStyles withNormalizeCSS theme={theme}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MantineProvider>,
)
