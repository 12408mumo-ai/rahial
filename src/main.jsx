import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('[CREE WRLD] Root element #root was not found.')
}

createRoot(rootElement).render(<App />)
