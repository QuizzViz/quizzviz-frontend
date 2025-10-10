import dynamic from 'next/dynamic';
import { Layout } from '@/components/ui/layout';

const Footer = dynamic(
  () => import('@/components/Footer').then((mod) => mod.Footer),
  { ssr: false, loading: () => <div className="h-16 bg-background" /> }
);

const AboutPage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-12">About Us</h1>
            <div className="prose prose-invert max-w-4xl mx-auto">
              <p className="text-lg text-gray-300 mb-6">
                QuizzViz is a powerful quiz creation and analysis platform designed to help educators, 
                trainers, and content creators build engaging quizzes and gain valuable insights from 
                participant responses.
              </p>
              <p className="text-lg text-gray-300">
                Our mission is to make quiz creation and analysis simple, intuitive, and effective 
                for everyone, from teachers to corporate trainers to content creators.
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </Layout>
  );
};

export default AboutPage;