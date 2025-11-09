import React from 'react';
import Head from 'next/head';
import { Navbar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Head>
        <title>Terms of Service - QuizzViz</title>
        <meta name="description" content="QuizzViz Terms of Service" />
      </Head>

      <Navbar />
      
      <main className="flex-grow mt-12 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">Last updated: November 5, 2025</p>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm p-8 text-foreground">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using QuizzViz, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              QuizzViz provides an online, automated platform for creating, sharing, and analyzing quizzes. All services are delivered digitally without human involvement.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To access certain features, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
            <p className="mb-4">
              You retain ownership of any content you create or upload to QuizzViz. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content in connection with the service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">5. Prohibited Activities</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Use the service for any illegal purpose</li>
              <li className="mb-2">Upload or share content that is harmful, abusive, or violates any law</li>
              <li className="mb-2">Attempt to gain unauthorized access to our systems</li>
              <li className="mb-2">Interfere with the proper functioning of the service</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="mb-4">
              QuizzViz shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. We will provide notice of any changes by updating the "Last updated" date at the top of these Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-6">9. Refund & Subscription Policy</h2>
            
            <h3 className="text-xl font-semibold mb-3">14-Day Refund Guarantee</h3>
            <p className="mb-6">
              All standard purchases of QuizzViz services are fully refundable within 14 days of purchase.
            </p>

            <h3 className="text-xl font-semibold mb-3">Subscription Terms</h3>
            <p className="mb-6">
              Subscriptions are billed according to the selected plan. Currently, subscriptions are non-recurring by default, meaning they will not automatically renew at the end of the billing period. If you wish to continue using premium features after your subscription expires, you must manually subscribe again.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:syedshahmirsultan@gmail.com" className="text-blue-600 hover:underline">
                syedshahmirsultan@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
