import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { FiHome, FiSearch, FiBell, FiUser, FiMail, FiCompass, FiPlus, FiSettings } from 'react-icons/fi';
import axios from 'axios';
import Header from './header';
import logoImage from '../assets/myimage.jpeg';

const Layout = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [isDesktop, setIsDesktop] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const state = location.state || {};

    if (path === '/' || path === '/home') {
      setActiveTab('Home');
    } else if (path.startsWith('/profile/')) {
      // Handle profile navigation from different sources
      if (state.fromPost || state.fromExplore) {
        setActiveTab('');
      } else {
        setActiveTab('Profile');
      }
    } else if (path === '/explore') {
      setActiveTab('Explore');
    } else if (path === '/notifications') {
      setActiveTab('Notifications');
    } else if (path === '/create-post') {
      setActiveTab('new post');
    }
  }, [location]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('edunotoken');
        if (!token) {
          navigate('/login');
        }
        const response = await axios.post(`${import.meta.env.VITE_API}/api/getuserid`, {
          token
        });
        if (response.data && response.data.message) {
          setUserId(response.data.message);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    const handleResize = () => {
      setIsDesktop(window.innerWidth > 720);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    fetchUserData();

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [navigate]);

  const handleTabChange = (tabName, action) => {
    if (action) {
      setActiveTab('new post');
      navigate('/create-post');
    } else if (tabName === 'Profile' && userId) {
      setActiveTab('Profile');
      navigate(`/profile/${userId}`, { state: { fromPost: false, fromExplore: false } });
    } else {
      setActiveTab(tabName);
      navigate(tabName === 'Home' ? '/' : `/${tabName.toLowerCase()}`);
    }
  };

  const desktopNavItems = [
    { name: 'new post', icon: <FiPlus className="text-lg" />, action: () => navigate('/create-post') },
    { name: 'Home', icon: <FiHome className="text-lg" /> },
    { name: 'Explore', icon: <FiCompass className="text-lg" /> },
    { name: 'Notifications', icon: <FiBell className="text-lg" /> },
    { name: 'Profile', icon: <FiUser className="text-lg" /> },
  ];

  const mobileBottomNavItems = [
    { name: 'Home', icon: <FiHome className="text-xl" /> },
    { name: 'Explore', icon: <FiCompass className="text-xl" /> },
    { name: 'new post', icon: <FiPlus className="text-xl" />, action: () => navigate('/create-post') },
    { name: 'Profile', icon: <FiUser className="text-xl" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 min-w-[50px]">
      {showSplash && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ${!showSplash ? 'opacity-0' : 'opacity-100'}`}>
          <div className="animate-pulse">
            <img
              src={logoImage}
              alt="App Logo"
              className="w-48 h-48 object-contain"
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && <div className="w-48 h-48 flex items-center justify-center">Loading...</div>}
          </div>
        </div>
      )}

      <Header isDesktop={isDesktop} />

      <div className="flex flex-1 overflow-hidden">
        {isDesktop && !showSplash && (
          <nav className="w-56 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto min-w-[50px]">
            <ul>
              {desktopNavItems.map((item) => (
                <li
                  key={item.name}
                  className={`flex items-center p-3 cursor-pointer text-sm ${
                    activeTab === item.name ? 'bg-white font-medium text-blue-500' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => handleTabChange(item.name, item.action)}
                >
                  {item.icon}
                  <span className="ml-2 capitalize">{item.name}</span>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <main className="flex-1 overflow-y-auto min-w-[50px] bg-white pb-16 md:pb-0">
          {!showSplash && <Outlet />}
        </main>
      </div>

      {!isDesktop && !showSplash && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 min-w-[50px] shadow-lg">
          <div className="flex justify-around">
            {mobileBottomNavItems.map((item) => (
              <button
                key={item.name}
                className={`py-3 px-2 sm:px-4 flex flex-col items-center text-xs ${
                  activeTab === item.name ? 'text-blue-500' : 'text-gray-500'
                }`}
                onClick={() => handleTabChange(item.name, item.action)}
              >
                {item.icon}
                <span className="mt-1 text-xs">{item.name}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;