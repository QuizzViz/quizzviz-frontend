"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import LogoutButton from "@/components/auth/LogoutButton";

export default function UserAvatarDropdown({ userName }: { userName: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Avatar className="cursor-pointer">
            <AvatarImage src="https://github.com/shadcn.png" alt={userName} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          {/* Green dot positioned fully visible */}
          <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 block h-3 w-3 rounded-full bg-green-500 border border-white"></span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 p-2">
        {/* User info at top */}
        <div className="flex items-center gap-2 p-2 border-b border-gray-200">
          <span className="flex-1 font-semibold">{userName}</span>
          <span className="block h-3 w-3 rounded-full bg-green-500"></span>
        </div>

        {/* Settings option */}
        <DropdownMenuItem>
          <a href="/settings">Settings</a>
        </DropdownMenuItem>

        {/* Logout option using the LogoutButton component */}
        <DropdownMenuItem>
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
