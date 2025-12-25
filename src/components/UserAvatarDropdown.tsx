"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import LogoutButton from "@/components/auth/LogoutButton";
import { Building, Mail, Settings, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface UserAvatarDropdownProps {
  userName: string;
  userEmail?: string;
  className?: string;
  companyName?: string;
  ownerEmail?: string;
}

export default function UserAvatarDropdown({
  userName,
  userEmail,
  className,
  companyName,
  ownerEmail,
}: UserAvatarDropdownProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "group flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors duration-200",
            "focus:outline-none ",
            "active:bg-white/20", // Better mobile touch feedback
            className
          )}
        >
          <div className="relative">
            <Avatar className={cn(
              "border-2 border-white/30 group-hover:border-white/50 transition-colors duration-200",
              isMobile ? "h-10 w-10" : "h-9 w-9" // Slightly larger on mobile for better touch target
            )}>
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt={userName}
                className="object-cover"
              />
              <AvatarFallback className="bg-black text-white font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Green status dot */}
            <span className={cn(
              "absolute bottom-0 right-0 block rounded-full bg-green-500 ring-2 ring-black",
              isMobile ? "h-3 w-3" : "h-2.5 w-2.5" // Slightly larger status dot on mobile
            )} />
          </div>
          
          {/* Hide name and chevron on mobile, show only on desktop */}
          {!isMobile && (
            <div className="flex items-center">
              <span className="text-sm font-medium text-white group-hover:text-white">
                {userName}
              </span>
              <ChevronDown className="ml-1 h-4 w-4 text-white transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "p-1.5 bg-black border border-white/30 rounded-lg shadow-xl backdrop-blur-sm",
          isMobile ? "w-72 mr-4" : "w-64" // Wider on mobile and add margin for better positioning
        )}
        sideOffset={isMobile ? 12 : 8} // More offset on mobile
      >
        <div className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt={userName}
                className="object-cover"
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">{userName}</p>
              {userEmail && (
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              )}
            </div>
          </div>
          
          {(companyName || ownerEmail) && (
            <div className="mt-3 space-y-2 pt-3 border-t">
              {companyName && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{companyName}</span>
                </div>
              )}
              {ownerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{ownerEmail}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={cn(
            "text-sm text-white rounded-md hover:bg-white/10 focus:bg-white/10 cursor-pointer transition-colors",
            isMobile ? "px-3 py-3" : "px-3 py-2" // More padding on mobile
          )}
          onClick={() => (window.location.href = "/dashboard/profile")}
        >
          <User className="mr-2 h-4 w-4 text-white/70" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className={cn(
            "text-sm text-white rounded-md hover:bg-white/10 focus:bg-white/10 cursor-pointer transition-colors",
            isMobile ? "px-3 py-3" : "px-3 py-2" // More padding on mobile
          )}
          onClick={() => (window.location.href = "/dashboard/settings")}
        >
          <Settings className="mr-2 h-4 w-4 text-white/70" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/20 my-1" />

        {/* Logout button with better mobile touch target */}
        <div className={cn(
          "px-1",
          isMobile ? "py-1" : "py-1"
        )}>
          <LogoutButton
            className={cn(
              "w-full justify-start text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors",
              isMobile ? "px-3 py-3" : "px-3 py-2" // More padding on mobile
            )}
            iconClassName="text-red-400"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}