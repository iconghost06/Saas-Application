import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Auth from './components/Auth.jsx';
import ClientDashboard from './components/ClientDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

export default function App() {
  // Restore user session from localStorage if available
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('saas_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    try {
      localStorage.setItem('saas_user', JSON.stringify(loggedInUser));
    } catch (e) {
      console.error('Failed to save user session:', e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('saas_user');
    } catch (e) {
      console.error('Failed to clear user session:', e);
    }
  };

  return (
    <div className="app-container">
      <Header user={user} onLogout={handleLogout} />
      <main className="main-content">
        {!user ? (
          <Auth onLoginSuccess={handleLoginSuccess} />
        ) : user.role === 'admin' ? (
          <AdminDashboard user={user} />
        ) : (
          <ClientDashboard user={user} />
        )}
      </main>
    </div>
  );
}
