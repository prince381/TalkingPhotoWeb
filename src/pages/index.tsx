import { motion } from 'framer-motion';
import Link from 'next/link';
import * as React from 'react';

// import Loader from '@/components/Loader';
import Seo from '@/components/Seo';

export default function Home() {
  return (
    <>
      <Seo templateTitle='Home' />

      <main>
        <div className='flex h-screen w-screen flex-col items-center justify-center'>
          <div className='text-2xl'>Talking Photo</div>
          <Link href='/get-started'>
            <motion.button
              whileTap={{ scale: 1.05 }}
              whileHover={{ scale: 1.05 }}
              className=' mt-7 rounded-lg border border-gray-700 bg-gray-50 bg-opacity-10 px-5 py-1'
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </main>
    </>
  );
}
