import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';

function App() {

  return (
   <div className='text-custom-text'>
    <Router>
    <Routes>
      <Route path='/' element={<LandingPage/>}/>
    </Routes>
   </Router>
   </div>
  )
}

export default App
