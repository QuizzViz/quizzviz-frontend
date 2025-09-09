"use client";

import { useState, useEffect } from "react";
import {
  FiMenu,
  FiChevronLeft,
  FiHome,
  FiBook,
  FiSettings,
  FiCreditCard,
  FiUser,
  FiBarChart2,
} from "react-icons/fi";

export default function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: <FiHome className="w-5 h-5" /> },
    { name: "Quizzes", icon: <FiBook className="w-5 h-5" /> },
    { name: "Results", icon: <FiBarChart2 className="w-5 h-5" /> },
    { name: "Billing", icon: <FiCreditCard className="w-5 h-5" /> },
    { name: "Profile", icon: <FiUser className="w-5 h-5" /> },
    { name: "Settings", icon: <FiSettings className="w-5 h-5" /> },
  ];

  return (
    <div className={`h-screen flex flex-col transition-all duration-300 ease-in-out ${
      isOpen ? "w-64" : "w-16"
    } bg-slate-900 text-slate-200 sticky top-0`}>
      {/* Toggle button */}
      <div className={`flex items-center justify-between p-4 border-b border-slate-700 ${
        isScrolled ? 'shadow-lg' : ''
      }`}>
        {isOpen && <span className="font-semibold">Menu</span>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-md hover:bg-slate-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label={isOpen ? 'Collapse menu' : 'Expand menu'}
        >
          {isOpen ? (
            <FiChevronLeft className="w-5 h-5 text-slate-300" />
          ) : (
            <FiMenu className="w-5 h-5 text-slate-300" />
          )}
        </button>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <a
                href="#"
                className={`
                  flex items-center w-full p-2.5 rounded-md 
                  transition-all duration-200 ease-in-out
                  ${
                    isOpen ? 'px-3' : 'justify-center'
                  }
                  hover:bg-slate-800 hover:text-white
                  group relative overflow-hidden
                `}
              >
                <span className={`
                  ${isOpen ? 'mr-3' : 'mx-auto'}
                  text-slate-300 group-hover:text-white
                  transition-colors duration-200
                `}>
                  {item.icon}
                </span>
                {isOpen && (
                  <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors duration-200">
                    {item.name}
                  </span>
                )}
                {!isOpen && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-slate-200 text-slate-900 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    {item.name}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
