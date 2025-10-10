import Head from 'next/head';
import {Footer} from '@/components/Footer';
const AboutPage = () => {
    return (
      <>
      <Head>
        <title>About | QuizzViz</title>
      </Head>
        <div className="mt-10 flex justify-center items-center h-screen">
        <h1 className="text-3xl font-bold">About</h1>
    </div>
    <Footer />
    </>
    );
};

export default AboutPage;