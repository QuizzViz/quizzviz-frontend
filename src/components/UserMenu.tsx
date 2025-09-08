import { useState } from "react";
import { ChevronDown } from "lucide-react"; // dropdown arrow icon
import { Avatar, AvatarImage, AvatarFallback } from "./Avatar"; // adjust import
import { Button } from "./Button"; // adjust import

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="flex items-center space-x-2"
        onClick={() => setOpen(!open)}
      >
        <div className="relative">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
            {user?.isLoggedIn && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
            )}
          </Avatar>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200">
          {user?.isLoggedIn ? (
            <div className="flex flex-col">
              <Button className="justify-start px-4 py-2 hover:bg-gray-100 rounded-t-lg">
                Settings
              </Button>
              <Button className="justify-start px-4 py-2 hover:bg-gray-100 rounded-b-lg">
                Logout
              </Button>
            </div>
          ) : (
            <Button className="w-full justify-start px-4 py-2 hover:bg-gray-100 rounded-lg">
              Login
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
