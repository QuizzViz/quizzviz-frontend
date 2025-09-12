"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import LogoutButton from "@/components/auth/LogoutButton";
import { Settings, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarDropdownProps {
  userName: string;
  userEmail?: string;
  className?: string;
}

export default function UserAvatarDropdown({
  userName,
  userEmail,
  className,
}: UserAvatarDropdownProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "group flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black",
            className
          )}
        >
          <div className="relative">
            <Avatar className="h-9 w-9 border-2 border-white/30 group-hover:border-white/50 transition-colors duration-200">
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
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-black" />
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-white group-hover:text-white">
              {userName}
            </span>
            <ChevronDown className="ml-1 h-4 w-4 text-white transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 p-1.5 bg-black border border-white/30 rounded-lg shadow-xl backdrop-blur-sm"
        sideOffset={8}
      >
        {/* User info section */}
        <div className="px-3 py-2.5">
          <p className="text-sm font-medium text-white">{userName}</p>
          {userEmail && (
            <p className="text-xs text-white/70 truncate">{userEmail}</p>
          )}
          <div className="flex items-center mt-1">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
            <span className="text-xs text-white/70">Active now</span>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-white/20 my-1" />

        {/* Menu items */}
        <DropdownMenuItem
          className="px-3 py-2 text-sm text-white rounded-md hover:bg-white/10 focus:bg-white/10 cursor-pointer transition-colors"
          onClick={() => (window.location.href = "/dashboard/profile")}
        >
          <User className="mr-2 h-4 w-4 text-white/70" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="px-3 py-2 text-sm text-white rounded-md hover:bg-white/10 focus:bg-white/10 cursor-pointer transition-colors"
          onClick={() => (window.location.href = "/dashboard/settings")}
        >
          <Settings className="mr-2 h-4 w-4 text-white/70" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/20 my-1" />

        {/* Logout button (red, as before) */}
        <div className="px-1 py-1">
          <LogoutButton
            className="w-full justify-start px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
            iconClassName="text-red-400"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
