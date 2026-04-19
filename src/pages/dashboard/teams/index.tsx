"use client";

import { useEffect, useState } from "react";
import { useUser, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import Head from "next/head";
import { FiUsers, FiMail, FiPlus, FiRefreshCw, FiEdit, FiTrash, FiMoreVertical, FiShield, FiCalendar, FiUser } from "react-icons/fi";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
        title: "Member Deleted Successfully!",
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
              <main className="flex-1 p-6 space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Team Members</h1>
                    <p className="text-gray-400">
                      Manage your team members and their roles.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Refresh Button - Analytics Style */}
                    <Button
                      onClick={fetchMembers}
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-gray-800 hover:text-white flex items-center gap-2"
                      disabled={isFetchingMembers}
                    >
                      <FiRefreshCw className={`h-4 w-4 ${isFetchingMembers ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>

                    {/* Invite Member Button - Blue */}
                    <Dialog
                      open={isInviteDialogOpen}
                      onOpenChange={setIsInviteDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                          <FiPlus className="h-4 w-4" />
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
                                setInviteForm({
                                  ...inviteForm,
                                  name: e.target.value,
                                })
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
                                setInviteForm({
                                  ...inviteForm,
                                  email: e.target.value,
                                })
                              }
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                              value={inviteForm.role}
                              onValueChange={(
                                value: "OWNER" | "ADMIN" | "MEMBER"
                              ) =>
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
                              className="bg-blue-600 hover:bg-blue-700 text-white"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="group relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                      >
                        {/* Header with Avatar and Name */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            {/* Avatar with role-based color */}
                            <div
                              className={`h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg ${
                                member.role === "OWNER"
                                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                                  : member.role === "ADMIN"
                                  ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white"
                                  : "bg-gradient-to-br from-emerald-400 to-cyan-500 text-white"
                              }`}
                            >
                              {getInitials(member.name, member.invited_email)}
                            </div>

                            {/* Name */}
                            <div>
                              <h3 className="text-white font-semibold text-xl leading-tight mb-1">
                                {member.name ??
                                  member.invited_email ??
                                  "Team Member"}
                              </h3>
                              {member.invited_email && member.name && (
                                <p className="text-gray-400 text-sm">
                                  {member.invited_email}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* More Options Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                              >
                                <FiMoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-800 border-gray-700">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingMember(member);
                                  setIsEditDialogOpen(true);
                                }}
                                className="text-gray-300 hover:text-white hover:bg-gray-700"
                              >
                                <FiEdit className="h-4 w-4 mr-2" />
                                Edit Member
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteMember(
                                    member.id,
                                    member.name ?? member.invited_email ?? "member"
                                  )
                                }
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                <FiTrash className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Role and Status Badges */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <FiShield className="h-4 w-4 text-gray-400" />
                            <span
                              className={`text-sm font-medium px-3 py-1 rounded-full border ${
                                member.role === "OWNER"
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                  : member.role === "ADMIN"
                                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              }`}
                            >
                              {member.role}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-medium px-3 py-1 rounded-full border ${
                              member.status === "ACTIVE"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {member.status}
                          </span>
                        </div>

                        {/* Member meta info */}
                        <div className="space-y-2 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <FiUser className="h-4 w-4" />
                            <span>
                              {member.status === "ACTIVE" ? "Active Member" : "Pending Invitation"}
                            </span>
                          </div>
                          {member.joined_at && (
                            <div className="flex items-center gap-2">
                              <FiCalendar className="h-4 w-4" />
                              <span>
                                Joined {new Date(member.joined_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {member.status === "INVITED" &&
                            member.invite_expires_at && (
                              <div className="flex items-center gap-2">
                                <FiCalendar className="h-4 w-4" />
                                <span>
                                  Expires {new Date(
                                    member.invite_expires_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-8">
                      <FiUsers className="h-16 w-16 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      No Team Members Yet
                    </h3>
                    <p className="text-gray-400 mb-8 max-w-md">
                      Start building your team by inviting your first member. Collaborate and grow together.
                    </p>
                    <Button
                      onClick={() => setIsInviteDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-3"
                    >
                      <FiPlus className="h-4 w-4" />
                      Invite Your First Member
                    </Button>
                  </div>
                )}

              </main>
            </div>
          </div>
        </SignedIn>

        {/* Edit Member Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        >
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
                      setEditingMember({
                        ...editingMember,
                        name: e.target.value,
                      })
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
                      setEditingMember({
                        ...editingMember,
                        role: value,
                      })
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
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
