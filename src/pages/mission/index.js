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
        <title>Mission | QuizzViz</title>
        <meta name="description" content="A better way to assess technical skills" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-background text-gray-100">
        <section className="relative overflow-hidden py-20 md:py-24 bg-background">
          <div className="relative max-w-3xl mx-auto px-6">
            <div className="text-center space-y-6">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-100">
                Smarter <span className="text-teal-400">Technical</span> Hiring
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                We help companies find the right technical talent through skill-based assessments
              </p>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto px-6 mt-12 space-y-8">
            <div className="bg-gray-900/50 rounded-2xl p-8 space-y-6 border border-gray-800/50">
              <h3 className="text-2xl font-semibold text-teal-400">Our Approach</h3>
              <p className="text-gray-300 leading-relaxed">
                Traditional hiring often focuses too much on resumes and not enough on actual skills. We believe in assessing technical abilities first, before the interview stage.
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-teal-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Skills First</h4>
                    <p className="text-gray-400 text-sm">Assess technical abilities before scheduling interviews</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-teal-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Save Time</h4>
                    <p className="text-gray-400 text-sm">Focus on qualified candidates who meet your technical bar</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                      <Search className="w-4 h-4 text-teal-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Better Matches</h4>
                    <p className="text-gray-400 text-sm">Identify candidates with the right skills for your needs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto px-6 mt-12">
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800/50">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">How It Works</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center mt-1">
                    <span className="text-teal-400 text-sm font-medium">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Select & Generate</h4>
                    <p className="text-gray-400 text-sm mt-1">Choose your tech stack and difficulty level, then generate your quiz with one click.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center mt-1">
                    <span className="text-teal-400 text-sm font-medium">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Customize & Publish</h4>
                    <p className="text-gray-400 text-sm mt-1">Review the generated questions, make any adjustments, and publish your quiz.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center mt-1">
                    <span className="text-teal-400 text-sm font-medium">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Share Securely</h4>
                    <p className="text-gray-400 text-sm mt-1">Share the quiz link and secret key with candidates through email or job postings.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center mt-1">
                    <span className="text-teal-400 text-sm font-medium">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100">Analyze & Hire</h4>
                    <p className="text-gray-400 text-sm mt-1">Review detailed candidate results, compare scores, and invite top performers for interviews.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </>
  );
}