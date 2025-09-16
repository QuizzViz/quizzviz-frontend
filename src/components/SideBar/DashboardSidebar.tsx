"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiMenu,
  FiChevronLeft,
  FiHome,
  FiBook,
  FiSettings,
  FiCreditCard,
  FiUser,
  FiBarChart2,
  FiX,
} from "react-icons/fi";

type DashboardSidebarProps = {
  mobileWidthClass?: string; // Tailwind classes for mobile drawer width
  menuIconSizeClass?: string; // Tailwind size for FiMenu/FiX icons, e.g., "w-6 h-6"
  navIconSizeClass?: string; // Tailwind size for nav icons
  navTextSizeClass?: string; // Tailwind text size for nav labels
  itemPaddingClass?: string; // Tailwind padding for nav items
};

export default function DashboardSidebar({
  mobileWidthClass = "w-4/5 max-w-sm",
  menuIconSizeClass = "w-6 h-6",
  navIconSizeClass = "w-5 h-5",
  navTextSizeClass = "text-sm",
  itemPaddingClass = "p-2.5",
}: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, sidebar should be closed by default
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById("mobile-sidebar");
        const menuButton = document.getElementById("menu-button");
        const target = event.target as Node;
        if (
          sidebar &&
          !sidebar.contains(target) &&
          menuButton &&
          !menuButton.contains(target)
        ) {
          setIsOpen(false);
        }
      }
    };

    const handleMouseOutside = (event: MouseEvent) => handleClickOutside(event);
    const handleTouchOutside = (event: TouchEvent) => handleClickOutside(event);

    if (isMobile && isOpen) {
      document.addEventListener("mousedown", handleMouseOutside);
      document.addEventListener("touchstart", handleTouchOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleMouseOutside);
      document.removeEventListener("touchstart", handleTouchOutside);
    };
  }, [isMobile, isOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobile, isOpen]);

  const menuItems: { name: string; href: string; Icon: (props: { className?: string }) => JSX.Element }[] = [
    { name: "Dashboard", href: "/dashboard", Icon: (props) => <FiHome {...props} /> },
    { name: "My Quizzes", href: "/dashboard/my-quizzes", Icon: (props) => <FiBook {...props} /> },
    { name: "Results", href: "/dashboard/results", Icon: (props) => <FiBarChart2 {...props} /> },
    { name: "Billing", href: "/dashboard/billing", Icon: (props) => <FiCreditCard {...props} /> },
    { name: "Profile", href: "/dashboard/profile", Icon: (props) => <FiUser {...props} /> },
    { name: "Settings", href: "/dashboard/settings", Icon: (props) => <FiSettings {...props} /> },
  ];

  const handleMenuItemClick = () => {
    // Close sidebar on mobile when menu item is clicked
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        id="menu-button"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-md bg-black text-white border border-white/30 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 md:hidden ${
          isOpen ? "bg-white/10" : ""
        }`}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-controls="mobile-sidebar"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <FiX className={`${menuIconSizeClass} text-white`} />
        ) : (
          <FiMenu className={`${menuIconSizeClass} text-white`} />
        )}
      </button>

      {/* Sidebar */}
      <div
        id="mobile-sidebar"
        className={`
          ${isMobile ? "fixed left-0 right-0 top-0 bottom-0" : "sticky top-0 h-screen"} flex flex-col transition-transform duration-300 ease-in-out z-50
          ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
          ${isMobile ? mobileWidthClass : isOpen ? "w-64" : "w-16"}
          bg-black text-white border-r border-white
          ${isMobile ? "shadow-2xl" : ""}
        `}
        role={isMobile ? "dialog" : undefined}
        aria-modal={isMobile ? true : undefined}
        aria-label={isMobile ? "Navigation menu" : undefined}
      >
        <div className="flex flex-col h-full">

          {/* Header */}
          <div
            className={`sticky top-0 z-10 flex-shrink-0 flex items-center justify-between p-4 border-b border-white/20 bg-black ${
              isScrolled ? "shadow-lg" : ""
            }`}
          >
            {/* Show "Menu" text only when sidebar is open, hide when collapsed */}
            {isOpen && (
              <span className="font-semibold text-white">Menu</span>
            )}
            {/* Desktop toggle button */}
            {!isMobile && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-1.5 rounded-md hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                  !isOpen ? "mx-auto" : ""
                }`}
                aria-label={isOpen ? "Collapse menu" : "Expand menu"}
              >
                {isOpen ? (
                  <FiChevronLeft className="w-5 h-5 text-white" />
                ) : (
                  <FiMenu className="w-5 h-5 text-white" />
                )}
              </button>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1">
            <nav className="py-4 px-2">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={handleMenuItemClick}
                      className={`flex items-center w-full ${itemPaddingClass} rounded-md transition-all duration-200 ease-in-out ${
                        (isOpen || isMobile) ? "px-3" : "justify-center"
                      } hover:bg-white/10 group relative text-white active:bg-white/20`}
                    >
                      <span className="text-white">
                        <item.Icon className={`${navIconSizeClass}`} />
                      </span>
                      {(isOpen || isMobile) && (
                        <span className={`ml-3 font-medium text-white ${navTextSizeClass}`}>
                          {item.name}
                        </span>
                      )}
                      {!isOpen && !isMobile && (
                        <span className="absolute left-full ml-2 px-2 py-1 bg-white text-black text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Mobile footer space for safe area */}
          {isMobile && <div className="h-6 flex-shrink-0" />}
        </div>
      </div>
    </>
  );
}