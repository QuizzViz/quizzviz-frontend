// "use client";

// import { useEffect, useState } from "react";
// import { useUser, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
// import { useRouter } from "next/router";
// import Head from "next/head";
// import { FiUsers, FiMail, FiPlus, FiRefreshCw, FiEdit, FiTrash, FiShield, FiStar, FiUser } from "react-icons/fi";
// import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
// import { DashboardHeader } from "@/components/Dashboard/Header";
// import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
// import { LoadingSpinner } from "@/components/ui/loading";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useToast } from "@/hooks/use-toast";
// import { useUserRole } from "@/hooks/useUserRole";

// interface CompanyMember {
//   id: string;
//   user_id: string;
//   company_id: string;
//   role: "OWNER" | "ADMIN" | "MEMBER";
//   status: "ACTIVE" | "INVITED";
//   invite_token?: string | null;
//   invited_email?: string | null;
//   invite_expires_at?: string | null;
//   joined_at?: string | null;
//   created_at: string;
//   updated_at: string;
//   name?: string | null;
// }

// interface InviteFormData {
//   email: string;
//   name: string;
//   role: "OWNER" | "ADMIN" | "MEMBER";
// }

// function getInitials(name?: string | null, email?: string | null): string {
//   const source = name?.trim() || email?.trim();
//   if (!source) return "TM";
//   const parts = source.split(/\s+/).filter(Boolean);
//   if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
//   return (parts[0][0] + parts[1][0]).toUpperCase();
// }

// const roleConfig = {
//   OWNER: {
//     icon: FiStar,
//     gradient: "from-amber-400 to-orange-500",
//     badge: "bg-amber-500/15 text-amber-300 border-amber-500/25",
//     glow: "shadow-amber-500/10",
//     label: "Owner",
//   },
//   ADMIN: {
//     icon: FiShield,
//     gradient: "from-violet-400 to-indigo-500",
//     badge: "bg-violet-500/15 text-violet-300 border-violet-500/25",
//     glow: "shadow-violet-500/10",
//     label: "Admin",
//   },
//   MEMBER: {
//     icon: FiUser,
//     gradient: "from-emerald-400 to-cyan-500",
//     badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
//     glow: "shadow-emerald-500/10",
//     label: "Member",
//   },
// };

// export default function TeamsPage() {
//   const { user, isLoaded } = useUser();
//   const { getToken } = useAuth();
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(true);
//   const [members, setMembers] = useState<CompanyMember[]>([]);
//   const [isFetchingMembers, setIsFetchingMembers] = useState(false);
//   const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
//   const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
//   const [editingMember, setEditingMember] = useState<CompanyMember | null>(null);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [companyId, setCompanyId] = useState<string>("");
//   const { userRole } = useUserRole(companyId);
//   const { toast } = useToast();
//   const [inviteForm, setInviteForm] = useState<InviteFormData>({
//     email: "",
//     name: "",
//     role: "MEMBER",
//   });

//   useEffect(() => {
//     const metadataCompanyId = user?.unsafeMetadata?.companyId;
//     const localStorageCompanyId =
//       typeof window !== "undefined" ? localStorage.getItem("userCompanyId") : null;

//     if (metadataCompanyId) {
//       setCompanyId(metadataCompanyId as string);
//     } else if (localStorageCompanyId) {
//       setCompanyId(localStorageCompanyId);
//     } else {
//       setCompanyId("quizzviz");
//     }
//   }, [user]);

//   const fetchMembers = async () => {
//     if (!companyId) return;
//     setIsFetchingMembers(true);
//     try {
//       const token = await getToken();
//       const response = await fetch(
//         `/api/company-members?company_id=${companyId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (!response.ok) throw new Error("Failed to fetch members");
//       const data = await response.json();
//       setMembers(data);
//     } catch (error) {
//       console.error("Error fetching members:", error);
//       toast({
//         title: "Error",
//         description: "Failed to fetch team members",
//         variant: "destructive",
//       });
//     } finally {
//       setIsFetchingMembers(false);
//     }
//   };

//   useEffect(() => {
//     if (companyId) fetchMembers();
//   }, [companyId]);

//   useEffect(() => {
//     if (isLoaded && !user) router.push("/signin");
//     else if (isLoaded) setIsLoading(false);
//   }, [isLoaded, user, router]);

//   const handleInviteSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!inviteForm.email.trim()) {
//       toast({
//         title: "Error",
//         description: "Please enter an email address",
//         variant: "destructive",
//       });
//       return;
//     }
//     setIsSubmittingInvite(true);
//     try {
//       const token = await getToken();
//       const companyName = user?.unsafeMetadata?.companyName || "QuizzViz";

//       const response = await fetch("/api/company-members/invite", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           company_id: companyId,
//           company_name: companyName,
//           name: inviteForm.name,
//           invited_email: inviteForm.email,
//           role: inviteForm.role,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to send invitation");
//       }

//       toast({
//         title: "Invite Sent Successfully!",
//         description: `Invitation sent to ${inviteForm.email}`,
//         className:
//           "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
//       });

//       setInviteForm({ email: "", name: "", role: "MEMBER" });
//       setIsInviteDialogOpen(false);
//       fetchMembers();
//     } catch (error) {
//       console.error("Error sending invite:", error);
//       toast({
//         title: "Error",
//         description:
//           error instanceof Error ? error.message : "Failed to send invitation",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSubmittingInvite(false);
//     }
//   };

//   const handleUpdateMember = async (
//     memberId: string,
//     updates: Partial<CompanyMember>
//   ) => {
//     try {
//       const token = await getToken();
//       const response = await fetch(`/api/company-members/${memberId}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(updates),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to update member");
//       }

//       toast({
//         title: "Member Updated Successfully!",
//         description: `Updated ${updates.name || "member"}'s information`,
//         className:
//           "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
//       });

//       fetchMembers();
//       setIsEditDialogOpen(false);
//       setEditingMember(null);
//     } catch (error) {
//       console.error("Error updating member:", error);
//       toast({
//         title: "Error",
//         description:
//           error instanceof Error ? error.message : "Failed to update member",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleDeleteMember = async (memberId: string, memberName: string) => {
//     try {
//       const token = await getToken();
//       const response = await fetch(`/api/company-members/${memberId}`, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to delete member");
//       }

//       toast({
//         title: "Member Removed",
//         description: `Removed ${memberName} from the team`,
//         className:
//           "border-red-600/60 bg-red-700 text-red-100 shadow-lg shadow-red-600/30",
//       });

//       fetchMembers();
//     } catch (error) {
//       console.error("Error deleting member:", error);
//       toast({
//         title: "Error",
//         description:
//           error instanceof Error ? error.message : "Failed to delete member",
//         variant: "destructive",
//       });
//     }
//   };

//   if (isLoading || !isLoaded) {
//     return (
//       <div className="min-h-screen bg-black text-white">
//         <SignedIn>
//           <div className="flex min-h-screen">
//             <div className="bg-white border-r border-white">
//               <DashboardSideBar />
//             </div>
//             <div className="flex-1 flex flex-col">
//               <DashboardHeader />
//               <main className="flex-1 p-6">
//                 <LoadingSpinner text="Loading teams..." />
//               </main>
//             </div>
//           </div>
//         </SignedIn>
//       </div>
//     );
//   }

//   return (
//     <DashboardAccess>
//       <Head>
//         <title>Teams | QuizzViz</title>
//         <link rel="icon" href="/favicon.ico" />
//         <meta
//           name="description"
//           content="Manage your teams and collaborate with others."
//         />
//       </Head>

//       <div className="min-h-screen bg-black text-white">
//         <SignedIn>
//           <div className="flex min-h-screen">
//             {/* Sidebar */}
//             <div className="bg-white border-r border-white">
//               <DashboardSideBar />
//             </div>

//             {/* Main content */}
//             <div className="flex-1 flex flex-col">
//               <DashboardHeader />
//               <main className="flex-1 p-6 space-y-8">

//                 {/* Page Header */}
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
//                     <p className="text-white/50 text-sm mt-1">
//                       Manage your team members and their roles.
//                     </p>
//                   </div>

//                   <div className="flex items-center gap-3">
//                     {/* Refresh — now green gradient (was blue) */}
//                     <Button
//                       onClick={fetchMembers}
//                       className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 px-4 py-2 rounded-lg flex items-center"
//                       disabled={isFetchingMembers}
//                     >
//                       <FiRefreshCw className={`h-4 w-4 mr-2 ${isFetchingMembers ? "animate-spin" : ""}`} />
//                       Refresh
//                     </Button>

//                     {/* Invite Member — now solid blue (was green gradient) */}
//                     <Dialog
//                       open={isInviteDialogOpen}
//                       onOpenChange={setIsInviteDialogOpen}
//                     >
//                       <DialogTrigger asChild>
//                         <Button className="bg-blue-600 hover:bg-blue-700 text-white">
//                           <FiPlus className="h-4 w-4 mr-2" />
//                           Invite Member
//                         </Button>
//                       </DialogTrigger>
//                       <DialogContent className="bg-gray-900 border-gray-700 text-white">
//                         <DialogHeader>
//                           <DialogTitle>Invite Team Member</DialogTitle>
//                         </DialogHeader>
//                         <form
//                           onSubmit={handleInviteSubmit}
//                           className="space-y-4"
//                         >
//                           <div className="space-y-2">
//                             <Label htmlFor="name">Name</Label>
//                             <Input
//                               id="name"
//                               type="text"
//                               placeholder="Enter full name"
//                               value={inviteForm.name}
//                               onChange={(e) =>
//                                 setInviteForm({ ...inviteForm, name: e.target.value })
//                               }
//                               className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
//                               required
//                             />
//                           </div>
//                           <div className="space-y-2">
//                             <Label htmlFor="email">Email Address</Label>
//                             <Input
//                               id="email"
//                               type="email"
//                               placeholder="Enter email address"
//                               value={inviteForm.email}
//                               onChange={(e) =>
//                                 setInviteForm({ ...inviteForm, email: e.target.value })
//                               }
//                               className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
//                               required
//                             />
//                           </div>
//                           <div className="space-y-2">
//                             <Label htmlFor="role">Role</Label>
//                             <Select
//                               value={inviteForm.role}
//                               onValueChange={(value: "OWNER" | "ADMIN" | "MEMBER") =>
//                                 setInviteForm({ ...inviteForm, role: value })
//                               }
//                             >
//                               <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
//                                 <SelectValue placeholder="Select role" />
//                               </SelectTrigger>
//                               <SelectContent className="bg-gray-800 border-gray-700">
//                                 <SelectItem value="MEMBER">Member</SelectItem>
//                                 <SelectItem value="ADMIN">Admin</SelectItem>
//                                 <SelectItem value="OWNER">Owner</SelectItem>
//                               </SelectContent>
//                             </Select>
//                           </div>
//                           <div className="flex justify-end space-x-2 pt-4">
//                             <Button
//                               type="button"
//                               variant="outline"
//                               onClick={() => setIsInviteDialogOpen(false)}
//                               className="border-gray-600 text-white hover:bg-gray-800"
//                             >
//                               Cancel
//                             </Button>
//                             <Button
//                               type="submit"
//                               disabled={isSubmittingInvite}
//                               className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110"
//                             >
//                               {isSubmittingInvite ? (
//                                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
//                               ) : (
//                                 <FiMail className="h-4 w-4 mr-2" />
//                               )}
//                               {isSubmittingInvite ? "Sending..." : "Send Invite"}
//                             </Button>
//                           </div>
//                         </form>
//                       </DialogContent>
//                     </Dialog>
//                   </div>
//                 </div>

//                 {/* Members Grid */}
//                 {isFetchingMembers ? (
//                   <div className="flex items-center justify-center py-12">
//                     <LoadingSpinner text="Fetching team members..." />
//                   </div>
//                 ) : members.length > 0 ? (
//                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
//                     {members.map((member) => {
//                       const config = roleConfig[member.role];
//                       const RoleIcon = config.icon;
//                       return (
//                         <div
//                           key={member.id}
//                           className={`group relative bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-300 hover:shadow-xl ${config.glow}`}
//                         >
//                           {/* Subtle top accent line based on role */}
//                           <div className={`h-0.5 w-full bg-gradient-to-r ${config.gradient} opacity-60`} />

//                           <div className="p-5">
//                             {/* Top row: Avatar + Name + Mail icon */}
//                             <div className="flex items-start gap-4 mb-5">
//                               {/* Avatar */}
//                               <div className="relative flex-shrink-0">
//                                 <div
//                                   className={`h-12 w-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-sm font-bold text-white shadow-md`}
//                                 >
//                                   {getInitials(member.name, member.invited_email)}
//                                 </div>
//                                 {/* Online/active indicator */}
//                                 {member.status === "ACTIVE" && (
//                                   <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
//                                 )}
//                               </div>

//                               {/* Name & email */}
//                               <div className="flex-1 min-w-0">
//                                 <h3 className="text-white font-semibold text-base leading-snug truncate">
//                                   {member.name ?? member.invited_email ?? "Team Member"}
//                                 </h3>
//                                 {member.invited_email && member.name && (
//                                   <p className="text-white/40 text-xs mt-0.5 truncate">
//                                     {member.invited_email}
//                                   </p>
//                                 )}
//                               </div>

//                               {/* Mail button */}
//                               <button className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 flex items-center justify-center flex-shrink-0">
//                                 <FiMail className="h-3.5 w-3.5 text-white/40" />
//                               </button>
//                             </div>

//                             {/* Role + Status badges */}
//                             <div className="flex items-center gap-2 mb-5">
//                               <span
//                                 className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${config.badge}`}
//                               >
//                                 <RoleIcon className="h-3 w-3" />
//                                 {config.label}
//                               </span>
//                               <span
//                                 className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
//                                   member.status === "ACTIVE"
//                                     ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
//                                     : "bg-amber-500/10 text-amber-400 border-amber-500/20"
//                                 }`}
//                               >
//                                 {member.status === "ACTIVE" ? "Active" : "Invited"}
//                               </span>
//                             </div>

//                             {/* Meta info */}
//                             <div className="text-xs text-white/30 space-y-1 mb-5">
//                               {member.joined_at && (
//                                 <p>
//                                   Joined{" "}
//                                   <span className="text-white/50">
//                                     {new Date(member.joined_at).toLocaleDateString("en-US", {
//                                       month: "short",
//                                       day: "numeric",
//                                       year: "numeric",
//                                     })}
//                                   </span>
//                                 </p>
//                               )}
//                               {member.status === "INVITED" && member.invite_expires_at && (
//                                 <p>
//                                   Invite expires{" "}
//                                   <span className="text-amber-400/70">
//                                     {new Date(member.invite_expires_at).toLocaleDateString("en-US", {
//                                       month: "short",
//                                       day: "numeric",
//                                     })}
//                                   </span>
//                                 </p>
//                               )}
//                             </div>

//                             {/* Action buttons — visible on hover */}
//                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 className="flex-1 border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 text-xs h-8"
//                                 onClick={() => {
//                                   setEditingMember(member);
//                                   setIsEditDialogOpen(true);
//                                 }}
//                               >
//                                 <FiEdit className="h-3 w-3 mr-1.5" />
//                                 Edit
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 className="flex-1 border-red-500/20 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 text-xs h-8"
//                                 onClick={() =>
//                                   handleDeleteMember(
//                                     member.id,
//                                     member.name ?? member.invited_email ?? "member"
//                                   )
//                                 }
//                               >
//                                 <FiTrash className="h-3 w-3 mr-1.5" />
//                                 Remove
//                               </Button>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center py-24 text-center">
//                     <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-white/5 mb-6">
//                       <FiUsers className="h-12 w-12 text-white/30" />
//                     </div>
//                     <h3 className="text-xl font-medium text-white mb-2">No Team Members Yet</h3>
//                     <p className="text-white/40 mb-6 text-sm">
//                       Start building your team by inviting your first member.
//                     </p>
//                     <Button
//                       onClick={() => setIsInviteDialogOpen(true)}
//                       className="bg-blue-600 hover:bg-blue-700 text-white"
//                     >
//                       <FiPlus className="h-4 w-4 mr-2" />
//                       Invite Your First Member
//                     </Button>
//                   </div>
//                 )}

//               </main>
//             </div>
//           </div>
//         </SignedIn>

//         {/* Edit Member Dialog */}
//         <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//           <DialogContent className="bg-gray-900 border-gray-700 text-white">
//             <DialogHeader>
//               <DialogTitle>Edit Team Member</DialogTitle>
//             </DialogHeader>
//             {editingMember && (
//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   handleUpdateMember(editingMember.id, {
//                     role: editingMember.role,
//                     name: editingMember.name,
//                   });
//                 }}
//                 className="space-y-4"
//               >
//                 <div className="space-y-2">
//                   <Label htmlFor="edit-name">Name</Label>
//                   <Input
//                     id="edit-name"
//                     type="text"
//                     placeholder="Enter full name"
//                     value={editingMember.name || ""}
//                     onChange={(e) =>
//                       setEditingMember({ ...editingMember, name: e.target.value })
//                     }
//                     className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="edit-role">Role</Label>
//                   <Select
//                     value={editingMember.role}
//                     onValueChange={(value: "OWNER" | "ADMIN" | "MEMBER") =>
//                       setEditingMember({ ...editingMember, role: value })
//                     }
//                   >
//                     <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
//                       <SelectValue placeholder="Select role" />
//                     </SelectTrigger>
//                     <SelectContent className="bg-gray-800 border-gray-700">
//                       <SelectItem value="MEMBER">Member</SelectItem>
//                       <SelectItem value="ADMIN">Admin</SelectItem>
//                       <SelectItem value="OWNER">Owner</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="flex justify-end space-x-2 pt-4">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => {
//                       setIsEditDialogOpen(false);
//                       setEditingMember(null);
//                     }}
//                     className="border-gray-600 text-white hover:bg-gray-800"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="submit"
//                     className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110"
//                   >
//                     Update Member
//                   </Button>
//                 </div>
//               </form>
//             )}
//           </DialogContent>
//         </Dialog>

//         <SignedOut>
//           <div className="flex items-center justify-center h-screen">
//             <div className="text-center">
//               <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-white">
//                 Redirecting to sign in...
//               </h1>
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
//             </div>
//           </div>
//         </SignedOut>
//       </div>
//     </DashboardAccess>
//   );
// }

"use client";

import { useEffect, useState, useRef } from "react";
import { useUser, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  FiUsers, FiMail, FiPlus, FiRefreshCw,
  FiEdit, FiTrash, FiShield, FiStar, FiUser, FiCalendar,
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
}: {
  member: CompanyMember;
  onEditRole: (m: CompanyMember) => void;
  onDelete: (id: string, name: string) => void;
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

      {/* Banner */}
      <div className={`relative h-[64px] rounded-t-[18px] overflow-hidden ${config.bannerBg}`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${config.bannerGlow}`} />
        <div className="absolute bottom-[-22px] left-[18px]">
          <div className="relative">
            <div
              className={`h-[52px] w-[52px] rounded-[14px] bg-gradient-to-br ${config.avatarGradient} flex items-center justify-center text-[15px] font-bold text-white border-[2.5px] border-[#0f1421] tracking-wide`}
            >
              {getInitials(member.name, member.invited_email)}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-[12px] w-[12px] rounded-full border-[2.5px] border-[#0f1421] ${
                isActive ? "bg-green-400" : "bg-amber-400"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-[18px] pt-[32px] pb-[18px]">

        {/* Name + menu */}
        <div className="flex items-start justify-between mb-[3px]">
          <h3 className="text-[15px] font-bold text-[#eef2ff] tracking-[-0.2px] leading-snug truncate flex-1 pr-2 min-w-0">
            {member.name ?? member.invited_email ?? "Team Member"}
          </h3>

          <div className="relative flex-shrink-0" ref={menuRef}>
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

            {menuOpen && (
              <div className="absolute top-[34px] right-0 z-50 w-[172px] rounded-[13px] border border-white/10 bg-[#161c2a] overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.65)] animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="px-[14px] py-[8px] text-[10px] font-bold tracking-[0.8px] text-white/22 uppercase border-b border-white/[0.06]">
                  Actions
                </div>
                <button
                  onClick={() => { onEditRole(member); setMenuOpen(false); }}
                  className="w-full flex items-center gap-[10px] px-[14px] py-[9px] text-[13px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors text-left"
                >
                  <FiEdit className="w-[15px] h-[15px] flex-shrink-0 opacity-65" />
                  Edit role
                </button>
                <div className="h-px bg-white/[0.06] my-[3px]" />
                <button
                  onClick={() => {
                    onDelete(member.id, member.name ?? member.invited_email ?? "member");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-[10px] px-[14px] py-[9px] text-[13px] text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.1] transition-colors text-left"
                >
                  <FiTrash className="w-[15px] h-[15px] flex-shrink-0" />
                  Remove member
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <p className="text-[11px] text-white/30 truncate mb-[13px]">
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
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [companyId, setCompanyId] = useState<string>("");
  const { userRole } = useUserRole(companyId);
  const { toast } = useToast();

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

  // ── Company ID ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const metadataCompanyId = user?.unsafeMetadata?.companyId;
    const localStorageCompanyId =
      typeof window !== "undefined" ? localStorage.getItem("userCompanyId") : null;
    if (metadataCompanyId) setCompanyId(metadataCompanyId as string);
    else if (localStorageCompanyId) setCompanyId(localStorageCompanyId);
    else setCompanyId("quizzviz");
  }, [user]);

  // ── Fetch members ───────────────────────────────────────────────────────────
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

  useEffect(() => { if (companyId) fetchMembers(); }, [companyId]);

  useEffect(() => {
    if (isLoaded && !user) router.push("/signin");
    else if (isLoaded) setIsLoading(false);
  }, [isLoaded, user, router]);

  // ── Invite ──────────────────────────────────────────────────────────────────
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
      return;
    }
    setIsSubmittingInvite(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/company-members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          company_id: companyId,
          company_name: user?.unsafeMetadata?.companyName || "QuizzViz",
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
      fetchMembers();
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
    setIsSavingRole(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/company-members/${editingMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: editingMember.role }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update member");
      }
      toast({
        title: "Role Updated!",
        description: `Updated ${editingMember.name || "member"}'s role to ${editingMember.role.toLowerCase()}`,
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });
      fetchMembers();
      setIsEditRoleOpen(false);
      setEditingMember(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update member",
        variant: "destructive",
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const promptDeleteMember = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleConfirmedDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingMember(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/company-members/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete member");
      }
      toast({
        title: "Member Removed",
        description: `Removed ${deleteTarget.name} from the team`,
        className: "border-red-600/60 bg-red-700 text-red-100 shadow-lg shadow-red-600/30",
      });
      fetchMembers();
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
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Refresh */}
                    <Button
                      onClick={fetchMembers}
                      disabled={isFetchingMembers}
                      className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 flex items-center gap-2 px-4 py-2 rounded-xl"
                    >
                      <FiRefreshCw className={`h-4 w-4 ${isFetchingMembers ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>

                    {/* Invite Member */}
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
                              className="bg-white/[0.05] border-white/[0.12] text-[#eef2ff] placeholder-white/25 rounded-[11px] h-[42px]"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-[12px] font-bold tracking-[0.5px] text-white/40 uppercase">
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter email address"
                              value={inviteForm.email}
                              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                              className="bg-white/[0.05] border-white/[0.12] text-[#eef2ff] placeholder-white/25 rounded-[11px] h-[42px]"
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
                              <SelectTrigger className="bg-white/[0.05] border-white/[0.12] text-[#eef2ff] rounded-[11px] h-[42px]">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1e2535] border-white/10 text-white rounded-[13px]">
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="OWNER">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-[10px] pt-2">
                            <Button
                              type="button"
                              onClick={() => setIsInviteDialogOpen(false)}
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
                  </div>
                </div>

                {/* Member count pill */}
                {!isFetchingMembers && members.length > 0 && (
                  <div className="inline-flex items-center gap-2 text-xs text-white/40 bg-white/[0.05] border border-white/[0.08] rounded-full px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 block" />
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </div>
                )}

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
                    <SelectTrigger className="bg-white/[0.05] border-white/[0.12] text-[#eef2ff] rounded-[11px] h-[42px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e2535] border-white/10 text-white rounded-[13px]">
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
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
                  onClick={handleConfirmedDelete}
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