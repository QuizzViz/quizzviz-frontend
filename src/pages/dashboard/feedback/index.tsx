"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, Zap, Clock, Lock, ArrowRight } from "lucide-react";

import DashboardSideBar from "@/components/SideBar/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { DashboardAccess } from "@/components/Dashboard/DashboardAccess";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FeedbackType = 'compliment' | 'suggestion' | 'advice' | 'other';

export default function FeedbackPage() {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [customSubject, setCustomSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const feedbackTypes = [
    { 
      id: 'compliment', 
      label: 'Compliment', 
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      description: 'Share what you love'
    },
    { 
      id: 'suggestion', 
      label: 'Suggestion', 
      icon: Zap,
      gradient: 'from-amber-500 to-orange-500',
      description: 'Help us improve'
    },
    { 
      id: 'advice', 
      label: 'Advice', 
      icon: Clock,
      gradient: 'from-blue-500 to-indigo-500',
      description: 'Guide our direction'
    },
    { 
      id: 'other', 
      label: 'Other', 
      icon: Lock,
      gradient: 'from-purple-500 to-pink-500',
      description: 'Something else'
    },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setSubmitStatus({
        success: false,
        message: 'Please enter your feedback message.'
      });
      return;
    }

    const subject = feedbackType === 'other' && customSubject 
      ? customSubject 
      : feedbackTypes.find(t => t.id === feedbackType)?.label || 'Feedback';

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/send_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          message,
          email_type: 'feedback'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitStatus({
          success: true,
          message: 'Thank you for your feedback! We appreciate you taking the time to help us improve.'
        });
        setMessage('');
        setCustomSubject('');
      } else {
        throw new Error(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus({
        success: false,
        message: 'Failed to submit feedback. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (!isLoaded || isLoading) {
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
                <div className="max-w-3xl mx-auto">
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                        Feedback & Support
                      </span>
                    </h1>
                    <p className="text-gray-400">
                      We're here to help! Share your thoughts, report issues, or request new features.
                    </p>
                  </div>
                  <div className="text-center py-16 bg-gray-900/50 border border-white/10 rounded-2xl">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
                      <CheckCircle className="h-10 w-10 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                      Loading...
                    </h2>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </SignedIn>
      </div>
    );
  }

  // Success state UI
  if (submitStatus?.success) {
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
                <div className="max-w-3xl mx-auto">
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                        Feedback & Support
                      </span>
                    </h1>
                    <p className="text-gray-400">
                      We're here to help! Share your thoughts, report issues, or request new features.
                    </p>
                  </div>
                  <div className="text-center py-16 bg-gray-900/50 border border-white/10 rounded-2xl">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
                      <CheckCircle className="h-10 w-10 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                      Thank You!
                    </h2>
                    <p className="text-gray-300 mb-8 max-w-md mx-auto">
                      Your feedback is valuable to us. We'll review it and get back to you if needed.
                    </p>
                    <Button 
                      onClick={() => setSubmitStatus(null)}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90 transition-opacity px-6 h-10 text-sm font-medium rounded-lg"
                    >
                      Submit Another
                    </Button>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </SignedIn>
      </div>
    );
  }

  // Main form UI
  return (
    <DashboardAccess>
      <div className="min-h-screen bg-black text-white">
        <SignedIn>
          <div className="flex min-h-screen">
            <div className="bg-white border-r border-white">
              <DashboardSideBar />
            </div>
            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 p-6">
                <div className="max-w-3xl mx-auto">
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                        Feedback & Support
                      </span>
                    </h1>
                    <p className="text-gray-400">
                      We're here to help! Share your thoughts, report issues, or request new features.
                    </p>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <Card className="bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <CardHeader className="border-b border-white/10">
                          <CardTitle className="text-xl font-bold">
                            <span className="bg-gradient-to-r from-teal-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                              Share Your Feedback
                            </span>
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {feedbackType === 'compliment' 
                              ? 'Share what you love about our product.' 
                              : feedbackType === 'suggestion'
                              ? 'Help us improve by suggesting a new feature or improvement.'
                              : feedbackType === 'advice'
                              ? 'Guide our direction by sharing your advice.'
                              : 'Something else'}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="p-6 space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="feedback-type" className="text-white text-sm font-medium">
                              Type of Feedback
                            </Label>
                            <Select value={feedbackType} onValueChange={setFeedbackType}>
                              <SelectTrigger className="h-10 bg-white/5 border border-white/10 text-white text-sm focus:border-green-500/50 transition-colors rounded-lg focus:ring-0 focus:ring-offset-0">
                                <SelectValue placeholder="Select feedback type" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-white/10">
                                <SelectItem value="compliment" className="text-white hover:bg-green-500/20">Compliment</SelectItem>
                                <SelectItem value="suggestion" className="text-white hover:bg-green-500/20">Suggestion</SelectItem>
                                <SelectItem value="advice" className="text-white hover:bg-green-500/20">Advice</SelectItem>
                                <SelectItem value="other" className="text-white hover:bg-green-500/20">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="message" className="text-white text-sm font-medium">
                              {feedbackType === 'compliment' ? 'Your Compliment' : feedbackType === 'suggestion' ? 'Your Suggestion' : feedbackType === 'advice' ? 'Your Advice' : 'Your Message'}
                            </Label>
                            <Textarea
                              id="message"
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              className="min-h-[150px] bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm rounded-lg"
                              placeholder={
                                feedbackType === 'compliment'
                                  ? 'Please share what you love about our product...'
                                  : feedbackType === 'suggestion'
                                  ? 'Tell us about the feature you\'d like to see. How would it work? Why is it important to you?'
                                  : feedbackType === 'advice'
                                  ? 'Guide our direction by sharing your advice...'
                                  : 'Share your thoughts, suggestions, or any other feedback with us...'
                              }
                            />
                          </div>

                          {feedbackType === 'other' && (
                            <div className="space-y-2">
                              <Label htmlFor="custom-subject" className="text-white text-sm font-medium">
                                Subject
                              </Label>
                              <Input
                                id="custom-subject"
                                type="text"
                                value={customSubject}
                                onChange={(e) => setCustomSubject(e.target.value)}
                                className="h-10 bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm rounded-lg"
                                placeholder="What's this about?"
                              />
                            </div>
                          )}

                          <div className="pt-2">
                            <Button
                              onClick={handleSubmit}
                              disabled={!message.trim() || isSubmitting}
                              className="w-full h-12 text-base font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl group rounded-lg"
                            >
                              {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                  Submitting...
                                </span>
                              ) : (
                                <>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Submit Feedback
                                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-400 pt-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-green-400" />
                          <span>We typically respond within 24 hours</span>
                        </div>
                        <span className="hidden sm:inline text-white/20">•</span>
                        <div className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-blue-400" />
                          <span>Your information is secure and private</span>
                        </div>
                      </div>

                      {submitStatus && !submitStatus.success && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-300">
                                Oops! {submitStatus.message}
                              </h3>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Footer Note - Only shown when form is active */}
                  {!submitStatus?.success && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-center text-sm text-gray-500 space-y-2 mt-8"
                    >
                      <p>Your feedback means the world to us! 💛</p>
                      <p className="text-gray-400">We'll get back to you as soon as we can - usually within a day or two.</p>
                    </motion.div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </SignedIn>
      </div>
    </DashboardAccess>
  );
}