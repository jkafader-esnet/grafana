import { useState } from 'react'
import Chart from "./Chart.jsx"
import { Todo } from "./Todo.jsx"
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  if(!window.Grafana){
    return
  }

  return (
    <>
      <h1 className='app-heading'>Demonstration App</h1>
      <table>
        <tbody>
          <tr>
            <td>
              <h4>Here's a demo To-Do app:</h4>
            </td>
            <td>
              <h4>And Here's a Grafana Panel:</h4>
            </td>
          </tr>
          <tr>
            <td style={{"width":'50%', "minWidth": "300px", "height": "350px"}}>
              <Todo />
            </td>
            <td style={{"width":'50%', 'paddingLeft': "20px"}}>
              <Chart dashboardUid="bdikkaacvm7swe" panelId={1} height={350} width={450} />
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export default App
