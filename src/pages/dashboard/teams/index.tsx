"use client";

import { useEffect, useState } from "react";
import { useUser, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import Head from "next/head";
import { FiUsers, FiMail, FiPlus, FiRefreshCw, FiEdit, FiTrash, FiShield, FiStar, FiUser } from "react-icons/fi";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  status: "ACTIVE" | "INVITED";
  invite_token?: string | null;
  invited_email?: string | null;
  invite_expires_at?: string | null;
  joined_at?: string | null;
  created_at: string;
  updated_at: string;
  name?: string | null;
}

interface InviteFormData {
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
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
    icon: FiStar,
    gradient: "from-amber-400 to-orange-500",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    glow: "shadow-amber-500/10",
    label: "Owner",
  },
  ADMIN: {
    icon: FiShield,
    gradient: "from-violet-400 to-indigo-500",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/25",
    glow: "shadow-violet-500/10",
    label: "Admin",
  },
  MEMBER: {
    icon: FiUser,
    gradient: "from-emerald-400 to-cyan-500",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    glow: "shadow-emerald-500/10",
    label: "Member",
  },
};

export default function TeamsPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [editingMember, setEditingMember] = useState<CompanyMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string>("");
  const { userRole } = useUserRole(companyId);
  const { toast } = useToast();
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: "",
    name: "",
    role: "MEMBER",
  });

  useEffect(() => {
    const metadataCompanyId = user?.unsafeMetadata?.companyId;
    const localStorageCompanyId =
      typeof window !== "undefined" ? localStorage.getItem("userCompanyId") : null;

    if (metadataCompanyId) {
      setCompanyId(metadataCompanyId as string);
    } else if (localStorageCompanyId) {
      setCompanyId(localStorageCompanyId);
    } else {
      setCompanyId("quizzviz");
    }
  }, [user]);

  const fetchMembers = async () => {
    if (!companyId) return;
    setIsFetchingMembers(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `/api/company-members?company_id=${companyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    } finally {
      setIsFetchingMembers(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchMembers();
  }, [companyId]);

  useEffect(() => {
    if (isLoaded && !user) router.push("/signin");
    else if (isLoaded) setIsLoading(false);
  }, [isLoaded, user, router]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    setIsSubmittingInvite(true);
    try {
      const token = await getToken();
      const companyName = user?.unsafeMetadata?.companyName || "QuizzViz";

      const response = await fetch("/api/company-members/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_id: companyId,
          company_name: companyName,
          name: inviteForm.name,
          invited_email: inviteForm.email,
          role: inviteForm.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }

      toast({
        title: "Invite Sent Successfully!",
        description: `Invitation sent to ${inviteForm.email}`,
        className:
          "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });

      setInviteForm({ email: "", name: "", role: "MEMBER" });
      setIsInviteDialogOpen(false);
      fetchMembers();
    } catch (error) {
      console.error("Error sending invite:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleUpdateMember = async (
    memberId: string,
    updates: Partial<CompanyMember>
  ) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/company-members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update member");
      }

      toast({
        title: "Member Updated Successfully!",
        description: `Updated ${updates.name || "member"}'s information`,
        className:
          "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });

      fetchMembers();
      setIsEditDialogOpen(false);
      setEditingMember(null);
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/company-members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete member");
      }

      toast({
        title: "Member Removed",
        description: `Removed ${memberName} from the team`,
        className:
          "border-red-600/60 bg-red-700 text-red-100 shadow-lg shadow-red-600/30",
      });

      fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete member",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !isLoaded) {
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
                <LoadingSpinner text="Loading teams..." />
              </main>
            </div>
          </div>
        </SignedIn>
      </div>
    );
  }

  return (
    <DashboardAccess>
      <Head>
        <title>Teams | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Manage your teams and collaborate with others."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className="bg-white border-r border-white">
              <DashboardSideBar />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 p-6 space-y-8">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
                    <p className="text-white/50 text-sm mt-1">
                      Manage your team members and their roles.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Refresh — now green gradient (was blue) */}
                    <Button
                      onClick={fetchMembers}
                      className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 px-4 py-2 rounded-lg flex items-center"
                      disabled={isFetchingMembers}
                    >
                      <FiRefreshCw className={`h-4 w-4 mr-2 ${isFetchingMembers ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>

                    {/* Invite Member — now solid blue (was green gradient) */}
                    <Dialog
                      open={isInviteDialogOpen}
                      onOpenChange={setIsInviteDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          <FiPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={handleInviteSubmit}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              type="text"
                              placeholder="Enter full name"
                              value={inviteForm.name}
                              onChange={(e) =>
                                setInviteForm({ ...inviteForm, name: e.target.value })
                              }
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter email address"
                              value={inviteForm.email}
                              onChange={(e) =>
                                setInviteForm({ ...inviteForm, email: e.target.value })
                              }
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                              value={inviteForm.role}
                              onValueChange={(value: "OWNER" | "ADMIN" | "MEMBER") =>
                                setInviteForm({ ...inviteForm, role: value })
                              }
                            >
                              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="OWNER">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsInviteDialogOpen(false)}
                              className="border-gray-600 text-white hover:bg-gray-800"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={isSubmittingInvite}
                              className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110"
                            >
                              {isSubmittingInvite ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              ) : (
                                <FiMail className="h-4 w-4 mr-2" />
                              )}
                              {isSubmittingInvite ? "Sending..." : "Send Invite"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Members Grid */}
                {isFetchingMembers ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner text="Fetching team members..." />
                  </div>
                ) : members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {members.map((member) => {
                      const config = roleConfig[member.role];
                      const RoleIcon = config.icon;
                      return (
                        <div
                          key={member.id}
                          className={`group relative bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-300 hover:shadow-xl ${config.glow}`}
                        >
                          {/* Subtle top accent line based on role */}
                          <div className={`h-0.5 w-full bg-gradient-to-r ${config.gradient} opacity-60`} />

                          <div className="p-5">
                            {/* Top row: Avatar + Name + Mail icon */}
                            <div className="flex items-start gap-4 mb-5">
                              {/* Avatar */}
                              <div className="relative flex-shrink-0">
                                <div
                                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-sm font-bold text-white shadow-md`}
                                >
                                  {getInitials(member.name, member.invited_email)}
                                </div>
                                {/* Online/active indicator */}
                                {member.status === "ACTIVE" && (
                                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
                                )}
                              </div>

                              {/* Name & email */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold text-base leading-snug truncate">
                                  {member.name ?? member.invited_email ?? "Team Member"}
                                </h3>
                                {member.invited_email && member.name && (
                                  <p className="text-white/40 text-xs mt-0.5 truncate">
                                    {member.invited_email}
                                  </p>
                                )}
                              </div>

                              {/* Mail button */}
                              <button className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 flex items-center justify-center flex-shrink-0">
                                <FiMail className="h-3.5 w-3.5 text-white/40" />
                              </button>
                            </div>

                            {/* Role + Status badges */}
                            <div className="flex items-center gap-2 mb-5">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${config.badge}`}
                              >
                                <RoleIcon className="h-3 w-3" />
                                {config.label}
                              </span>
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                                  member.status === "ACTIVE"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                              >
                                {member.status === "ACTIVE" ? "Active" : "Invited"}
                              </span>
                            </div>

                            {/* Meta info */}
                            <div className="text-xs text-white/30 space-y-1 mb-5">
                              {member.joined_at && (
                                <p>
                                  Joined{" "}
                                  <span className="text-white/50">
                                    {new Date(member.joined_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </p>
                              )}
                              {member.status === "INVITED" && member.invite_expires_at && (
                                <p>
                                  Invite expires{" "}
                                  <span className="text-amber-400/70">
                                    {new Date(member.invite_expires_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </p>
                              )}
                            </div>

                            {/* Action buttons — visible on hover */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 text-xs h-8"
                                onClick={() => {
                                  setEditingMember(member);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <FiEdit className="h-3 w-3 mr-1.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-red-500/20 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 text-xs h-8"
                                onClick={() =>
                                  handleDeleteMember(
                                    member.id,
                                    member.name ?? member.invited_email ?? "member"
                                  )
                                }
                              >
                                <FiTrash className="h-3 w-3 mr-1.5" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-white/5 mb-6">
                      <FiUsers className="h-12 w-12 text-white/30" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No Team Members Yet</h3>
                    <p className="text-white/40 mb-6 text-sm">
                      Start building your team by inviting your first member.
                    </p>
                    <Button
                      onClick={() => setIsInviteDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FiPlus className="h-4 w-4 mr-2" />
                      Invite Your First Member
                    </Button>
                  </div>
                )}

              </main>
            </div>
          </div>
        </SignedIn>

        {/* Edit Member Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
            </DialogHeader>
            {editingMember && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateMember(editingMember.id, {
                    role: editingMember.role,
                    name: editingMember.name,
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    placeholder="Enter full name"
                    value={editingMember.name || ""}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, name: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editingMember.role}
                    onValueChange={(value: "OWNER" | "ADMIN" | "MEMBER") =>
                      setEditingMember({ ...editingMember, role: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingMember(null);
                    }}
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110"
                  >
                    Update Member
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <SignedOut>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">
                Redirecting to sign in...
              </h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
            </div>
          </div>
        </SignedOut>
      </div>
    </DashboardAccess>
  );
}