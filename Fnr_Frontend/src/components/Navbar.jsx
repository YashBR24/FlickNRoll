import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Home, Calendar, Package, Users, BarChart3, LogOut, X, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (user?.role === 'Admin') {
      return [
        { icon: <Home className="transition-transform group-hover:scale-110" size={20} />, text: 'Dashboard', path: '/dashboard' },
        { icon: <Calendar className="transition-transform group-hover:scale-110" size={20} />, text: 'Bookings', path: '/bookings' },
        { icon: <Package className="transition-transform group-hover:scale-110" size={20} />, text: 'Inventory', path: '/inventory' },
        { icon: <Users className="transition-transform group-hover:scale-110" size={20} />, text: 'Members', path: '/members' },
        { icon: <BarChart3 className="transition-transform group-hover:scale-110" size={20} />, text: 'Memberships', path: '/memberships' },
        { icon: <BarChart3 className="transition-transform group-hover:scale-110" size={20} />, text: 'Reports', path: '/reports' },
        { icon: <Users className="transition-transform group-hover:scale-110" size={20} />, text: 'Users', path: '/users' },
        { icon: <FileText  className="transition-transform group-hover:scale-110" size={20} />, text: 'Log', path: '/logs' },
        
      ];
    } else if (user?.role === 'Manager') {
      return [
        { icon: <Home className="transition-transform group-hover:scale-110" size={20} />, text: 'Dashboard', path: '/dashboard' },
        { icon: <Calendar className="transition-transform group-hover:scale-110" size={20} />, text: 'Bookings', path: '/bookings' },
        { icon: <Package className="transition-transform group-hover:scale-110" size={20} />, text: 'Inventory', path: '/inventory' },
        { icon: <Users className="transition-transform group-hover:scale-110" size={20} />, text: 'Members', path: '/members' },
        { icon: <BarChart3 className="transition-transform group-hover:scale-110" size={20} />, text: 'Memberships', path: '/memberships' },
        { icon: <BarChart3 className="transition-transform group-hover:scale-110" size={20} />, text: 'Reports', path: '/reports' },

      ];
    } else {
      return [{ icon: <Calendar className="transition-transform group-hover:scale-110" size={20} />, text: 'Dashboard', path: '/dashboard' },
        { icon: <Calendar className="transition-transform group-hover:scale-110" size={20} />, text: 'Book Court', path: '/user-booking' },
          // { icon: <Calendar className="transition-transform group-hover:scale-110" size={20} />, text: 'My Bookings', path: '/bookings' },
      ];
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#2b2333]/95 backdrop-blur-sm shadow-lg' : 'bg-[#2b2333]'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand and Mobile Menu Toggle */}
          <div className="flex items-center">
            <button
              className="md:hidden text-[#fab305] hover:text-[#9333ab] transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-[#fab305] to-[#9333ab] bg-clip-text text-transparent">
              FLICK 'N ROLL
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-1">
              {getNavItems().map((item, index) => (
                <NavItem
                  key={index}
                  icon={item.icon}
                  text={item.text}
                  path={item.path}
                  active={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                />
              ))}
              <button
                onClick={handleLogout}
                className="group flex items-center px-4 py-2 rounded-lg text-sm font-medium text-[#949494] hover:text-[#fab305] hover:bg-[#9333ab]/10 transition-all duration-200"
              >
                <LogOut className="transition-transform group-hover:scale-110" size={20} />
                <span className="ml-2">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${
        isMobileMenuOpen ? 'max-h-screen' : 'max-h-0'
      }`}>
        <div className="bg-[#2b2333]/95 backdrop-blur-sm border-t border-[#9333ab]/20">
          {getNavItems().map((item, index) => (
            <NavItem
              key={index}
              icon={item.icon}
              text={item.text}
              path={item.path}
              active={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
            />
          ))}
          <button
            onClick={() => {
              handleLogout();
              setMobileMenuOpen(false);
            }}
            className="group flex items-center w-full px-4 py-2 text-left text-sm font-medium text-[#949494] hover:text-[#fab305] hover:bg-[#9333ab]/10 transition-all duration-200"
          >
            <LogOut className="transition-transform group-hover:scale-110" size={20} />
            <span className="ml-2">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`group flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
      ${active 
        ? 'text-[#fab305] bg-[#9333ab]/20' 
        : 'text-[#949494] hover:text-[#fab305] hover:bg-[#9333ab]/10'
      }`}
  >
    {icon}
    <span className="ml-2 relative">
      {text}
      <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-[#fab305] transition-all duration-300 ${
        active ? 'w-full' : 'group-hover:w-full'
      }`}></span>
    </span>
  </button>
);

export default Navbar;