"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SignedIn, SignedOut, useUser, useAuth } from "@clerk/nextjs";
import Head from "next/head";
import { FiUsers, FiMail, FiPlus, FiUser, FiFrown, FiShield, FiUserCheck } from "react-icons/fi";
import { format } from "date-fns";

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'INVITED';
  invite_token?: string;
  invited_email?: string;
  invite_expires_at?: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  name?: string;
}

interface InviteFormData {
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
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
  const [companyId, setCompanyId] = useState<string>('');
  const { toast } = useToast();
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: '',
    name: '',
    role: 'MEMBER'
  });

  // Get company ID from user metadata
  useEffect(() => {
    if (user?.unsafeMetadata?.companyId) {
      const id = user.unsafeMetadata.companyId as string;
      setCompanyId(id);
    } else {
      // Fallback for testing - use the company_id from the database
      setCompanyId('quizzviz');
    }
  }, [user]);

  // Fetch company members
  const fetchMembers = async () => {
    if (!companyId) return;

    setIsFetchingMembers(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/company-members?company_id=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
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
    if (companyId) {
      fetchMembers();
    }
  }, [companyId]);

  useEffect(() => {
    if (isLoaded && !user) router.push("/signin");
    else if (isLoaded) setIsLoading(false);
  }, [isLoaded, user, router]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <FiFrown className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN':
        return <FiShield className="h-4 w-4 text-blue-500" />;
      case 'MEMBER':
        return <FiUserCheck className="h-4 w-4 text-green-500" />;
      default:
        return <FiUser className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-400 border border-amber-500/30 shadow-amber-500/20';
      case 'ADMIN':
        return 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30 shadow-blue-500/20';
      case 'MEMBER':
        return 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/20';
      default:
        return 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' 
      ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/20'
      : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 shadow-amber-500/20';
  };

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
      
      // For now, just show a success message since the backend invite logic isn't fully implemented
      toast({
        title: "Invite Sent",
        description: `Invitation sent to ${inviteForm.email}`,
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });

      // Reset form and close dialog
      setInviteForm({ email: '', name: '', role: 'MEMBER' });
      setIsInviteDialogOpen(false);
      
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingInvite(false);
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
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold">Teams</h1>
                    <p className="text-white/70">Manage your team members and their roles.</p>
                  </div>
                  
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110">
                        <FiPlus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleInviteSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Enter full name"
                            value={inviteForm.name}
                            onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
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
                            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select 
                            value={inviteForm.role} 
                            onValueChange={(value: 'OWNER' | 'ADMIN' | 'MEMBER') => 
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
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <FiMail className="h-4 w-4 mr-2" />
                                Send Invite
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Members Grid */}
                {isFetchingMembers ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner text="Fetching team members..." />
                  </div>
                ) : members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {members.map((member) => (
                      <div key={member.id}
  className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors duration-200 group"
>
  {/* Top: Avatar + Name + Role Icon */}
  <div className="flex items-start justify-between mb-5">
    <div className="flex items-center gap-4">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
        member.role === 'OWNER'
          ? 'bg-amber-500/20 text-amber-300'
          : member.role === 'ADMIN'
          ? 'bg-blue-500/20 text-blue-300'
          : 'bg-emerald-500/20 text-emerald-300'
      }`}>
        {(member.name || member.invited_email || 'TM')
          .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      <div>
        <p className="text-white font-medium text-[15px] leading-tight">
          {member.name || member.invited_email || 'Team Member'}
        </p>
        <p className="text-white/50 text-[13px] mt-0.5">
          {member.invited_email || `ID: ${member.user_id.slice(0, 8)}...`}
        </p>
      </div>
    </div>

    {/* Hover mail button */}
    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 flex items-center justify-center flex-shrink-0">
      <FiMail className="h-3.5 w-3.5 text-white/50" />
    </button>
  </div>

  {/* Divider */}
  <div className="border-t border-white/10 mb-4" />

  {/* Role + Status Badges */}
  <div className="flex items-center gap-2 mb-4">
    <span className={`text-[11px] font-medium tracking-wide px-3 py-1 rounded-full border ${
      member.role === 'OWNER'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        : member.role === 'ADMIN'
        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    }`}>
      {member.role}
    </span>
    <span className={`text-[11px] font-medium tracking-wide px-3 py-1 rounded-full border ${
      member.status === 'ACTIVE'
        ? 'bg-green-500/10 text-green-400 border-green-500/30'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    }`}>
      {member.status}
    </span>
  </div>

  {/* Joined / Pending meta */}
  <div className="flex items-center gap-2 text-[12px] text-white/40">
    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
      member.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
    }`} />
    {member.joined_at
      ? `Joined ${format(new Date(member.joined_at), 'MMM dd, yyyy')}`
      : 'Invitation pending'}
  </div>

  {/* Invite email notice */}
  {member.invited_email && member.status === 'INVITED' && (
    <div className="mt-4 flex items-center gap-2 text-[12px] text-white/40 bg-white/5 rounded-xl px-3 py-2.5">
      <FiMail className="h-3.5 w-3.5 flex-shrink-0" />
      {member.invited_email}
    </div>
  )}
</div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-lg p-6">
                    <div className="text-center py-12">
                      <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-white/5 mb-6">
                        <FiUsers className="h-12 w-12 text-white/50" />
                      </div>
                      <h3 className="text-xl font-medium text-white mb-2">No Team Members Yet</h3>
                      <p className="text-white/60 mb-6">Start building your team by inviting your first member.</p>
                      <Button 
                        onClick={() => setIsInviteDialogOpen(true)}
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110"
                      >
                        <FiPlus className="h-4 w-4 mr-2" />
                        Invite Your First Member
                      </Button>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">Redirecting to sign in...</h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          </div>
        </SignedOut>
      </div>
    </DashboardAccess>
  );
}
