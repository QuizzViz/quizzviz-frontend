import { useClerk } from '@clerk/nextjs';
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

interface LogoutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconClassName?: string;
}

export default function LogoutButton({ 
  className,
  iconClassName,
  ...props 
}: LogoutButtonProps) {
  const clerk = useClerk();
  
  return (
    <button 
      onClick={() => clerk.signOut()}
      className={cn(
        "flex items-center text-sm transition-colors",
        className
      )}
      {...props}
    >
      <LogOut className={cn("mr-2 h-4 w-4", iconClassName)} />
      <span>Sign out</span>
    </button>
  );
}