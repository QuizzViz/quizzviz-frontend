"use client";

import { useEffect, useState, useRef } from "react";
import { useUser, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useCompanies } from "@/hooks/useCompanies";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  FiUsers, FiMail, FiPlus, FiRefreshCw,
  FiEdit, FiTrash, FiShield, FiStar, FiUser, FiCalendar,
  FiTrash2,
} from "react-icons/fi";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { UserRole, useUserRole, refreshUserRole } from "@/hooks/useUserRole";
import { canPerformAction, getActionAllowedRoles } from "@/utils/rolePermissions";
import { useCachedDashboardData } from "@/hooks/useCachedData";
import { generateCompanyId, validateCompanyData } from '@/utils/companyValidation';

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

// Helper component for disabled buttons with permission tooltip
const DisabledButtonWithTooltip = ({ 
  children, 
  permission, 
  allowedRoles,
  className = "",
  variant = "outline"
}: { 
  children: React.ReactNode; 
  permission: string; 
  allowedRoles: string; 
  className?: string;
  variant?: "outline" | "destructive" | "default" | "secondary" | "ghost" | "link";
}) => (
  <TooltipProvider>
    <ShadTooltip>
      <TooltipTrigger asChild>
        <Button 
          disabled 
          className={`opacity-50 cursor-not-allowed ${className}`}
          variant={variant}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">
          This action requires {allowedRoles} permissions.
        </p>
      </TooltipContent>
    </ShadTooltip>
  </TooltipProvider>
);

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
    Icon: FiStar,
    avatarGradient: "from-amber-500 to-orange-500",
    bannerBg: "bg-[#1a1007]",
    bannerGlow: "from-amber-500/20 via-transparent to-transparent",
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    label: "Owner",
  },
  ADMIN: {
    Icon: FiShield,
    avatarGradient: "from-violet-500 to-indigo-500",
    bannerBg: "bg-[#100c1a]",
    bannerGlow: "from-violet-500/20 via-transparent to-transparent",
    badgeClass: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    label: "Admin",
  },
  MEMBER: {
    Icon: FiUser,
    avatarGradient: "from-emerald-500 to-cyan-500",
    bannerBg: "bg-[#071a12]",
    bannerGlow: "from-emerald-500/20 via-transparent to-transparent",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    label: "Member",
  },
};

// ─── MemberCard ───────────────────────────────────────────────────────────────

function MemberCard({
  member,
  onEditRole,
  onDelete,
  userRole,
  dataLoading,
}: {
  member: CompanyMember;
  onEditRole: (m: CompanyMember) => void;
  onDelete: (id: string, name: string) => void;
  userRole: import("@/hooks/useUserRole").UserRole | null;
  dataLoading: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const config = roleConfig[member.role];
  const RoleIcon = config.Icon;
  const isActive = member.status === "ACTIVE";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="relative rounded-[18px] border border-white/[0.07] bg-[#0f1421] overflow-visible transition-all duration-200 hover:-translate-y-[3px] hover:border-white/[0.13] hover:shadow-[0_20px_48px_rgba(0,0,0,0.55)]">

      {/* Body */}
      <div className="px-[18px] pt-[18px] pb-[18px]">

        {/* Avatar + Name + menu */}
        <div className="flex items-center justify-between mb-[12px]">
          <div className="flex items-center gap-[12px] min-w-0 flex-1 pr-2">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className={`h-[42px] w-[42px] rounded-[12px] bg-gradient-to-br ${config.avatarGradient} flex items-center justify-center text-[13px] font-bold text-white tracking-wide`}
              >
                {getInitials(member.name, member.invited_email)}
              </div>
              <span
                className={`absolute -bottom-[2px] -right-[2px] h-[11px] w-[11px] rounded-full border-[2px] border-[#0f1421] ${
                  isActive ? "bg-green-400" : "bg-amber-400"
                }`}
              />
            </div>
            {/* Name */}
            <h3 className="text-[15px] font-bold text-[#eef2ff] tracking-[-0.2px] leading-snug truncate min-w-0">
              {member.name ?? member.invited_email ?? "Team Member"}
            </h3>
          </div>

          <div className="relative flex-shrink-0" ref={menuRef}>
            {/* Show 3 dots menu only for users with manage_roles permission (OWNER only) */}
            {!dataLoading && canPerformAction(userRole, 'manage_roles') && (
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={`h-[28px] w-[28px] rounded-[8px] border flex flex-col items-center justify-center gap-[2.5px] transition-all duration-100 ${
                  menuOpen
                    ? "bg-white/[0.09] border-white/[0.18]"
                    : "border-white/[0.1] hover:bg-white/[0.07] hover:border-white/[0.18]"
                }`}
                aria-label="Member actions"
              >
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block w-[3.5px] h-[3.5px] rounded-full bg-white/45" />
                ))}
              </button>
            )}

            {menuOpen && (
              <div className="absolute top-[34px] right-0 z-50 w-[172px] rounded-[13px] border border-white/10 bg-[#161c2a] overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.65)] animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="px-[14px] py-[8px] text-[10px] font-bold tracking-[0.8px] text-white/22 uppercase border-b border-white/[0.06]">
                  Actions
                </div>
                
                {/* Edit Role - using permission utility correctly */}
                {(() => {
                  const hasManagePermission = !dataLoading && canPerformAction(userRole, 'manage_roles');
                  const canEditTargetRole = userRole?.role === 'OWNER' || 
                    (userRole?.role === 'ADMIN' && member.role !== 'OWNER');
                  const canEdit = hasManagePermission && canEditTargetRole;
                  
                  return canEdit ? (
                    <button
                      onClick={() => { onEditRole(member); setMenuOpen(false); }}
                      className="w-full flex items-center gap-[10px] px-[14px] py-[9px] text-[13px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors text-left"
                    >
                      <FiEdit className="w-[15px] h-[15px] flex-shrink-0 opacity-65" />
                      Edit role
                    </button>
                  ) : (
                    <DisabledButtonWithTooltip
                      permission="manage_roles"
                      allowedRoles={getActionAllowedRoles('manage_roles')}
                      className="w-full"
                      variant="outline"
                    >
                      <FiEdit className="w-[15px] h-[15px] flex-shrink-0 opacity-65" />
                      Edit role
                    </DisabledButtonWithTooltip>
                  );
                })()}
                
                <div className="h-px bg-white/[0.06] my-[3px]" />
                
                {/* Delete Member - using permission utility correctly */}
                {(() => {
                  const hasDeletePermission = !dataLoading && canPerformAction(userRole, 'delete_company');
                  const canDeleteTargetRole = userRole?.role === 'OWNER' || 
                    (userRole?.role === 'ADMIN' && member.role !== 'OWNER');
                  const canDelete = hasDeletePermission && canDeleteTargetRole;
                  
                  return canDelete ? (
                    <button
                      onClick={() => {
                        onDelete(member.id, member.name ?? member.invited_email ?? "member");
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-[10px] px-[14px] py-[9px] text-[13px] text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.1] transition-colors text-left"
                    >
                      <FiTrash2 className="w-[15px] h-[15px] flex-shrink-0 opacity-65" />
                      Delete member
                    </button>
                  ) : (
                    <DisabledButtonWithTooltip
                      permission="delete_company"
                      allowedRoles={getActionAllowedRoles('delete_company')}
                      className="w-full"
                      variant="destructive"
                    >
                      <FiTrash2 className="w-[15px] h-[15px] flex-shrink-0 opacity-65" />
                      Delete member
                    </DisabledButtonWithTooltip>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <p className="text-[11px] text-white/30 truncate mb-[13px] pl-[54px]">
          {member.invited_email ?? "—"}
        </p>

        {/* Badges */}
        <div className="flex items-center gap-[6px] flex-wrap mb-[14px]">
          <span className={`inline-flex items-center gap-[5px] text-[11px] font-semibold px-[9px] py-[4px] rounded-[8px] border ${config.badgeClass}`}>
            <RoleIcon className="w-[10px] h-[10px]" />
            {config.label}
          </span>
          <span className={`text-[11px] font-semibold px-[9px] py-[4px] rounded-[8px] border ${
            isActive
              ? "bg-green-500/[0.08] text-green-300 border-green-500/[0.2]"
              : "bg-amber-500/[0.08] text-amber-300 border-amber-500/[0.2]"
          }`}>
            {isActive ? "Active" : "Invited"}
          </span>
        </div>

        <div className="h-px bg-white/[0.055] mb-[13px]" />

        {/* Meta */}
        <div className="space-y-[5px]">
          {member.joined_at && (
            <div className="flex items-center gap-[6px] text-[11px] text-white/28">
              <FiCalendar className="w-[11px] h-[11px] opacity-45 flex-shrink-0" />
              <span>Joined</span>
              <span className="text-white/50">
                {new Date(member.joined_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </span>
            </div>
          )}
          {!isActive && member.invite_expires_at && (
            <div className="flex items-center gap-[6px] text-[11px] text-amber-400/65">
              <FiCalendar className="w-[11px] h-[11px] opacity-45 flex-shrink-0" />
              <span>Expires</span>
              <span>
                {new Date(member.invite_expires_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TeamsPage ────────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  
  // For member users, get company ID from metadata or stored data
  const getCompanyIdForMember = (): string | undefined => {
    // Try user metadata first (for invited members who have it stored)
    const metadataCompanyId = user?.unsafeMetadata?.companyId as string | undefined;
    if (metadataCompanyId) return metadataCompanyId;

    // Try sessionStorage
    if (typeof window !== 'undefined') {
      const sessionCompanyId = sessionStorage.getItem('userCompanyId');
      if (sessionCompanyId) return sessionCompanyId;

      // Try localStorage
      const localCompanyId = localStorage.getItem('userCompanyId');
      if (localCompanyId) return localCompanyId;
    }

    return undefined;
  };

  const companyIdForMember: string | undefined = getCompanyIdForMember();
  
  // Use the new caching system
  const { 
    members: cachedMembers, 
    userRole, 
    company, 
    loading: dataLoading, 
    refreshAll 
  } = useCachedDashboardData(user?.id || '', companyIdForMember, async () => {
    const token = await getToken();
    return token || '';
  const [members, setMembers] = useState<CompanyMember[]>(cachedMembers || []);
  const { toast } = useToast();

  // Update members when cached data changes
  useEffect(() => {
    if (cachedMembers) {
      setMembers(cachedMembers);
    }
  }, [cachedMembers]);

  // Check if current user has been deleted and force logout
  useEffect(() => {
    const checkForDeletedUser = async () => {
      if (user?.id && companyIdForMember) {
        try {
          const token = await getToken();
          if (token) {
            // Check if user is still a valid member
            const response = await fetch(`/api/company-members/role?user_id=${user.id}&company_id=${companyIdForMember}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.status === 410) {
              console.log('User has been deleted from company, forcing logout');
              // Clear all stored data
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('userCompanyId');
                localStorage.removeItem('userCompanyId');
                sessionStorage.removeItem('userRole');
                localStorage.removeItem('userRole');
              }
              
              // Sign out and redirect
              const { signOut } = useAuth();
              if (signOut) {
                await signOut();
                router.push('/?message=deleted');
              }
            }
          }
        } catch (error) {
          console.error('Error checking user deletion status:', error);
        }
      }
    };

    // Check immediately and then every 30 seconds
    checkForDeletedUser();
    const interval = setInterval(checkForDeletedUser, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id, companyIdForMember, getToken, router, useAuth]);

  // Debug logging
  console.log('Teams page - User ID:', user?.id);
  console.log('Teams page - Company from useCompanies:', company);
  console.log('Teams page - User metadata:', user?.unsafeMetadata);
  console.log('Teams page - User metadata companyId:', user?.unsafeMetadata?.companyId);
  console.log('Teams page - SessionStorage companyId:', typeof window !== 'undefined' ? sessionStorage.getItem('userCompanyId') : 'N/A');
  console.log('Teams page - LocalStorage companyId:', typeof window !== 'undefined' ? localStorage.getItem('userCompanyId') : 'N/A');
  console.log('Teams page - Company ID being passed to useUserRole:', company?.company_id);
  console.log('Teams page - Company ID from getCompanyIdForMember:', companyIdForMember);
  console.log('Teams page - Company ID type:', typeof company?.company_id);
  console.log('Teams page - Company ID length:', company?.company_id?.length);
  console.log('Teams page - User role:', userRole);
  console.log('Teams page - Role loading:', dataLoading);
  console.log('Teams page - User role role value:', userRole?.role);
  console.log('Teams page - Company ID:', company?.company_id);
  // Detailed permission debugging
  const canInvite = canPerformAction(userRole, 'invite_members');
  const canManage = canPerformAction(userRole, 'manage_roles');
  const canDelete = canPerformAction(userRole, 'delete_company');
  
  // Debug the permission utility directly
  console.log('Teams page - Direct permission checks:', {
    userRole: userRole,
    userRoleString: JSON.stringify(userRole),
    userRoleRole: userRole?.role,
    canInvite: canInvite,
    canManage: canManage,
    canDelete: canDelete,
    dataLoading: dataLoading
  });
  
  // More conservative fallback: only assume OWNER if user email matches company owner email
  const fallbackRole = !userRole && company?.company_id && user?.id && 
    company?.owner_email && user?.primaryEmailAddress?.emailAddress === company.owner_email ? {
    id: `fallback_${user.id}_${company.company_id}`,
    user_id: user.id,
    company_id: company.company_id,
    role: 'OWNER' as const,
    status: 'ACTIVE' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : userRole;
  
  const effectiveRole = userRole || fallbackRole;
  const effectiveCanInvite = canPerformAction(effectiveRole, 'invite_members');
  const effectiveCanManage = canPerformAction(effectiveRole, 'manage_roles');
  const effectiveCanDelete = canPerformAction(effectiveRole, 'delete_company');
  
  console.log('Teams page - Permission check details:', {
    userRole: userRole,
    userRoleExists: !!userRole,
    userRoleRole: userRole?.role,
    dataLoading,
    canInvite,
    canManage,
    canDelete,
    shouldShowInviteButton: !dataLoading && canInvite
  });
  
  // Additional debugging for role fetching
  useEffect(() => {
    console.log('useUserRole hook state changed:', {
      userRole,
      dataLoading,
      companyId: company?.company_id,
      userId: user?.id
    });
  }, [userRole, dataLoading, company?.company_id, user?.id]);

  // Force role refresh on component mount if role is null
  useEffect(() => {
    if (!dataLoading && !userRole && company?.company_id && user?.id) {
      console.log('Role is null, checking for stored roles before creating fallback...');
      
      // First, check if we have any stored roles to restore
      let shouldCreateFallback = true;
      if (typeof window !== 'undefined') {
        try {
          const sessionStorageRole = sessionStorage.getItem('userRole');
          const localStorageRole = localStorage.getItem('userRole');
          const storedRole = sessionStorageRole || localStorageRole;
          
          if (storedRole) {
            const tempRole = JSON.parse(storedRole);
            console.log('Found stored role:', tempRole.role);
            // Restore the stored role
            sessionStorage.setItem('userRole', JSON.stringify(tempRole));
            sessionStorage.setItem('userCompanyId', company.company_id);
            localStorage.setItem('userRole', JSON.stringify(tempRole));
            localStorage.setItem('userCompanyId', company.company_id);
            shouldCreateFallback = false;
            
            // Force refresh to pick up the stored role
            setTimeout(() => {
              window.dispatchEvent(new Event('storage'));
            }, 50);
          }
        } catch (e) {
          console.error('Error checking stored roles:', e);
        }
      }
      
      // Only create fallback if no stored roles found
      if (shouldCreateFallback) {
        console.log('No stored roles found, checking if user is company owner...');
        
        // Check if user is likely the company owner
        const isLikelyOwner = company?.owner_email && user?.primaryEmailAddress?.emailAddress === company.owner_email;
        console.log('User email:', user?.primaryEmailAddress?.emailAddress);
        console.log('Company owner email:', company?.owner_email);
        console.log('Is likely owner:', isLikelyOwner);
        
        if (isLikelyOwner) {
          console.log('User is likely owner, setting temporary OWNER role as fallback');
          const tempOwnerRole = {
            id: `temp_${user.id}_${company.company_id}`,
            user_id: user.id,
            company_id: company.company_id,
            role: 'OWNER' as const,
            status: 'ACTIVE' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          // Store temporary role in both sessionStorage and localStorage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('userRole', JSON.stringify(tempOwnerRole));
            sessionStorage.setItem('userCompanyId', company.company_id);
            localStorage.setItem('userRole', JSON.stringify(tempOwnerRole));
            localStorage.setItem('userCompanyId', company.company_id);
            console.log('Temporary OWNER role stored in both sessionStorage and localStorage');
          }
          
          // Force refresh to pick up the temporary role
          setTimeout(() => {
            window.dispatchEvent(new Event('storage'));
          }, 50);
        } else {
          console.log('User is not owner, no fallback role will be set');
        }
      }
      return;
    }
  }, [dataLoading, userRole, company?.company_id, company?.owner_email, user?.id, user?.primaryEmailAddress?.emailAddress]);

  // Invite dialog
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: "", name: "", role: "MEMBER",
  });

  // Edit role dialog
  const [editingMember, setEditingMember] = useState<CompanyMember | null>(null);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  // ── Company ID ──────────────────────────────────────────────────────────────// Simple loading state management
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/signin");
    } else if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded, user, router]);

  // ── Refresh members and role using cache ──────────────────────────────────
  const refreshMembersAndRole = async () => {
    console.log('🔄 Refreshing members and role using cache system...');
    setIsFetchingMembers(true);
    
    try {
      await refreshAll();
      setMembers(cachedMembers || []);
      
      toast({
        title: "Refreshed", 
        description: "Team members and permissions updated",
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });
      
    } catch (error) {
      console.error("Error refreshing:", error);
      toast({
        title: "Error",
        description: "Failed to refresh team members",
        variant: "destructive",
      });
    } finally {
      setIsFetchingMembers(false);
    }
  };

  // ── Invite ──────────────────────────────────────────────────────────────────
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
      return;
    }
    // Validate role permissions before sending invite
    if (userRole?.role === 'ADMIN' && inviteForm.role === 'OWNER') {
      toast({
        title: "Permission Denied",
        description: "Admin users can only invite Admin and Member roles. Only Owners can invite other Owners.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const token = await getToken();
      // Validate company data before sending invite
      const validation = validateCompanyData({
        company_id: company?.company_id,
        company_name: user?.unsafeMetadata?.companyName || company?.name || "Your Company",
        name: inviteForm.name,
        invited_email: inviteForm.email,
        role: inviteForm.role
      });
      
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/company-members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          company_id: company?.company_id,
          company_name: user?.unsafeMetadata?.companyName || company?.name || "Your Company",
          name: inviteForm.name,
          invited_email: inviteForm.email,
          role: inviteForm.role,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to send invitation");
      }
      toast({
        title: "Invite Sent!",
        description: `Invitation sent to ${inviteForm.email}`,
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });
      setInviteForm({ email: "", name: "", role: "MEMBER" });
      setIsInviteDialogOpen(false);
      refreshMembersAndRole();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // ── Edit Role ───────────────────────────────────────────────────────────────
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    // Validate role permissions before updating
    if (userRole?.role === 'ADMIN' && editingMember.role === 'OWNER') {
      toast({
        title: "Permission Denied",
        description: "Admin users can only assign Admin and Member roles. Only Owners can assign Owner roles.",
        variant: "destructive",
      });
      return;
    }

    // Prevent ADMIN from changing OWNER's role
    if (userRole?.role === 'ADMIN' && editingMember.role === 'OWNER') {
      toast({
        title: "Permission Denied",
        description: "Admin users cannot modify Owner roles. Only Owners can modify Owner roles.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingRole(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/company-members/${editingMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          role: editingMember.role,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update role");
      }
      toast({
        title: "Role Updated",
        description: `Role updated for ${editingMember.name}`,
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });
      
      // Force refresh the role cache to ensure immediate updates across all components
      if (user?.id && company?.company_id) {
        const tokenForRefresh = await getToken();
        if (tokenForRefresh) {
          await refreshUserRole(user.id, company.company_id, async () => tokenForRefresh);
        }
      }
      
      refreshMembersAndRole();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsSavingRole(false);
      setIsEditRoleOpen(false);
    }
  };

  // ── Delete Member ───────────────────────────────────────────────────────────
  const promptDeleteMember = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;

    setIsDeletingMember(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`/api/company-members/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete member");
      }
      
      // Immediately remove the member from the UI
      setMembers(prev => prev.filter(member => member.id !== deleteTarget.id));
      
      toast({
        title: "Member Removed",
        description: `Removed ${deleteTarget.name} from team`,
        className: "border-red-600/60 bg-red-700 text-red-100 shadow-lg shadow-red-600/30",
      });
      
      // Force refresh the role cache to ensure immediate updates across all components
      if (user?.id && company?.company_id) {
        await refreshUserRole(user.id, company.company_id, getToken);
      }
      
      refreshMembersAndRole();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete member",
        variant: "destructive",
      });
    } finally {
      setIsDeletingMember(false);
      setDeleteTarget(null);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            <div className="bg-white border-r border-white"><DashboardSideBar /></div>
            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 p-6"><LoadingSpinner text="Loading teams..." /></main>
            </div>
          </div>
        </SignedIn>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardAccess>
      <Head>
        <title>Teams | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Manage your teams and collaborate with others." />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            <div className="bg-white border-r border-white"><DashboardSideBar /></div>

            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 p-6 space-y-6">

                {/* Page header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
                    <p className="text-white/40 text-sm mt-1">
                      Manage your team members and their roles.
                    </p>
                    
                    {/* Member count pill */}
                    {!isFetchingMembers && members.length > 0 && (
                      <div className="inline-flex items-center gap-2 text-xs text-white/40 bg-white/[0.05] mt-4 border border-white/[0.08] rounded-full px-3 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 block mr-1" />
                        {members.length} member{members.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  {/* ── FIX: right-side controls wrapper ── */}
                  <div className="flex items-center gap-3">

                    {/* Invite Member - using permission utility */}
                    {(!dataLoading && canPerformAction(userRole, 'invite_members')) ? (
                      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-xl">
                            <FiPlus className="h-4 w-4" />
                            Invite Member
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#161c2a] border border-white/10 text-white rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.7)] max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-[17px] font-bold text-[#f0f4ff]">
                              Invite Team Member
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleInviteSubmit} className="space-y-4 pt-1">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-[12px] font-bold tracking-[0.5px] text-white/40 uppercase">
                                Name
                              </Label>
                              <Input
                                id="name"
                                type="text"
                                placeholder="Enter full name"
                                value={inviteForm.name}
                                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                                className="bg-white/[0.05] border border-white/[0.12] text-white/70 hover:bg-white/[0.09] rounded-[11px] h-[42px]"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-[12px] font-bold tracking-[0.5px] text-white/40 uppercase">
                                Email
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="Enter email address"
                                value={inviteForm.email}
                                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                className="bg-white/[0.05] border border-white/[0.12] text-white/70 hover:bg-white/[0.09] rounded-[11px] h-[42px]"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="role" className="text-[12px] font-bold tracking-[0.5px] text-white/40 uppercase">
                                Role
                              </Label>
                              <Select
                                value={inviteForm.role}
                                onValueChange={(value: "OWNER" | "ADMIN" | "MEMBER") =>
                                  setInviteForm({ ...inviteForm, role: value })
                                }
                              >
                                <SelectTrigger className="bg-white/[0.05] text-[#eef2ff] rounded-[11px] h-[42px] border focus:border-none border-none focus:outline-none focus:ring-0 focus-visible:outline-none border-0 outline-none">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1e2535] border-white/10 text-white rounded-[13px]">
                                  <SelectItem value="MEMBER">Member</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                  {/* Only OWNER can invite other OWNERS */}
                                  {!dataLoading && userRole?.role === 'OWNER' && (
                                    <SelectItem value="OWNER">Owner</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-[10px] pt-2">
                              <Button
                                type="button"
                                onClick={() => { setIsInviteDialogOpen(false); setInviteForm({ email: "", name: "", role: "MEMBER" }); }}
                                className="flex-1 bg-white/[0.05] border border-white/[0.12] text-white/70 hover:bg-white/[0.09] rounded-[11px] h-[42px]"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={isSubmittingInvite}
                                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 rounded-[11px] h-[42px] font-semibold"
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
                    ) : (
                      <DisabledButtonWithTooltip
                        permission="invite_members"
                        allowedRoles={getActionAllowedRoles('invite_members')}
                      >
                        <FiPlus className="h-4 w-4" />
                        Invite Member
                      </DisabledButtonWithTooltip>
                    )}

                    {/* Refresh */}
                    <Button
                      onClick={refreshMembersAndRole}
                      disabled={isFetchingMembers}
                      className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 flex items-center gap-2 px-4 py-2 rounded-xl"
                    >
                      <FiRefreshCw className={`h-4 w-4 ${isFetchingMembers ? "animate-spin" : ""}`} />
                      {isFetchingMembers ? "Refreshing..." : "Refresh"}
                    </Button>

                  </div>
                  {/* ── END right-side controls wrapper ── */}

                </div>
                {/* ── END Page header ── */}

                {/* Members grid */}
                {isFetchingMembers ? (
                  <div className="flex items-center justify-center py-20">
                    <LoadingSpinner text="Fetching team members..." />
                  </div>
                ) : members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[14px]">
                    {members.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        onEditRole={(m) => { setEditingMember(m); setIsEditRoleOpen(true); }}
                        onDelete={promptDeleteMember}
                        userRole={userRole}
                        dataLoading={dataLoading}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="h-20 w-20 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-5">
                      <FiUsers className="h-9 w-9 text-white/25" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No team members yet</h3>
                    <p className="text-white/35 text-sm mb-6">
                      Start building your team by inviting your first member.
                    </p>
                    <Button
                      onClick={() => setIsInviteDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl"
                    >
                      <FiPlus className="h-4 w-4" />
                      Invite your first member
                    </Button>
                  </div>
                )}

              </main>
            </div>
          </div>
        </SignedIn>

        {/* ── Edit Role Dialog ──────────────────────────────────────────────── */}
        <Dialog open={isEditRoleOpen} onOpenChange={(open) => { if (!open) { setIsEditRoleOpen(false); setEditingMember(null); } }}>
          <DialogContent className="bg-[#161c2a] border border-white/10 text-white rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.7)] max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-[17px] font-bold text-[#f0f4ff]">Edit role</DialogTitle>
            </DialogHeader>
            {editingMember && (
              <form onSubmit={handleSaveRole} className="space-y-4 pt-1">
                {/* Member preview */}
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-white/[0.04] border border-white/[0.07]">
                  <div
                    className={`h-[36px] w-[36px] rounded-[10px] bg-gradient-to-br ${roleConfig[editingMember.role].avatarGradient} flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0`}
                  >
                    {getInitials(editingMember.name, editingMember.invited_email)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white/85 truncate">
                      {editingMember.name ?? editingMember.invited_email ?? "Team Member"}
                    </p>
                    <p className="text-[11px] text-white/35 truncate">
                      {editingMember.invited_email ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-[12px] font-bold tracking-[0.5px] text-white/40 uppercase">
                    Role
                  </Label>
                  <Select
                    value={editingMember.role}
                    onValueChange={(value: "OWNER" | "ADMIN" | "MEMBER") =>
                      setEditingMember({ ...editingMember, role: value })
                    }
                  >
                    <SelectTrigger className="bg-white/[0.05] text-[#eef2ff] rounded-[11px] h-[42px] border focus:border-none border-none focus:outline-none focus:ring-0 focus-visible:outline-none border-0 outline-none">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e2535] border-white/10 text-white rounded-[13px]">
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      {/* Only OWNER can assign OWNER role */}
                      {!dataLoading && userRole?.role === 'OWNER' && (
                        <SelectItem value="OWNER">Owner</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-[10px] pt-2">
                  <Button
                    type="button"
                    onClick={() => { setIsEditRoleOpen(false); setEditingMember(null); }}
                    className="flex-1 bg-white/[0.05] border border-white/[0.12] text-white/70 hover:bg-white/[0.09] rounded-[11px] h-[42px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingRole}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 rounded-[11px] h-[42px] font-semibold"
                  >
                    {isSavingRole ? (
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
            )}
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <DialogContent className="bg-[#161c2a] border border-white/10 text-white rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.7)] max-w-sm">
            <div className="flex flex-col items-center text-center pt-2 pb-1">
              {/* Trash icon */}
              <div className="w-[52px] h-[52px] rounded-[14px] bg-red-500/[0.12] border border-red-500/[0.22] flex items-center justify-center mb-[18px]">
                <FiTrash className="w-[22px] h-[22px] text-red-400" />
              </div>
              <h3 className="text-[17px] font-bold text-[#f0f4ff] mb-[8px]">Remove member?</h3>
              <p className="text-[13px] text-white/45 leading-[1.55] mb-[24px]">
                This will remove{" "}
                <span className="text-white/75 font-semibold">{deleteTarget?.name}</span>
                {" "}from your team. They'll lose access immediately.
              </p>
              <div className="flex w-full gap-[10px]">
                <Button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeletingMember}
                  className="flex-1 bg-white/[0.05] border border-white/[0.12] text-white/70 hover:bg-white/[0.09] rounded-[11px] h-[42px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteMember}
                  disabled={isDeletingMember}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white hover:brightness-110 rounded-[11px] h-[42px] font-semibold"
                >
                  {isDeletingMember ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Removing...
                    </>
                  ) : (
                    "Remove"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <SignedOut>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-xl font-semibold mb-4 text-white">Redirecting to sign in...</h1>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
            </div>
          </div>
        </SignedOut>
      </div>
    </DashboardAccess>
  );
}