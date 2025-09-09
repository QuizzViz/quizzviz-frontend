"use client";

import { useState } from "react";
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

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { name: "Dashboard", icon: <FiHome /> },
    { name: "Quizzes", icon: <FiBook /> },
    { name: "Results", icon: <FiBarChart2 /> },
    { name: "Billing", icon: <FiCreditCard /> },
    { name: "Profile", icon: <FiUser /> },
    { name: "Settings", icon: <FiSettings /> },
  ];

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`h-screen flex flex-col transition-all duration-300 ${
          isOpen ? "w-64" : "w-16"
        } bg-[your-old-sidebar-color] text-[your-old-text-color] border-r border-gray-300 shadow-md`}
      >
        {/* Toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mb-6 text-xl p-2 focus:outline-none hover:bg-[your-old-hover-color] rounded self-end m-2 transition-colors"
        >
          {isOpen ? <FiChevronLeft /> : <FiMenu />}
        </button>

        {/* Menu items */}
        <nav className="flex flex-col gap-2 mt-2">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href="#"
              className={`
                flex items-center gap-4 p-2 rounded relative transition-all duration-300
                ${isOpen
                  ? "before:absolute before:inset-0 before:rounded before:bg-white/10 before:opacity-0 hover:before:opacity-100 hover:translate-x-1 hover:scale-105"
                  : "hover:scale-110 transform transition-transform duration-500"
                }
              `}
            >
              <span className="text-lg transition-transform duration-300">{item.icon}</span>
              {isOpen && <span className="transition-opacity duration-300">{item.name}</span>}
            </a>
          ))}
        </nav>
      </div>

      
    </div>
  );
}
