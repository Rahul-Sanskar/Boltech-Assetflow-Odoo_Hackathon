import { createContext, useState, useContext } from 'react';
import API from '../api/API.js'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser && savedUser !== 'undefined') {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    return null;
  });

  const login = async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    const { user: userData, token } = response.data.data;
    const normalizedUser = { ...userData, role: userData.role.toLowerCase() };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const register = async (name, email, password, departmentId) => {
    const response = await API.post('/auth/signup', { name, email, password, departmentId });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);