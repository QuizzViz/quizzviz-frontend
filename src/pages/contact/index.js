"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle, AlertCircle, MessageCircle, ArrowRight, HelpCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {Footer} from '@/components/Footer';
import { PageLoading } from '@/components/ui/page-loading';

export default function ContactPage() {
  const { isLoaded, user, isSignedIn } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
    }
  }, [user]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    message: ''
  });

 
  if (!isLoaded) {
    return <PageLoading fullScreen />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus({
        success: false,
        message: 'Please fill in all required fields (Name, Email, and Message).'
      });
      setIsModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/send_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject || 'Contact Form Submission',
          message: `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
          email_type: 'contact',
          userEmail: formData.email || '',
          email: formData.email || ''  // Include both for backward compatibility
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitStatus({
          success: true,
          message: 'Thank you! We\'ll get back to you soon.'
        });
        setFormData({
          name: user?.fullName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitStatus({
        success: false,
        message: error.message || 'Failed to send message. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(true);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-foreground relative">
      {/* Status Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.target === e.currentTarget && !submitStatus.success && setIsModalOpen(false)}
          >
            <motion.div 
              className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ 
                type: 'spring',
                damping: 25,
                stiffness: 300
              }}
            >
              <div className={`w-20 h-20 ${
                submitStatus.success 
                  ? 'bg-green-500/10' 
                  : 'bg-rose-500/10'
              } rounded-full flex items-center justify-center mx-auto mb-6`}>
                {submitStatus.success ? (
                  <CheckCircle className="w-10 h-10 text-green-400" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-rose-400" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {submitStatus.success ? 'Message Sent!' : 'Something went wrong'}
              </h3>
              <p className="text-gray-300 mb-6">{submitStatus.message}</p>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                {submitStatus.success ? 'Okay' : 'Okay, got it'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Head>
        <title>Contact Us | QuizzViz</title>
        <meta name="description" content="Get in touch with the QuizzViz team. We'd love to hear from you!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-blue-600 mb-4 mx-auto">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text">
            Get In Touch
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Got questions? We'd love to help! Drop us a message, and we'll get back to you as soon as we can.          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
          className="relative"
        >
          <Card className="bg-card/80 border border-gray-800/40 shadow-lg hover:shadow-xl transition-shadow duration-300 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-t-lg">
              <CardTitle className="text-2xl font-medium text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Send Us a Message
              </CardTitle>
              <CardDescription className="text-gray-300">
                We typically respond within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-8">
              {submitStatus.message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "mb-6 p-4 rounded-lg flex items-start gap-3 text-sm border",
                    submitStatus.success 
                      ? "bg-green-900/20 border-green-800 text-green-200"
                      : "bg-rose-900/20 border-rose-800 text-rose-200"
                  )}
                >
                  {submitStatus.success ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <p className="text-sm">{submitStatus.message}</p>
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground/90 text-sm font-medium flex items-center">
                      Your Name <span className="text-red-400">*</span>
                      <span className="ml-2 text-gray-400 hover:text-gray-200 cursor-pointer" title="Enter your full name so we know who you are.">
                        <HelpCircle className="w-4 h-4" />
                      </span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder={user?.fullName || 'e.g., John Doe'}
                      className="h-12 bg-gray-800/50 border-gray-700 hover:border-gray-500 focus:border-blue-500 transition-colors text-white placeholder-gray-400"
                    />
                    {!formData.name.trim() && <p className="text-xs text-red-400">Name is required.</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground/90 text-sm font-medium flex items-center">
                      Your Email <span className="text-red-400">*</span>
                      <span className="ml-2 text-gray-400 hover:text-gray-200 cursor-pointer" title="Enter a valid email where we can reply to you.">
                        <HelpCircle className="w-4 h-4" />
                      </span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder={user?.primaryEmailAddress?.emailAddress || 'your.email@example.com'}
                      className="h-12 bg-gray-800/50 border-gray-700 hover:border-gray-500 focus:border-blue-500 transition-colors text-white placeholder-gray-400"
                    />
                    {!formData.email.trim() && <p className="text-xs text-red-400">Email is required.</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-foreground/90 text-sm font-medium flex items-center">
                    Subject <span className="text-gray-500 text-xs">(optional)</span>
                    <span className="ml-2 text-gray-400 hover:text-gray-200 cursor-pointer" title="A short summary of your message (e.g., 'Support Request').">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g., Support Request"
                    className="h-12 bg-gray-800/50 border-gray-700 hover:border-gray-500 focus:border-blue-500 transition-colors text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-foreground/90 text-sm font-medium flex items-center">
                    Your Message <span className="text-red-400">*</span>
                    <span className="ml-2 text-gray-400 hover:text-gray-200 cursor-pointer" title="Describe your question or feedback in detail.">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="e.g., I need help with my quiz results..."
                    className="min-h-[140px] bg-gray-800/50 border-gray-700 hover:border-gray-500 focus:border-blue-500 transition-colors text-white placeholder-gray-400 resize-y"
                  />
                  {!formData.message.trim() && <p className="text-xs text-red-400">Message is required.</p>}
                </div>
                
                <div className="pt-4">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || (!formData.name.trim() || !formData.email.trim() || !formData.message.trim())}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
    <Footer />
    </>
  );
}