import dynamic from "next/dynamic";
import { UserTypeProvider } from "@/contexts/UserTypeContext";

const ClientLandingPage = dynamic(() => import("./ClientLandingPage"), {
  ssr: false,
});

export default function LandingPage() {
  return (
    <UserTypeProvider>
      <ClientLandingPage />
    </UserTypeProvider>
  );
}
