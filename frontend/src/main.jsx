import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css';

createRoot(document.getElementById('root')).render(
  <MantineProvider withGlobalStyles withNormalizeCSS>
    <StrictMode>
      <App />
    </StrictMode>
  </MantineProvider>,
)
