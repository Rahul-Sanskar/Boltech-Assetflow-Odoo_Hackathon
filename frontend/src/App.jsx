import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/global/Login';

const App = () => {
  return (
    <Routes>
       <Route path="/" element={<Login/>} />
    </Routes>
  )
}

export default App