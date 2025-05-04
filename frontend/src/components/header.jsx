import React from 'react';
import { FiBell, FiMail } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ isDesktop }) => {
  const location = useLocation();
  
  const mobileTopNavItems = [
    { 
      name: 'Notifications', 
      icon: <FiBell className="text-xl" />,
      path: '/notifications'
    },
   
  ];

  return (
    <header className="sticky top-0 z-10 bg-white px-2 sm:px-4 py-3 border-b border-gray-200 min-w-[50px]">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-lg sm:text-xl font-bold text-gray-800 no-underline">
          Eduno
        </Link>
        {!isDesktop && (
          <div className="flex items-center space-x-2 sm:space-x-4">
            {mobileTopNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`p-1 sm:p-2 no-underline ${
                  location.pathname === item.path ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                {item.icon}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;