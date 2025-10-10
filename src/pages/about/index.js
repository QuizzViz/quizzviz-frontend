import React from 'react';
import { Target, Users, Lightbulb, BarChart3, Code, Shield, Zap, Award, CheckCircle, Clock, Search, UserCheck } from 'lucide-react';
import { Footer } from '@/components/Footer';
import Head from 'next/head';

const FeatureCard = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`p-6 rounded-xl border bg-white/10 backdrop-blur-sm ${className}`}>
    <div className="w-12 h-12 rounded-lg bg-background-500/20 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-blue-400" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
    <p className="text-gray-300">{children}</p>
  </div>
);

export default function AboutUs() {
  return (
    <>
      <Head>
        <title>About Us - QuizzViz</title>
        <meta name="description" content="Learn about QuizzViz - The modern platform for skills assessment and talent discovery" />
      </Head>
      
      <div className="min-h-screen bg-background text-white">
        {/* Navigation */}
      

        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 text-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2220%22 fill=%22none%22 stroke=%22rgba(255,255,255,0.1)%22 stroke-width=%222%22/%3E%3C/svg%23')] opacity-20" />
          <div className="relative max-w-4xl mx-auto px-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="text-blue-300">Empowering</span> <span className="text-white">Learning</span> and <span className="text-blue-300">Hiring</span>
            </h1>
            <p className="text-xl text-gray-200 mt-4 max-w-2xl mx-auto leading-relaxed">
              We're on a mission to transform how skills are assessed and talent is discovered through innovative, secure, and insightful testing solutions.
            </p>
          </div>
        </section>

        {/* For Learners */}
        <section className="py-20 max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-background-500/20 rounded-xl flex items-center justify-center">
              <Code className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-4xl font-bold text-white">For Learners</h2>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 md:p-10 space-y-6">
              <h3 className="text-2xl font-semibold text-blue-300">The Real Test of Knowledge</h3>
              <p className="text-gray-300 leading-relaxed">
                We believe that true understanding isn't about memorizing syntax or reciting definitions. Real-world scenario-based questions test your concepts in depth, challenging you to apply what you know in practical situations that mirror actual development challenges.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Quizzes aren't just about getting the right answers—they're about revealing how deeply you understand a concept. They show you exactly where you stand with a particular language, framework, or tool.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 md:p-10 space-y-6">
              <h3 className="text-2xl font-semibold text-blue-300">A Clear Mirror of Your Knowledge</h3>
              <p className="text-gray-300 leading-relaxed">
                We believe in attempting quizzes in a distraction-free, no-cheating environment. Why? Because only then can you see a clear, honest reflection of your knowledge. 
              </p>
              <p className="text-gray-300 leading-relaxed">
                When there are no shortcuts, no Google searches, no AI assistants in the background—that's when you truly discover what you know and what you need to learn. This honest assessment is the foundation for real growth.
              </p>
              <div className="mt-6 p-6 bg-background-500/20 border border-blue-500/30 rounded-xl">
                <p className="text-gray-300 italic">
                  "Self-deception in learning only delays progress. QuizzViz gives you the truth about your skills, so you can focus on what actually matters."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* For Businesses */}
        <section className="py-20 bg-background-800/50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-background-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-4xl font-bold text-white">For Businesses</h2>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 md:p-10 space-y-6">
              <h3 className="text-2xl font-semibold text-blue-300">The Broken Hiring System</h3>
              <p className="text-gray-300 leading-relaxed">
                We believe the current hiring system is fundamentally broken. Here's how it typically works:
              </p>
              <div className="space-y-4 ml-6 border-l-2 border-blue-500/30 pl-6">
                <div className="space-y-2">
                  <p className="text-gray-200 font-medium">Step 1: Resume Screening</p>
                  <p className="text-gray-300">HR reviews hundreds of resumes, making decisions based on formatting, keywords, and presentation rather than actual skills.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-200 font-medium">Step 2: Home Assignments</p>
                  <p className="text-gray-300">Selected candidates receive take-home tasks that can easily be copied from Stack Overflow, GitHub, or ChatGPT.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-200 font-medium">Step 3: Interviews</p>
                  <p className="text-gray-300">Finally, technical interviews happen—often with candidates whose actual skills don't match their submissions.</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mt-6">
                The result? Companies waste countless hours interviewing candidates who looked good on paper but lack the technical depth needed for the role. Resume writing skills are being tested more than actual coding abilities.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 md:p-10 space-y-6">
              <h3 className="text-2xl font-semibold text-blue-300">The QuizzViz Approach</h3>
              <p className="text-gray-300 leading-relaxed">
                We built QuizzViz to flip this system on its head. Instead of filtering candidates through resume aesthetics and easily-cheated assignments, companies can share quizzes with all applicants from day one.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="p-6 bg-background-500/20 border border-blue-500/30 rounded-xl">
                  <h4 className="text-xl font-semibold mb-3 text-blue-200">Instant Filtering</h4>
                  <p className="text-gray-300">Candidates who score higher demonstrate genuine technical knowledge. No guesswork, no assumptions—just data.</p>
                </div>
                <div className="p-6 bg-background-500/20 border border-blue-500/30 rounded-xl">
                  <h4 className="text-xl font-semibold mb-3 text-blue-200">Time Savings</h4>
                  <p className="text-gray-300">Skip the resume screening marathon. Interview only those who've proven their skills through secured assessments.</p>
                </div>
                <div className="p-6 bg-background-500/20 border border-blue-500/30 rounded-xl">
                  <h4 className="text-xl font-semibold mb-3 text-blue-200">Smaller HR Teams</h4>
                  <p className="text-gray-300">When technical screening is automated and accurate, you don't need large HR departments to filter candidates.</p>
                </div>
                <div className="p-6 bg-background-500/20 border border-blue-500/30 rounded-xl">
                  <h4 className="text-xl font-semibold mb-3 text-blue-200">Complete Analytics</h4>
                  <p className="text-gray-300">Download comprehensive candidate data from quiz analytics. Every answer, every score, every insight—at your fingertips.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Our Core Belief */}
          <div className="relative overflow-hidden rounded-3xl mt-20">
            <div className="absolute inset-0 bg-blue-700" />
            <div className="relative px-8 py-16 md:px-12 md:py-20 text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Lightbulb className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              <h2 className="text-4xl font-bold">What We Stand For</h2>
              <p className="text-xl text-gray-100 leading-relaxed max-w-3xl mx-auto">
                We believe in meritocracy based on actual skills, not polished resumes. We believe in honest self-assessment for learners and efficient, data-driven hiring for businesses. We believe that when testing is secure, scenario-based, and comprehensive, everyone wins—learners grow faster, and companies find the right talent quicker.
              </p>
              <p className="text-xl font-semibold mt-8">
                That's why we built QuizzViz.
              </p>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </>
  );
}