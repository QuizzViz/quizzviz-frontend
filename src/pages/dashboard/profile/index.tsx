"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth, SignedIn, SignedOut } from "@clerk/nextjs";
import Head from "next/head";
import { FiStar, FiShield, FiUser, FiEdit2, FiRepeat, FiCheck, FiUsers } from "react-icons/fi";
import { Building2 } from "lucide-react";

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCachedDashboardData } from "@/hooks/useCachedData";
import { refreshUserRole } from "@/hooks/useUserRole";
import { canPerformAction } from "@/utils/rolePermissions";
import { companySizes } from "@/utils/companyConstants";

interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  status: "ACTIVE" | "INVITED";
  invited_email?: string | null;
  name?: string | null;
}

interface CompanyRecord {
  company_id?: string;
  id?: string;
  name?: string;
  owner_email?: string;
  company_size?: string;
  created_at?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim();
  if (!source) return "TM";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const roleConfig = {
  OWNER: {
    Icon: FiStar,
    avatarGradient: "from-amber-500 to-orange-500",
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    label: "Owner",
  },
  ADMIN: {
    Icon: FiShield,
    avatarGradient: "from-violet-500 to-indigo-500",
    badgeClass: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    label: "Admin",
  },
  MEMBER: {
    Icon: FiUser,
    avatarGradient: "from-emerald-500 to-cyan-500",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    label: "Member",
  },
} as const;

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const getCompanyId = useCallback((): string => {
    const metadataCompanyId = user?.unsafeMetadata?.companyId as string | undefined;
    if (metadataCompanyId) return metadataCompanyId;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("userCompanyId") || localStorage.getItem("userCompanyId") || "";
    }
    return "";
  }, [user?.unsafeMetadata?.companyId]);

  const companyId = getCompanyId();

  const {
    company,
    userRole,
    members,
    loading: dataLoading,
    refreshAll,
  } = useCachedDashboardData(user?.id || "", companyId, async () => (await getToken()) || "");

  const companyInfo = company as CompanyRecord | null;
  const resolvedCompanyId = companyInfo?.company_id || companyInfo?.id || companyId;

  const canEditSettings = canPerformAction(userRole, "update_company_settings");
  const canTransfer = canPerformAction(userRole, "transfer_ownership");

  // ── Edit company settings ──────────────────────────────────────────────
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSize, setEditSize] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const openEditDialog = () => {
    setEditName(companyInfo?.name || "");
    setEditSize(companyInfo?.company_size || "");
    setIsEditOpen(true);
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!resolvedCompanyId) return;

    setIsSavingSettings(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/company/${encodeURIComponent(resolvedCompanyId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim(), company_size: editSize }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update company settings");
      }

      toast({
        title: "Saved",
        description: "Company settings updated",
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });
      setIsEditOpen(false);
      await refreshAll();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update company settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ── Transfer ownership ─────────────────────────────────────────────────
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferStep, setTransferStep] = useState<"pick" | "confirm">("pick");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const eligibleMembers: CompanyMember[] = ((members as CompanyMember[]) || []).filter(
    (m) => m.status === "ACTIVE" && m.user_id !== user?.id
  );
  const selectedMember = eligibleMembers.find((m) => m.id === selectedMemberId) || null;

  const openTransferDialog = () => {
    setTransferStep("pick");
    setSelectedMemberId(null);
    setIsTransferOpen(true);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedMember || !resolvedCompanyId || !user) return;

    setIsTransferring(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `/api/company/${encodeURIComponent(resolvedCompanyId)}/transfer-ownership`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            new_owner_user_id: selectedMember.user_id,
            old_owner_name: user.fullName || user.primaryEmailAddress?.emailAddress || "Previous owner",
            old_owner_email: user.primaryEmailAddress?.emailAddress || "",
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to transfer ownership");
      }

      toast({
        title: "Ownership transferred",
        description: `${selectedMember.name || selectedMember.invited_email || "The new owner"} is now the Owner. You're now an Admin.`,
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });
      setIsTransferOpen(false);

      if (user?.id && resolvedCompanyId) {
        await refreshUserRole(user.id, resolvedCompanyId, getToken);
      }
      await refreshAll();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to transfer ownership",
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  if (dataLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            <div className="bg-white border-r border-white">
              <DashboardSideBar />
            </div>
            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 p-6">
                <LoadingSpinner text="Loading your profile..." />
              </main>
            </div>
          </div>
        </SignedIn>
      </div>
    );
  }

  const currentRoleConfig = userRole?.role ? roleConfig[userRole.role as keyof typeof roleConfig] : null;

  return (
    <DashboardAccess>
      <Head>
        <title>Profile | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Manage your company profile and settings."
        />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            <div className="bg-white">
              <DashboardSideBar />
            </div>

            <div className="flex-1 flex flex-col">
              <DashboardHeader />

              <main className="flex-1 p-6 space-y-6">
                <h1 className="text-2xl font-semibold">Profile</h1>

                {/* Company card */}
                <div className="bg-[#0f1421] border border-white/[0.07] rounded-[20px] p-6 max-w-lg mx-auto flex flex-col items-center space-y-5 shadow-[0_20px_48px_rgba(0,0,0,0.35)]">
                  <div className="w-24 h-24 rounded-[20px] bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Building2 className="w-11 h-11 text-white" />
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold">{companyInfo?.name || "No Company"}</h2>
                    {currentRoleConfig && (
                      <span
                        className={`inline-flex items-center gap-[6px] text-[12px] font-semibold px-[10px] py-[4px] rounded-[8px] border ${currentRoleConfig.badgeClass}`}
                      >
                        <currentRoleConfig.Icon className="w-[13px] h-[13px]" />
                        Your role: {currentRoleConfig.label}
                      </span>
                    )}
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex justify-between border-b border-white/[0.08] pb-2">
                      <span className="text-white/50">Joined:</span>
                      <span>
                        {new Date(companyInfo?.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.08] pb-2">
                      <span className="text-white/50">Owner Email:</span>
                      <span className="truncate max-w-[220px]">{companyInfo?.owner_email}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-white/50">Company Size:</span>
                      <span>{companyInfo?.company_size || "Not set"}</span>
                    </div>
                  </div>

                  {(canEditSettings || canTransfer) && (
                    <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
                      {canEditSettings && (
                        <Button
                          onClick={openEditDialog}
                          className="flex-1 bg-white/[0.06] border border-white/[0.12] text-white hover:bg-white/[0.1] rounded-[11px] h-[42px]"
                        >
                          <FiEdit2 className="w-4 h-4 mr-2" />
                          Edit Settings
                        </Button>
                      )}
                      {canTransfer && (
                        <Button
                          onClick={openTransferDialog}
                          className="flex-1 bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white hover:brightness-110 rounded-[11px] h-[42px]"
                        >
                          <FiRepeat className="w-4 h-4 mr-2" />
                          Transfer Ownership
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">
                Redirecting to sign in...
              </h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          </div>
        </SignedOut>

        {/* ── Edit Company Settings Dialog ──────────────────────────────────── */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-[#161c2a] border border-white/10 text-white rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.7)] max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-[17px] font-bold text-[#f0f4ff]">Edit company settings</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveSettings} className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-[12px] font-bold tracking-[0.5px] text-white/40 uppercase">
                  Company name
                </Label>
                <Input
                  id="company-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="bg-white/[0.05] text-[#eef2ff] rounded-[11px] h-[42px] border-none focus-visible:ring-1 focus-visible:ring-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-size" className="text-[12px] font-bold tracking-[0.5px] text-white/40 uppercase">
                  Company size
                </Label>
                <Select value={editSize} onValueChange={setEditSize}>
                  <SelectTrigger className="bg-white/[0.05] text-[#eef2ff] rounded-[11px] h-[42px] border-none focus:ring-0 focus-visible:outline-none outline-none">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e2535] border-white/10 text-white rounded-[13px]">
                    {companySizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} employees
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-[10px] pt-1">
                <Button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSavingSettings}
                  className="flex-1 bg-white/[0.05] border border-white/[0.12] text-white/70 hover:bg-white/[0.09] rounded-[11px] h-[42px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingSettings || !editName.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:brightness-110 rounded-[11px] h-[42px] font-semibold"
                >
                  {isSavingSettings ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Transfer Ownership Dialog ──────────────────────────────────────── */}
        <Dialog
          open={isTransferOpen}
          onOpenChange={(open) => {
            setIsTransferOpen(open);
            if (!open) setTransferStep("pick");
          }}
        >
          <DialogContent className="bg-[#161c2a] border border-white/10 text-white rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.7)] max-w-sm">
            {transferStep === "pick" ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-[17px] font-bold text-[#f0f4ff]">Transfer ownership</DialogTitle>
                </DialogHeader>
                <p className="text-[13px] text-white/45 leading-[1.55] -mt-1">
                  Pick a team member to become the new Owner. You will be demoted to Admin.
                </p>
                {eligibleMembers.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-6 gap-2">
                    <FiUsers className="w-8 h-8 text-white/25" />
                    <p className="text-[13px] text-white/40">
                      No other active team members to transfer ownership to yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {eligibleMembers.map((member) => {
                      const config = roleConfig[member.role];
                      const isSelected = selectedMemberId === member.id;
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setSelectedMemberId(member.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-[12px] border transition-colors text-left ${
                            isSelected
                              ? "bg-blue-500/[0.1] border-blue-500/40"
                              : "bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.06]"
                          }`}
                        >
                          <div
                            className={`h-[36px] w-[36px] rounded-[10px] bg-gradient-to-br ${config.avatarGradient} flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0`}
                          >
                            {getInitials(member.name, member.invited_email)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-white/85 truncate">
                              {member.name ?? member.invited_email ?? "Team Member"}
                            </p>
                            <p className="text-[11px] text-white/35 truncate">
                              {member.invited_email ?? "—"} · {config.label}
                            </p>
                          </div>
                          {isSelected && <FiCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-[10px] pt-1">
                  <Button
                    type="button"
                    onClick={() => setIsTransferOpen(false)}
                    className="flex-1 bg-white/[0.05] border border-white/[0.12] text-white/70 hover:bg-white/[0.09] rounded-[11px] h-[42px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={!selectedMember}
                    onClick={() => setTransferStep("confirm")}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 rounded-[11px] h-[42px] font-semibold disabled:opacity-40"
                  >
                    Continue
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center pt-2 pb-1">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-amber-500/[0.12] border border-amber-500/[0.22] flex items-center justify-center mb-[18px]">
                  <FiRepeat className="w-[22px] h-[22px] text-amber-400" />
                </div>
                <h3 className="text-[17px] font-bold text-[#f0f4ff] mb-[8px]">Transfer ownership?</h3>
                <p className="text-[13px] text-white/45 leading-[1.55] mb-[24px]">
                  You are about to make{" "}
                  <span className="text-white/75 font-semibold">
                    {selectedMember?.name || selectedMember?.invited_email}
                  </span>{" "}
                  the new Owner of this company. You will be demoted to Admin — you will keep full access, just
                  not the Owner role.
                </p>
                <div className="flex w-full gap-[10px]">
                  <Button
                    onClick={() => setTransferStep("pick")}
                    disabled={isTransferring}
                    className="flex-1 bg-white/[0.05] border border-white/[0.12] text-white/70 hover:bg-white/[0.09] rounded-[11px] h-[42px]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmTransfer}
                    disabled={isTransferring}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 rounded-[11px] h-[42px] font-semibold"
                  >
                    {isTransferring ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Transferring...
                      </>
                    ) : (
                      "Confirm transfer"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardAccess>
  );
}
