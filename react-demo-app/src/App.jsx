import { useState } from 'react'
import Chart from "./Chart.jsx"
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Hello World</h1>
      <Chart dashboardUid="ediakwqx4axhca" panelId={1} height="300" width="600" />
    </>
  )
}

export default App
