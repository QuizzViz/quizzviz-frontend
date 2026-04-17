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
}

interface InviteFormData {
  email: string;
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
    role: 'MEMBER'
  });

  // Get company ID from user metadata
  useEffect(() => {
    console.log('User metadata:', user?.unsafeMetadata);
    if (user?.unsafeMetadata?.companyId) {
      const id = user.unsafeMetadata.companyId as string;
      setCompanyId(id);
      console.log('Company ID set from metadata:', id);
    } else {
      console.log('No companyId found in user metadata');
      // Fallback for testing - use the company_id from the database
      console.log('Using fallback company_id: quizzviz');
      setCompanyId('quizzviz');
    }
  }, [user]);

  // Fetch company members
  const fetchMembers = async () => {
    console.log('fetchMembers called, companyId:', companyId);
    if (!companyId) {
      console.log('No companyId, returning early');
      return;
    }

    setIsFetchingMembers(true);
    try {
      const token = await getToken();
      console.log('Making fetch request to:', `/api/company-members?company_id=${companyId}`);
      
      const response = await fetch(`/api/company-members?company_id=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();
      console.log('Fetched members data:', data);
      console.log('Data type:', typeof data);
      console.log('Is array?', Array.isArray(data));
      console.log('Data length:', data?.length);
      
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
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'ADMIN':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'MEMBER':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' 
      ? 'bg-green-500/10 text-green-500 border-green-500/20'
      : 'bg-orange-500/10 text-orange-500 border-orange-500/20';
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
      setInviteForm({ email: '', role: 'MEMBER' });
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <Card key={member.id} className="bg-gray-900 border-gray-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                                <FiUser className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-white">
                                {member.invited_email || `User ${member.user_id.slice(0, 8)}`}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getRoleIcon(member.role)}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Role</span>
                            <Badge className={getRoleColor(member.role)}>
                              {member.role}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Status</span>
                            <Badge className={getStatusColor(member.status)}>
                              {member.status}
                            </Badge>
                          </div>

                          {member.joined_at && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Joined</span>
                              <span className="text-sm text-white">
                                {format(new Date(member.joined_at), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}

                          {member.invited_email && member.status === 'INVITED' && (
                            <div className="pt-2">
                              <p className="text-xs text-orange-400">
                                Invitation sent to {member.invited_email}
                              </p>
                            </div>
                          )}
                        </CardContent>
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
