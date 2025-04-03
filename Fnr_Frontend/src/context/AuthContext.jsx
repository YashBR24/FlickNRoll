import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../utils/api';

const AuthContext = createContext(null);

export const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');

      if (token && userData && typeof userData === 'string' && userData.trim() !== '') {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser && parsedUser._id && parsedUser.role) {
            setUser(parsedUser);
            setIsAuthenticated(true);
            
            // Redirect based on role if at root path
            if (window.location.pathname === '/') {
              switch (parsedUser.role.toLowerCase()) {
                case 'admin':
                case 'manager':
                case 'member':
                  navigate('/dashboard');
                  break;
                default:
                  navigate('/login');
              }
            }
          } else {
            console.warn('Invalid user data in localStorage, clearing it.');
            logout();
          }
        } catch (error) {
          console.error('Failed to parse user data from localStorage:', error);
          logout();
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [navigate]);

  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      const { data } = response;
      
      // Capitalize the role to match backend convention
      const role = data.role.charAt(0).toUpperCase() + data.role.slice(1);
      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: role,
      };
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);

      // Redirect based on role
      switch (role.toLowerCase()) {
        case 'admin':
        case 'manager':
        case 'member':
          navigate('/dashboard');
          break;
        default:
          navigate('/login');
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};