"use client";

import { useState } from 'react';
import Head from 'next/head';
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, CheckCircle, AlertCircle, Monitor, Bug as BugIconSvg, Zap, ShieldAlert, HelpCircle } from 'lucide-react';
import { DashboardHeader } from "@/components/Dashboard/Header";
import DashboardSideBar from "@/components/SideBar/DashboardSidebar";

type BugType = 'ui' | 'functionality' | 'performance' | 'security' | 'other';

const bugTypes = [
  { 
    id: 'ui' as const, 
    label: 'UI/UX Issue', 
    icon: Monitor,
    gradient: 'from-blue-500 to-indigo-500',
    description: 'Visual or interface problems, like misaligned elements or broken layouts.'
  },
  { 
    id: 'functionality' as const, 
    label: 'Functional Bug', 
    icon: BugIconSvg,
    gradient: 'from-rose-500 to-pink-500',
    description: 'Features not working as expected, like buttons or forms failing.'
  },
  { 
    id: 'performance' as const, 
    label: 'Performance Issue', 
    icon: Zap,
    gradient: 'from-amber-500 to-orange-500',
    description: 'Slow loading, lagging, or unresponsive behavior.'
  },
  { 
    id: 'security' as const, 
    label: 'Security Concern', 
    icon: ShieldAlert,
    gradient: 'from-emerald-500 to-teal-500',
    description: 'Potential security risks, like data exposure.'
  },
  { 
    id: 'other' as const, 
    label: 'Other Issue', 
    icon: AlertCircle,
    gradient: 'from-purple-500 to-fuchsia-500',
    description: 'Any other problem not listed above.'
  },
];

const BugTypeCard: React.FC<{
  type: typeof bugTypes[number];
  isSelected: boolean;
  onSelect: (id: BugType) => void;
}> = ({ type, isSelected, onSelect }) => {
  const Icon = type.icon;
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(type.id)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`p-5 rounded-xl border-2 text-center min-w-[180px] transition-all duration-200 h-full flex flex-col justify-between ${
        isSelected
          ? `border-transparent bg-gradient-to-br ${type.gradient} text-white shadow-lg`
          : 'border-gray-700 bg-gray-800/30 hover:bg-gray-800/50 text-gray-200 hover:text-white'
      }`}
      aria-label={`Select ${type.label}`}
    >
      <div className="flex flex-col items-center space-y-2">
        <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-300'}`} />
        <span className="font-medium text-sm">{type.label}</span>
        <p className="text-xs opacity-80">{type.description}</p>
      </div>
    </motion.button>
  );
};

const FormField: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder: string;
  required?: boolean;
  isTextarea?: boolean;
  helperText?: string;
  showHelp?: boolean;
  maxLength?: number;
}> = ({ label, id, value, onChange, placeholder, required, isTextarea, helperText, showHelp, maxLength }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-gray-200 flex items-center">
      {label} {required && <span className="text-red-400">*</span>}
      {showHelp && (
        <span className="ml-2 text-gray-400 hover:text-gray-200 cursor-pointer" title={helperText}>
          <HelpCircle className="w-4 h-4" />
        </span>
      )}
    </label>
    {isTextarea ? (
      <textarea
        id={id}
        value={value}
        onChange={(e) => {
          if (maxLength && e.target.value.length > maxLength) return;
          onChange(e);
        }}
        rows={4}
        required={required}
        maxLength={maxLength}
        className={`w-full px-4 py-3 bg-gray-800 border ${
          required && !value.trim() ? 'border-red-500' : 'border-gray-700'
        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200`}
        placeholder={placeholder}
        aria-describedby={helperText ? `${id}-helper` : undefined}
      />
    ) : (
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200"
        placeholder={placeholder}
        aria-describedby={helperText ? `${id}-helper` : undefined}
      />
    )}
    {helperText && (
      <p id={`${id}-helper`} className="text-xs text-gray-400 mt-1">
        {helperText}
      </p>
    )}
    {required && !value.trim() && (
      <p className="text-xs text-red-400 mt-1">This field is required.</p>
    )}
    {maxLength && (
      <p className="text-xs text-gray-400 mt-1">
        {value.length} / {maxLength} characters
      </p>
    )}
  </div>
);

export default function ReportBugPage() {
  const { user } = useUser();
  const [bugType, setBugType] = useState<BugType>('functionality');
  const [customSubject, setCustomSubject] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actual.trim()) {
      setSubmitStatus({
        success: false,
        message: 'Please tell us what happened instead.'
      });
      return;
    }

    const subject = bugType === 'other' && customSubject 
      ? customSubject 
      : bugTypes.find(t => t.id === bugType)?.label || 'Bug Report';

    const message = `# Bug Report

## Type: ${bugTypes.find(t => t.id === bugType)?.label || 'Other'}

## How to See the Problem
${steps || 'Not provided'}

## What You Hoped Would Happen
${expected || 'Not provided'}

## What Happened Instead
${actual}
`;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/send_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: `[Bug] ${subject}`,
          message,
          email_type: 'report_bug'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitStatus({
          success: true,
          message: 'Thank you for reporting this bug! Our team will investigate soon.'
        });
        setSteps('');
        setExpected('');
        setActual('');
        setCustomSubject('');
        setBugType('functionality');
      } else {
        throw new Error(data.message || 'Failed to submit bug report');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      setSubmitStatus({
        success: false,
        message: 'Failed to submit bug report. Please try again later.'
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
              userEmail={user?.primaryEmailAddress?.emailAddress || ''} 
            />
            
            <main className="flex-1 flex items-center justify-center p-6 lg:p-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-2xl space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4 mx-auto"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  Bug Reported Successfully! 🐞
                </h1>
                
                <p className="text-lg text-gray-300 max-w-xl mx-auto">
                  Thank you for helping us improve QuizzViz! Our team has been notified and will investigate soon.
                </p>
                
                <div className="pt-6">
                  <motion.button
                    onClick={() => setSubmitStatus(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    Report Another Bug
                  </motion.button>
                </div>
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Report a Bug | QuizzViz</title>
        <link rel="icon" href="/favicon.ico" />

      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
        <div className="flex min-h-screen">
          <div className="bg-white border-r border-white">
            <DashboardSideBar />
          </div>
          
          <div className="flex-1 flex flex-col">
            <DashboardHeader 
              userName={user?.fullName || user?.firstName || 'User'} 
              userEmail={user?.primaryEmailAddress?.emailAddress || ''} 
            />
            
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-600 to-pink-600 mb-2"
                    >
                      <Bug className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                      Report a Bug
                    </h1>
                    <p className="text-base text-gray-400 max-w-xl mx-auto">
                      Help us make QuizzViz better! Tell us about the issue below—don’t worry if you’re unsure, just do your best!
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-200">What kind of issue are you facing?</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
                      {bugTypes.map((type) => (
                        <div key={type.id} className="w-full">
                          <BugTypeCard
                            type={type}
                            isSelected={bugType === type.id}
                            onSelect={setBugType}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {bugType === 'other' && (
                      <FormField
                        label="Issue Subject"
                        id="customSubject"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Briefly describe the issue (e.g., 'Quiz not loading')..."
                        helperText="Give a short title for the problem you’re reporting."
                        showHelp
                      />
                    )}

                    <FormField
                      label="How to See the Problem (Optional)"
                      id="steps"
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                      placeholder="1. Went to quiz page...\n2. Clicked 'Start'...\n3. Saw an error..."
                      isTextarea
                      helperText="Tell us the steps you took before the issue happened (e.g., what you clicked or where you were). This helps us find the problem!"
                      showHelp
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        label="What You Hoped Would Happen (Optional)"
                        id="expected"
                        value={expected}
                        onChange={(e) => setExpected(e.target.value)}
                        placeholder="What you hoped would happen (e.g., the page loaded correctly)..."
                        isTextarea
                        helperText="Describe what you expected to see when you tried this."
                        showHelp
                      />
                      <FormField
                        label="What Happened Instead"
                        id="actual"
                        value={actual}
                        onChange={(e) => setActual(e.target.value)}
                        placeholder="What went wrong (e.g., the page crashed)..."
                        isTextarea
                        required
                        helperText="Tell us what went wrong. This is required so we can fix it!"
                        showHelp
                        maxLength={5000}
                      />
                    </div>

                    <div className="pt-4">
                      <motion.button
                        type="submit"
                        disabled={isSubmitting || !actual.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full md:w-auto px-8 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                          isSubmitting || !actual.trim()
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Bug className="w-5 h-5" />
                            <span>Submit Bug Report</span>
                          </>
                        )}
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {submitStatus && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`p-4 rounded-lg flex items-start space-x-3 ${
                            submitStatus.success
                              ? 'bg-green-900/20 border border-green-800 text-green-200'
                              : 'bg-rose-900/20 border border-rose-800 text-rose-200'
                          }`}
                        >
                          <div className="flex-shrink-0 pt-0.5">
                            {submitStatus.success ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-rose-400" />
                            )}
                          </div>
                          <p className="text-sm font-medium">{submitStatus.message}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </motion.div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}