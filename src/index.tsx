import React from 'react'
import ReactDOM from 'react-dom'

import ThemeSelector from './ThemeSelector'
import App from './App'

ReactDOM.render(
  <React.StrictMode>
    <ThemeSelector>
      <App />
    </ThemeSelector>
  </React.StrictMode>,
  document.getElementById('root')
)
