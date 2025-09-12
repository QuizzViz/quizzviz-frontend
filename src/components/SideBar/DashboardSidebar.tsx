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
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: <FiHome className="w-5 h-5" /> },
    { name: "My Quizzes", icon: <FiBook className="w-5 h-5" /> },
    { name: "Results", icon: <FiBarChart2 className="w-5 h-5" /> },
    { name: "Billing", icon: <FiCreditCard className="w-5 h-5" /> },
    { name: "Profile", icon: <FiUser className="w-5 h-5" /> },
    { name: "Settings", icon: <FiSettings className="w-5 h-5" /> },
  ];

  return (
    <div
      className={`sticky top-0 h-screen flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? "w-64" : "w-16"
      } bg-black text-white border-r border-black`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex-shrink-0 flex items-center justify-between p-4 border-b border-black bg-black ${
            isScrolled ? "shadow-lg" : ""
          }`}
        >
          {isOpen && <span className="font-semibold text-white">Menu</span>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            aria-label={isOpen ? "Collapse menu" : "Expand menu"}
          >
            {isOpen ? (
              <FiChevronLeft className="w-5 h-5 text-white" />
            ) : (
              <FiMenu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1">
          <nav className="py-4 px-2">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <a
                    href="#"
                    className={`flex items-center w-full p-2.5 rounded-md transition-all duration-200 ease-in-out ${
                      isOpen ? "px-3" : "justify-center"
                    } hover:bg-white/10 group relative text-white`}
                  >
                    <span className="text-white">{item.icon}</span>
                    {isOpen && (
                      <span className="ml-3 text-sm font-medium text-white">
                        {item.name}
                      </span>
                    )}
                    {!isOpen && (
                      <span className="absolute left-full ml-2 px-2 py-1 bg-white text-black text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        {item.name}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
