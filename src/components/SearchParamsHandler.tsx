'use client';

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export default function SearchParamsHandler() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'deleted') {
      toast({
        title: "Access Removed",
        description: "You have been removed from the company. You have been logged out for security reasons.",
        variant: "destructive",
      });
      
      // Clean up the URL
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('message');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);
  
  return null;
}
