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
          <p className="text-lg text-muted-foreground">Last updated: October 29, 2025</p>
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
            <h2 className="text-2xl font-semibold mb-4">9. Refund & Subscription Policy</h2>
            <p className="mb-4">
              All payments for QuizzViz services are processed through Paddle.com, which serves as our authorized payment processor. Paddle provides secure payment processing services and handles all payment-related matters on our behalf.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">Subscription Terms</h3>
            <p className="mb-4">
              Subscriptions are billed according to the selected plan. By subscribing to our service, you authorize Paddle to charge the applicable subscription fees to your chosen payment method.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">Refund Consideration</h3>
            <p className="mb-4">
              We review refund requests on a case-by-case basis to ensure fairness. If you believe you’re entitled to a refund, please contact our support team with your purchase details and reason for the request. We’ll do our best to evaluate each situation reasonably and transparently.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">Non-Refundable Items</h3>
            <p className="mb-4">
              While most subscriptions are non-refundable once the current billing period has started, exceptions may be made in special cases such as accidental charges or technical issues. Please reach out to our support team, and we’ll review your case individually.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">Payment Processing</h3>
            <p className="mb-4">
              All payment transactions are processed by Paddle.com. By using our services, you agree to Paddle's{' '}
              <a href="https://paddle.com/legal/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="https://paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">Subscription Management</h3>
            <p className="mb-4">
              Currently, QuizzViz does not support in-app subscription management or automatic renewals. Subscriptions are non-recurring by default, meaning they will not automatically renew after the current billing period ends. 
              If you wish to continue using premium features after your subscription expires, you will need to manually subscribe again. Partial refunds are not provided.
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
