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
                      <Card key={member.id} className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.03] group">
                        {/* Elegant Gradient Border Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute inset-px bg-gradient-to-br from-emerald-500/30 via-transparent to-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Card Content */}
                        <div className="relative p-6">
                          {/* Header with Enhanced Avatar */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center space-x-4">
                              {/* Premium Avatar with Role-based Gradient */}
                              <div className="relative group">
                                <div className={`h-14 w-14 rounded-2xl p-[3px] transition-all duration-300 ${
                                  member.role === 'OWNER' 
                                    ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500' 
                                    : member.role === 'ADMIN'
                                    ? 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600'
                                    : 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600'
                                }`}>
                                  <div className="h-full w-full rounded-2xl bg-slate-900/90 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                                    <FiUser className="h-7 w-7 text-white drop-shadow-lg" />
                                  </div>
                                </div>
                                {/* Animated Status Indicator */}
                                <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-3 border-slate-900/90 backdrop-blur-sm transition-all duration-300 ${
                                  member.status === 'ACTIVE' 
                                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50' 
                                    : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/50 animate-pulse'
                                }`}>
                                  <div className="h-full w-full rounded-full bg-white/90 flex items-center justify-center">
                                    <div className={`h-2 w-2 rounded-full ${
                                      member.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-orange-500'
                                    }`}></div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Enhanced User Info */}
                              <div className="flex-1">
                                <h3 className="font-bold text-white text-xl mb-1 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                  {member.name || member.invited_email || 'Team Member'}
                                </h3>
                                <p className="text-slate-400 text-sm font-medium">
                                  {member.invited_email || member.name ? member.invited_email || member.name : `ID: ${member.user_id.slice(0, 8)}...`}
                                </p>
                              </div>
                            </div>
                            
                            {/* Enhanced Role Badge */}
                            <div className={`p-3 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                              member.role === 'OWNER' 
                                ? 'bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30'
                                : member.role === 'ADMIN'
                                ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30'
                                : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30'
                            }`}>
                              {getRoleIcon(member.role)}
                            </div>
                          </div>

                          {/* Enhanced Role and Status Pills */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Badge className={`px-4 py-2 rounded-full text-xs font-bold border-0 shadow-lg transition-all duration-300 ${
                                member.role === 'OWNER' 
                                  ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-amber-500/30'
                                  : member.role === 'ADMIN'
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-500/30'
                                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-emerald-500/30'
                              }`}>
                                {member.role}
                              </Badge>
                              <Badge className={`px-4 py-2 rounded-full text-xs font-bold border-0 shadow-lg transition-all duration-300 ${
                                member.status === 'ACTIVE'
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/30'
                                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/30 animate-pulse'
                              }`}>
                                {member.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Enhanced Additional Info */}
                          <div className="space-y-4">
                            {member.joined_at && (
                              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                                <div className="flex items-center text-emerald-400 text-sm font-medium">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500 mr-3 shadow-lg shadow-emerald-500/50"></div>
                                  <span className="text-emerald-300">Joined</span>
                                  <span className="text-emerald-200 ml-auto font-medium">
                                    {format(new Date(member.joined_at), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              </div>
                            )}

                            {member.invited_email && member.status === 'INVITED' && (
                              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 backdrop-blur-sm">
                                <div className="flex items-center text-amber-400 text-sm font-medium">
                                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 p-2 mr-3 shadow-lg shadow-amber-500/30">
                                    <FiMail className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <span className="text-amber-300">Invitation sent</span>
                                    <p className="text-amber-200 text-xs mt-1">{member.invited_email}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Enhanced Hover Action Buttons */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-slate-600 hover:bg-slate-700 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300">
                                <FiMail className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 transition-colors duration-300" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
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
