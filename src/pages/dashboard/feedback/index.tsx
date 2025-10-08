"use client";

import { useState } from 'react';
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Send, ThumbsUp, Lightbulb, MessageSquare, MessageCircle, FileText, Star, Mail, MessageCircleHeart } from 'lucide-react';
import { DashboardHeader } from "@/components/Dashboard/Header";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";

type FeedbackType = 'compliment' | 'suggestion' | 'advice' | 'other';

export default function FeedbackPage() {
  const { user } = useUser();
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
      icon: ThumbsUp,
      gradient: 'from-green-500 to-emerald-500',
      description: 'Share what you love'
    },
    { 
      id: 'suggestion', 
      label: 'Suggestion', 
      icon: Lightbulb,
      gradient: 'from-amber-500 to-orange-500',
      description: 'Help us improve'
    },
    { 
      id: 'advice', 
      label: 'Advice', 
      icon: MessageSquare,
      gradient: 'from-blue-500 to-indigo-500',
      description: 'Guide our direction'
    },
    { 
      id: 'other', 
      label: 'Other', 
      icon: FileText,
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
      const response = await fetch('/api/send_email/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          message,
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

  // Success state UI
  if (submitStatus?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
        <div className="flex min-h-screen">
          <div className="bg-white border-r border-white">
            <DashboardSideBar />
          </div>
          
          <div className="flex-1 flex flex-col">
            <DashboardHeader 
              userName={user?.fullName || user?.firstName || 'User'} 
              userEmail={user?.emailAddresses?.[0]?.emailAddress} 
            />
            
            <main className="flex-1 flex items-center justify-center p-6 lg:p-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-2xl space-y-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6 mx-auto"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  Thank You! 🎉
                </h1>
                
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  We've received your feedback and truly appreciate you taking the time to share your thoughts with us.
                </p>
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // Main form UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="bg-white border-r border-white">
          <DashboardSideBar />
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <DashboardHeader 
            userName={user?.fullName || user?.firstName || 'User'} 
            userEmail={user?.emailAddresses?.[0]?.emailAddress} 
          />
          
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Header Section */}
                <div className="text-center space-y-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-2"
                  >
                    <MessageSquare className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    We'd Love Your Feedback
                  </h1>
                  <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                    Your insights help us create better experiences. Every piece of feedback matters.
                  </p>
                </div>

                {/* Feedback Form Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden"
                >
                  <div className="p-8 lg:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      {/* Feedback Type Selection */}
                      <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-200 tracking-wide uppercase">
                          Choose Feedback Type
                        </label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {feedbackTypes.map((type, index) => {
                            const Icon = type.icon;
                            const isSelected = feedbackType === type.id;
                            
                            return (
                              <motion.button
                                key={type.id}
                                type="button"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative group overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
                                  isSelected
                                    ? 'bg-gradient-to-br ' + type.gradient + ' shadow-lg shadow-blue-500/25'
                                    : 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
                                }`}
                                onClick={() => setFeedbackType(type.id as FeedbackType)}
                              >
                                <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                                  <div className={`p-3 rounded-xl transition-colors ${
                                    isSelected ? 'bg-white/20' : 'bg-gray-700/50 group-hover:bg-gray-700'
                                  }`}>
                                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-300'}`} />
                                  </div>
                                  <div>
                                    <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                      {type.label}
                                    </div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                      {type.description}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <motion.div
                                    layoutId="selected-feedback-type"
                                    className="absolute inset-0 border-2 border-white/30 rounded-2xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Subject for "Other" */}
                      <AnimatePresence>
                        {feedbackType === 'other' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
                          >
                            <label htmlFor="custom-subject" className="block text-sm font-semibold text-gray-200 tracking-wide uppercase">
                              Subject
                            </label>
                            <input
                              type="text"
                              id="custom-subject"
                              value={customSubject}
                              onChange={(e) => setCustomSubject(e.target.value)}
                              className="w-full px-5 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                              placeholder="What's this about?"
                              required={feedbackType === 'other'}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Message Textarea */}
                      <div className="space-y-3">
                        <label htmlFor="message" className="block text-sm font-semibold text-gray-200 tracking-wide uppercase">
                          Your {feedbackType === 'other' ? 'Message' : feedbackType}
                        </label>
                        <textarea
                          id="message"
                          rows={7}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all resize-none"
                          placeholder={`Share your ${feedbackType} with us... We're all ears! 👂`}
                          required
                        />
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{message.length} characters</span>
                          <span>Be as detailed as you'd like</span>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                        className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg ${
                          isSubmitting
                            ? 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/25 hover:shadow-blue-500/40'
                        } text-white`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending Your Feedback...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send Feedback
                          </>
                        )}
                      </motion.button>
                    </form>
                  </div>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                  {submitStatus && !submitStatus.success && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-2xl p-6 shadow-lg bg-gradient-to-br from-red-900/60 to-rose-900/40 border border-red-700/50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-red-500/20">
                          <AlertCircle className="h-6 w-6 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 text-red-300">
                            Oops!
                          </h3>
                          <p className="text-sm text-gray-200 leading-relaxed">
                            {submitStatus.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Note - Only shown when form is active */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center text-sm text-gray-500 space-y-2"
                >
                  <p>Your feedback means the world to us! 💛</p>
                  <p className="text-gray-500">We'll get back to you as soon as we can - usually within a day or two.</p>
                </motion.div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}