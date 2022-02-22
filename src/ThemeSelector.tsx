import React from 'react'

import './index.css'

const Darkly = React.lazy(() => import('./css/Darkly'))
const Lux = React.lazy(() => import('./css/Lux'))
const Journal = React.lazy(() => import('./css/Journal'))
const Litera = React.lazy(() => import('./css/Litera'))
const Minty = React.lazy(() => import('./css/Minty'))
const Pulse = React.lazy(() => import('./css/Pulse'))
const Sandstone = React.lazy(() => import('./css/Sandstone'))
const Sketchy = React.lazy(() => import('./css/Sketchy'))
const Solar = React.lazy(() => import('./css/Solar'))
const Superhero = React.lazy(() => import('./css/Superhero'))
const United = React.lazy(() => import('./css/United'))
const Quartz = React.lazy(() => import('./css/Quartz'))
const Vapor = React.lazy(() => import('./css/Vapor'))

const theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'darkly'

const ThemeSelector: React.FC = ({ children }) => (
  <>
    <React.Suspense fallback={<div className='initSpinner' />}>
      {theme === 'darkly' && <Darkly />}
      {theme === 'lux' && <Lux />}
      {theme === 'journal' && <Journal />}
      {theme === 'litera' && <Litera />}
      {theme === 'minty' && <Minty />}
      {theme === 'pulse' && <Pulse />}
      {theme === 'sandstone' && <Sandstone />}
      {theme === 'sketchy' && <Sketchy />}
      {theme === 'solar' && <Solar />}
      {theme === 'superhero' && <Superhero />}
      {theme === 'united' && <United />}
      {theme === 'quartz' && <Quartz />}
      {theme === 'vapor' && <Vapor />}
    </React.Suspense>
    { children }
  </>
)

export default ThemeSelector
