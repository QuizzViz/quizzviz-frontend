"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
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
  FiAlertTriangle,
  FiMessageSquare,
  FiUsers,
} from "react-icons/fi";
import { LogoWithText } from "../LogoWithText";
import { useUserRole } from "@/hooks/useUserRole";

type DashboardSidebarProps = {
  mobileWidthClass?: string;
  menuIconSizeClass?: string;
  navIconSizeClass?: string;
  navTextSizeClass?: string;
  itemPaddingClass?: string;
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
  const [pendingPublishCount, setPendingPublishCount] = useState<number | null>(null);

  const { user } = useUser();
  const { getToken } = useAuth();
  const companyId =
    (user?.unsafeMetadata?.companyId as string | undefined) ||
    (typeof window !== "undefined" ? sessionStorage.getItem("userCompanyId") || localStorage.getItem("userCompanyId") : null) ||
    "";
  const { userRole, loading: roleLoading } = useUserRole(companyId);
  const canSeePendingCount = userRole?.role === "OWNER" || userRole?.role === "ADMIN";

  // This sidebar remounts fresh on every dashboard page navigation (each page
  // renders its own <DashboardSideBar />, there's no shared persistent
  // layout), which resets pendingPublishCount to null every time — and
  // useUserRole's role also starts null for a moment after every remount
  // until its own effect resolves. Seed from the last known value in
  // sessionStorage so a fresh mount shows it immediately instead of
  // blanking the badge and popping it back in a beat later.
  useEffect(() => {
    if (typeof window === "undefined" || !companyId) return;
    const stored = sessionStorage.getItem(`pendingPublishCount_${companyId}`);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!Number.isNaN(parsed)) setPendingPublishCount(parsed);
    }
  }, [companyId]);

  // Only Owner/Admin can act on unpublished quizzes, so only they see this —
  // it's a live count, refetched whenever the sidebar mounts (every page nav).
  useEffect(() => {
    // Role hasn't resolved yet (fresh mount, or a background revalidation in
    // flight) — keep showing whatever we last knew rather than hiding it;
    // only a DEFINITIVE "you're not Owner/Admin" should clear the badge.
    if (roleLoading) return;

    if (!canSeePendingCount) {
      setPendingPublishCount(null);
      if (typeof window !== "undefined" && companyId) {
        sessionStorage.removeItem(`pendingPublishCount_${companyId}`);
      }
      return;
    }
    if (!companyId) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/quiz/pending-publish-count?companyId=${encodeURIComponent(companyId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data?.pending_count === "number") {
          setPendingPublishCount(data.pending_count);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`pendingPublishCount_${companyId}`, String(data.pending_count));
          }
        }
      } catch {
        // Non-critical — keep showing the last known count if this fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roleLoading, canSeePendingCount, companyId, getToken]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
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
    { name: "Analytics", href: "/dashboard/analytics", Icon: (props) => <FiBarChart2 {...props} /> },
    { name: "Usage", href: "/dashboard/usage", Icon: (props) => <FiCreditCard {...props} /> },
    { name: "Profile", href: "/dashboard/profile", Icon: (props) => <FiUser {...props} /> },
    { name: "Teams", href: "/dashboard/teams", Icon: (props) => <FiUsers {...props} /> },
    // { name: "Settings", href: "/dashboard/settings", Icon: (props) => <FiSettings {...props} /> },
    { name: "Feedback", href: "/dashboard/feedback", Icon: (props) => <FiMessageSquare {...props} /> },
    { name: "Report a Bug", href: "/dashboard/report-bug", Icon: (props) => <FiAlertTriangle {...props} /> },
  ];

  const handleMenuItemClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-400 ${
          isMobile && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

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

      <div
        id="mobile-sidebar"
        className={`
          ${isMobile ? "fixed left-0 right-0 top-0 bottom-0" : "sticky top-0 h-screen"} flex flex-col z-50
          transition-all duration-400 ease-[cubic-bezier(0.16, 1, 0.3, 1)]
          ${isMobile && !isOpen ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"}
          ${isMobile ? mobileWidthClass : isOpen ? "w-64" : "w-16"}
          bg-black text-white border-r border-white/20
          ${isMobile ? "shadow-2xl" : ""}
          ${isMobile ? "backdrop-blur-sm bg-black/95" : ""}
        `}
        style={{
          transitionProperty: 'transform, opacity, width, border-color',
          willChange: 'transform, opacity, width',
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        role={isMobile ? "dialog" : undefined}
        aria-modal={isMobile ? true : undefined}
        aria-label={isMobile ? "Navigation menu" : undefined}
      >
        <div className="flex flex-col h-full">
          {isOpen && (
            <div
              className={`sticky top-0 z-10 flex-shrink-0 flex items-center justify-between p-4 border-b border-white/20 bg-black ${
                isScrolled ? "shadow-lg" : ""
              }`}
            >
              <div className="flex-1">
                <LogoWithText
                  className=""
                  showArrow={false}
                  onBack={() => {}}
                />
              </div>
              
              {!isMobile && (
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-1.5 rounded-md hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ml-2"
                  aria-label="Collapse menu"
                >
                  <FiChevronLeft className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          )}

          {!isOpen && !isMobile && (
            <div className="px-2 pt-4">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 mx-auto"
                aria-label="Expand menu"
              >
                <FiMenu className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1">
            <nav className="py-4 px-2">
              <ul className="space-y-1 overflow-hidden">
                {menuItems.map((item) => {
                  const showPendingBadge = item.name === "My Quizzes" && Boolean(pendingPublishCount && pendingPublishCount > 0);
                  return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={handleMenuItemClick}
                      className={`flex items-center w-full ${isMobile ? itemPaddingClass : "p-2.5"} rounded-md transition-all duration-300 ease-[cubic-bezier(0.16, 1, 0.3, 1)] ${
                        (isOpen || isMobile) ? "px-3" : "justify-center"
                      } hover:bg-white/10 group relative text-white active:bg-white/20 transform hover:scale-[1.02] active:scale-[0.98] will-change-transform`}
                    >
                      <span className="relative text-white">
                        <item.Icon className={`${isMobile ? navIconSizeClass : "w-5 h-5"}`} />
                        {showPendingBadge && !isOpen && !isMobile && (
                          <span
                            className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-blue-400 border border-black"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span
                        className={`ml-3 font-medium text-white flex items-center gap-2 ${isMobile ? navTextSizeClass : "text-sm"} transition-opacity duration-300 ${
                          (isOpen || isMobile) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                        }`}
                        style={{
                          transition: 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.name}
                        {showPendingBadge && (isOpen || isMobile) && (
                          <span
                            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold leading-none"
                            title={`${pendingPublishCount} quiz${pendingPublishCount === 1 ? "" : "zes"} awaiting publish`}
                          >
                            {pendingPublishCount}
                          </span>
                        )}
                      </span>
                      {!isOpen && !isMobile && (
                        <span className="absolute left-full ml-2 px-2 py-1 bg-white text-black text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform -translate-x-1 group-hover:translate-x-0 pointer-events-none">
                          {item.name}
                          {showPendingBadge && ` (${pendingPublishCount} pending)`}
                        </span>
                      )}
                    </Link>
                  </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {isMobile && <div className="h-6 flex-shrink-0" />}
        </div>
      </div>
    </>
  );
}