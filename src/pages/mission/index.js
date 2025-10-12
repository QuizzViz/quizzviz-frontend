import React from 'react';
import { Target, Users, Lightbulb, BarChart3, Code, Shield, Zap, Award, CheckCircle, Clock, Search, UserCheck } from 'lucide-react';
import { Footer } from '@/components/Footer';
import Head from 'next/head';

const FeatureCard = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`p-8 rounded-2xl bg-gray-900/50 border border-gray-800/50 transition-all hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/10 ${className}`}>
    <div className="w-14 h-14 rounded-xl bg-gray-800/50 flex items-center justify-center mb-6 border border-gray-700/50">
      <Icon className="w-6 h-6 text-teal-400" />
    </div>
    <h3 className="text-2xl font-bold mb-3 text-gray-100">{title}</h3>
    <p className="text-gray-300 leading-relaxed">{children}</p>
  </div>
);

export default function OurMission() {
  return (
    <>
      <Head>
        <title>Our Mission - QuizzViz</title>
        <meta name="description" content="Learn about QuizzViz - The modern platform for skills assessment and talent discovery" />
      </Head>
      
      <div className="min-h-screen bg-background text-gray-100">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 bg-background">
          <div className="relative max-w-6xl mx-auto px-6">
            <div className="text-center space-y-6">
              <span className="inline-block px-5 py-2.5 rounded-full bg-background text-teal-400 text-sm font-semibold border border-teal-500/30 backdrop-blur-md">
                Our Mission
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-100">
                Empowering <span className="text-teal-400">Learning</span> and{' '}
                <span className="text-teal-400">Hiring</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
We’re on a mission to transform how skills are assessed              </p>
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto px-6 mt-12 space-y-8">
            <div className="bg-gray-900/50 rounded-2xl p-8 md:p-10 space-y-6 transition-all border border-gray-800/50 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/10">
              <h3 className="text-2xl font-semibold text-gray-100">The Real Test of Knowledge</h3>
              <p className="text-gray-300 leading-relaxed">
                We believe that true understanding isn't about memorizing syntax or reciting definitions. Real-world scenario-based questions test your concepts in depth, challenging you to apply what you know in practical situations that mirror actual development challenges.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Quizzes aren't just about getting the right answers—they're about revealing how deeply you understand a concept. They show you exactly where you stand with a particular language, framework, or tool.
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-2xl p-8 md:p-10 space-y-6 transition-all border border-gray-800/50 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/10">
              <h3 className="text-2xl font-semibold text-teal-400">A Clear Mirror of Your Knowledge</h3>
              <p className="text-gray-300 leading-relaxed">
                We believe in attempting quizzes in a distraction-free, no-cheating environment. Why? Because only then can you see a clear, honest reflection of your knowledge. 
              </p>
              <p className="text-gray-400 leading-relaxed">
                When there are no shortcuts, no Google searches, no AI assistants in the background—that's when you truly discover what you know and what you need to learn. This honest assessment is the foundation for real growth.
              </p>
              <div className="mt-6 p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <p className="text-gray-200 italic">
                  "Self-deception in learning only delays progress. QuizzViz gives you the truth about your skills, so you can focus on what actually matters."
                </p>
              </div>
            </div>
          </div>

          {/* For Businesses */}
          <div className="max-w-6xl mx-auto px-6 mt-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center border border-gray-700/50">
                <Users className="w-7 h-7 text-teal-400" />
              </div>
              <h2 className="text-4xl font-bold text-gray-100">For Businesses</h2>
            </div>

            <div className="bg-gray-900/50 rounded-2xl p-8 md:p-10 space-y-6 transition-all border border-gray-800/50 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/10">
              <h3 className="text-2xl font-semibold text-gray-100">The Broken Hiring System</h3>
              <p className="text-gray-300 leading-relaxed">
                We believe the current hiring system is fundamentally broken. Here's how it typically works:
              </p>
              <div className="space-y-4 ml-6 border-l-2 border-teal-500/30 pl-6">
                <div className="space-y-2">
                  <p className="text-gray-100 font-medium">Step 1: Resume Screening</p>
                  <p className="text-gray-300">HR reviews hundreds of resumes, making decisions based on formatting, keywords, and presentation rather than actual skills.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-100 font-medium">Step 2: Home Assignments</p>
                  <p className="text-gray-300">Selected candidates receive take-home tasks that can easily be copied from Stack Overflow, GitHub, or ChatGPT.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-100 font-medium">Step 3: Interviews</p>
                  <p className="text-gray-300">Finally, technical interviews happen—often with candidates whose actual skills don't match their submissions.</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mt-6">
                The result? Companies waste countless hours interviewing candidates who looked good on paper but lack the technical depth needed for the role. Resume writing skills are being tested more than actual coding abilities.
              </p>
            </div>

            {/* QuizzViz Approach Section */}
            <div className="mt-12 bg-gray-900/50 rounded-2xl p-8 md:p-10 space-y-6 transition-all border border-gray-800/50 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/10">
              <h3 className="text-2xl font-semibold text-teal-400">The QuizzViz Approach</h3>
              <p className="text-gray-300 leading-relaxed">
                We built QuizzViz to flip this system on its head. Instead of filtering candidates through resume aesthetics and easily-cheated assignments, companies can share quizzes with all applicants from day one.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                  <h4 className="text-xl font-semibold mb-3 text-gray-100">Instant Filtering</h4>
                  <p className="text-gray-300">Candidates who score higher demonstrate genuine technical knowledge. No guesswork, no assumptions—just data.</p>
                </div>
                <div className="p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                  <h4 className="text-xl font-semibold mb-3 text-gray-100">Time Savings</h4>
                  <p className="text-gray-300">Skip the resume screening marathon. Interview only those who've proven their skills through secured assessments.</p>
                </div>
                <div className="p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                  <h4 className="text-xl font-semibold mb-3 text-gray-100">Smaller HR Teams</h4>
                  <p className="text-gray-300">When technical screening is automated and accurate, you don't need large HR departments to filter candidates.</p>
                </div>
                <div className="p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                  <h4 className="text-xl font-semibold mb-3 text-gray-100">Complete Analytics</h4>
                  <p className="text-gray-300">Download comprehensive candidate data from quiz analytics. Every answer, every score, every insight—at your fingertips.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Our Core Belief */}
          <div className="max-w-6xl mx-auto px-6 mt-20">
            <div className="bg-gradient-to-r from-teal-500/10 via-gray-900/80 to-teal-500/10 border border-teal-500/20 rounded-3xl p-8 md:p-12">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto border border-teal-500/20">
                  <Lightbulb className="w-7 h-7 text-teal-400" />
                </div>
                <h2 className="text-4xl font-bold text-gray-100">What We Stand For</h2>
                <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
                  We believe in a better way—where skills speak louder than resumes, where assessments are fair and cheat-proof, and where both candidates and companies can trust the process.
                </p>
                <p className="text-xl font-semibold text-teal-400 mt-6">
                  That's why we built QuizzViz.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </>
  );
}