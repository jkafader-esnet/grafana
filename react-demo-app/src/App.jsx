import { useState } from 'react'
import Chart from "./Chart.jsx"
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Hello World</h1>
      <h4>Here's a Grafana Panel:</h4>
      <Chart dashboardUid="bdikkaacvm7swe" panelId={1} height={300} width={650} />
    </>
  )
}

export default App
