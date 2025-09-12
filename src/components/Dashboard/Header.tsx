import { FC } from "react";
import { LogoWithText } from "@/components/LogoWithText";
import UserAvatarDropdown from "@/components/UserAvatarDropdown";

// Top navigation header for the dashboard
export const DashboardHeader: FC<{
  userName: string;
  userEmail?: string | null;
}> = ({ userName, userEmail }) => {
  return (
    <header className="px-6 py-4 border-b border-black bg-black flex items-center justify-between">
      <LogoWithText className="h-8 text-white" />
      <UserAvatarDropdown userName={userName} userEmail={userEmail || undefined} />
    </header>
  );
};
