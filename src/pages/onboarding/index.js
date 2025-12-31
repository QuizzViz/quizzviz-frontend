// "use client";

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useUser, useAuth, useClerk } from '@clerk/nextjs';
// import { ArrowRight, Building2 } from 'lucide-react';
// import { LoadingSpinner } from '@/components/ui/loading';
// import { useToast } from '@/hooks/use-toast';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';

// const companySizes = [
//   '1-10',
//   '11-30',
//   '31-50',
//   '51-100',
//   '101-200',
//   '201-500',
//   '501-1000',
//   '1000+'
// ];




// export default function OnboardingPage() {
//   const router = useRouter();
//   const { user, isSignedIn } = useUser();
//   const { getToken } = useAuth();
//   const { signOut, redirectToSignIn } = useClerk();
//   const [formData, setFormData] = useState({
//     companyName: '',
//     companySize: ''
//   });
//   const [isLoading, setIsLoading] = useState(true);
//   const [isChecking, setIsChecking] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const { toast } = useToast();

//   // Check if user is signed in and has a company
//   useEffect(() => {
//     const checkAuthAndCompany = async () => {
//       try {
//         if (!isSignedIn) {
//           redirectToSignIn();
//           return;
//         }

//         const token = await getToken();
//         const response = await fetch(`/api/company/check?owner_id=${user.id}`, {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });
        
//         const data = await response.json();
//         if (data.exists && data.companies && data.companies.length > 0) {
//           // Update user metadata with company info
//           await user.update({
//             unsafeMetadata: {
//               ...user.unsafeMetadata,
//               companyId: data.companies[0].id,
//               planName: data.companies[0].plan_name || 'Free'
//             }
//           });
//           router.push('/dashboard');
//           return;
//         }
//       } catch (error) {
//         console.error('Error checking company:', error);
//         toast({
//           title: 'Error',
//           description: 'Failed to check company status',
//           variant: 'destructive',
//         });
//       } finally {
//         setIsLoading(false);
//         setIsChecking(false);
//       }
//     };

//     checkAuthAndCompany();
//   }, [isSignedIn, router, getToken, user?.id, redirectToSignIn, toast]);

//   if (isLoading || isChecking) {
//     return (
//       <div className="min-h-screen bg-black text-white">
//         <div className="flex items-center justify-center min-h-screen">
//           <LoadingSpinner 
//             fullScreen={false}
//             text="Preparing your onboarding experience..."
//           />
//         </div>
//       </div>
//     );
//   }

//   if (!isSignedIn) {
//     return null;
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.companyName || !formData.companySize) {
//       toast({
//         title: "Error",
//         description: "Please fill in all fields",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsSubmitting(true);
    
//     try {
//       const token = await getToken();
      
//       // Create the company with the user's data from Clerk
//       const response = await fetch('/api/company/create', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           name: formData.companyName,
//           plan_name: 'Free',
//           company_size: formData.companySize,
//           owner_id: user.id,
//           owner_email: user.primaryEmailAddress?.emailAddress,
//           company_id: formData.companyName.toLowerCase().replace(/\s+/g, '-')
//         }),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.message || 'Failed to create company');
//       }

//       // Update user metadata with company info
//       const companyData = await response.json();
//       await user.update({
//         unsafeMetadata: {
//           ...user.unsafeMetadata,
//           companyId: companyData.id,
//           planName: companyData.plan_name || 'Free'
//         }
//       });

//       // Redirect to pricing page after company creation
//       router.push('/pricing');
      
//     } catch (error) {
//       console.error('Error creating company:', error);
      
//       // Handle validation errors
//       if (error.details) {
//         // If we have an array of validation errors, format them
//         const errorMessages = Array.isArray(error.details) 
//           ? error.details.map(e => `• ${e.message || 'Invalid field'}`).join('\n')
//           : error.message || 'Validation failed';
        
//         toast({
//           title: "Validation Error",
//           description: errorMessages,
//           variant: "destructive",
//           duration: 5000,
//         });
//       } else {
//         // Handle other errors
//         toast({
//           title: "Error",
//           description: error.message || "Something went wrong. Please try again.",
//           variant: "destructive",
//         });
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4 pt-20">
//       <div className="w-full max-w-md space-y-6">
//         <div className="text-center space-y-2">
//           <h1 className="text-4xl font-semibold tracking-tight">
//             Welcome to<span className="font-bold ml-3 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">QuizzViz</span>
//           </h1>
//           <p className="text-muted-foreground">
//             Let's get your company set up in just a few steps
//           </p>
//         </div>

//         <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
//           <div className="p-6 space-y-6">
//             <div className="flex justify-center">
//               <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
//                 <Building2 className="w-12 h-12 text-green-500" />
//               </div>
//             </div>

//             {/* Form */}
//             <form onSubmit={handleSubmit} className="space-y-6">
//               <div className="space-y-2">
//                 <Label htmlFor="companyName">Company Name</Label>
//                 <Input
//                   id="companyName"
//                   type="text"
//                   placeholder="Enter your company name"
//                   value={formData.companyName}
//                   onChange={(e) => setFormData({...formData, companyName: e.target.value})}
//                   className="w-full"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="companySize">Company Size</Label>
//                 <Select
//                   value={formData.companySize}
//                   onValueChange={(value) => setFormData({...formData, companySize: value})}
//                 >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select company size" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {companySizes.map((size) => (
//                       <SelectItem key={size} value={size}>
//                         {size} employees
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <Button 
//                 type="submit" 
//                 className="w-full mt-2 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
//                 disabled={isSubmitting}
//               >
//                 {isSubmitting ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
//                     Creating your company...
//                   </>
//                 ) : (
//                   <div className="flex items-center justify-center">
//                     <span>Continue to Pricing</span>
//                     <ArrowRight className="ml-2 h-4 w-4" />
//                   </div>
//                 )}
//               </Button>
//             </form>
//           </div>
          
//           <div className="bg-muted/50 px-6 py-4 border-t">
//             <p className="text-xs text-center text-muted-foreground">
//               By continuing, you agree to our{' '}
//               <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }





"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { useUser, useAuth } from '@clerk/nextjs';
import { ArrowRight, Building2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const companySizes = [
  '1-10',
  '11-30',
  '31-50',
  '51-100',
  '101-200',
  '201-500',
  '501-1000',
  '1000+'
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    companySize: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndCompany = async () => {
      try {
        if (!isLoaded) return;

        if (!isSignedIn) {
          router.push('/signup');
          return;
        }

        const token = await getToken();
        const response = await fetch(`/api/company/check?owner_id=${user?.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.exists && data.companies?.length > 0) {
          setHasCompany(true);

          const companyData = data.companies[0];
          const redirectPath = companyData.plan_name === 'Business' ? '/dashboard' : '/pricing';

          // Hard redirect – this will definitely take you away from the spinner
          setTimeout(() => {
            window.location.href = redirectPath;  // or window.location.replace(redirectPath) to avoid history
          }, 1500); 

          return;
        }

        setHasCompany(false);
      } catch (error) {
        console.error('Error checking company:', error);
      } finally {
        setIsLoading(false);
        setIsChecking(false);
      }
    };

    checkAuthAndCompany();
  }, [isLoaded, isSignedIn, router, getToken, user, toast]);

  if (isLoading || isChecking || !isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner fullScreen={false} text="Preparing your onboarding experience..." />
      </div>
    );
  }

  if (!isSignedIn) return null;

  // If company exists, show spinner briefly then hard redirect
  if (hasCompany) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner
          fullScreen={false}
          text="Company already exists. Redirecting..."
        />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.companySize) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();

      // Double-check
      const checkRes = await fetch(`/api/company/check?owner_id=${user?.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const checkData = await checkRes.json();

      if (checkData.exists && checkData.companies?.length > 0) {
        toast({
          title: 'Company Already Exists',
          description: 'Redirecting to pricing...',
          variant: 'success'
        });

        // Hard redirect immediately
        setTimeout(() => {
          window.location.href = '/pricing';
        }, 1000);

        return;
      }

      // Create company
      const res = await fetch('/api/company/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.companyName,
          plan_name: 'Free',
          company_size: formData.companySize,
          owner_id: user?.id,
          owner_email: user?.primaryEmailAddress?.emailAddress,
          company_id: formData.companyName.toLowerCase().replace(/\s+/g, '-')
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create company');
      }

      await res.json();

      toast({
        title: "Success!",
        description: "Company created successfully. Redirecting to pricing...",
      });

      // Hard redirect after creation too
      setTimeout(() => {
        window.location.href = '/pricing';
      }, 1500);

    } catch (error) {
      console.error('Creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Onboarding | QuizzViz</title>
      </Head>
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">
              Welcome to<span className="font-bold ml-3 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">QuizzViz</span>
            </h1>
            <p className="text-muted-foreground">
              Let's get your company set up in just a few steps
            </p>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-green-500" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Enter your company name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size} employees
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creating your company...
                    </>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>Continue to Pricing</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            </div>

            <div className="bg-muted/50 px-6 py-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}