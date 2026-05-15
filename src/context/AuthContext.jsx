import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [userData, setUserData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userData') || '{}'); }
    catch { return {}; }
  });

  const login = (user) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userData', JSON.stringify(user));
    setIsLoggedIn(true);
    setUserData(user);
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    localStorage.removeItem('rememberedEmail');
    setIsLoggedIn(false);
    setUserData({});
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('userData', JSON.stringify(updatedUser));
    setUserData(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userData, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
