import { UserTypeProvider } from "@/contexts/UserTypeContext";

import ClientLandingPage from "./ClientLandingPage";

export default function LandingPage() {
  return (
    <UserTypeProvider>
      <ClientLandingPage />
    </UserTypeProvider>
  );
}
