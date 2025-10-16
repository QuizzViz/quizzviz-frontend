import React from 'react';
import Head from 'next/head';
import { Navbar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Head>
        <title>Privacy Policy - QuizzViz</title>
        <meta name="description" content="QuizzViz Privacy Policy" />
      <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      
      <main className="flex-grow mt-12 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">Last updated: October 13, 2025</p>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm p-8 text-foreground">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              At QuizzViz, we collect information to provide better services to all our users. This includes:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Account information (name, email, profile picture)</li>
              <li className="mb-2">Quiz content and responses</li>
              <li className="mb-2">Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Provide, maintain, and improve our services</li>
              <li className="mb-2">Develop new features and functionality</li>
              <li className="mb-2">Communicate with you about your account and our services</li>
              <li className="mb-2">Ensure the security of our platform</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
            <p className="mb-4">
              We implement appropriate security measures to protect against unauthorized access, alteration, or destruction of your personal information.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">4. Changes to This Policy</h2>
            <p className="mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:syedshahmirsultan@gmail.com" className="text-blue-600 hover:underline">
                syedshahmirsultan@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
