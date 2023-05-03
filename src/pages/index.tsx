/* eslint-disable @next/next/no-img-element */
import { motion } from 'framer-motion';
import Link from 'next/link';
import * as React from 'react';

// import Loader from '@/components/Loader';
import Seo from '@/components/Seo';

export default function Home() {
  const [playing, setPlaying] = React.useState(false);
  const introvid = React.useRef<HTMLVideoElement>(null);

  const playVideo = () => {
    if (introvid.current) {
      if (playing) {
        introvid.current.pause();
        setPlaying(false);
      } else {
        introvid.current.play();
        setPlaying(true);
      }
    }
  };

  React.useEffect(() => {
    if (introvid.current) {
      introvid.current.addEventListener('ended', () => {
        setPlaying(false);
      });
    }
  }, []);

  return (
    <>
      <Seo templateTitle='Home' />
      <main>
        <div className='fixed -left-10 -z-10 w-screen md:left-0'>
          <img src='/images/domino.png' alt='background fixed image' />
        </div>
        <div className='flex h-screen w-screen flex-col items-center justify-center'>
          <div className='mx-auto flex h-max min-h-[70vh] w-[95%] max-w-[1200px] flex-col py-20 md:flex-row md:items-center'>
            <div className='mb-8 flex flex-col items-center justify-center md:mb-0 md:w-[50%]'>
              <h1 className='text-5xl md:text-[5rem] xl:text-[7rem]'>ALL-IN</h1>
              <h1 className='my-3 text-3xl md:my-5 md:text-[4rem] lg:my-10 xl:text-[6rem]'>
                PODCAST
              </h1>
              <h1 className='mb-5 text-5xl text-blue-500 md:text-[5rem] xl:mb-16 xl:text-[7rem]'>
                AI
              </h1>
              <Link href='/create'>
                <motion.button
                  whileTap={{ scale: 1.05 }}
                  whileHover={{ scale: 1.05 }}
                  className='rounded-5xl embed flex w-full max-w-[400px] cursor-pointer items-center justify-center self-center bg-blue-500 py-3 px-10 text-white md:py-5 md:px-12 xl:w-[250px]'
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
            <div className='group relative h-full max-h-[500px] min-h-[40vh] w-full md:fixed md:right-0 md:top-[50%] md:h-[90vh] md:max-h-[90vh] md:w-[50%] md:-translate-y-[50%]'>
              <video
                ref={introvid}
                src='https://firebasestorage.googleapis.com/v0/b/all-in-pod.appspot.com/o/premadeVideos%2Fallinone.mp4?alt=media&token=a966bce5-873f-445c-bf98-71f95fa3bf54#t=0.001'
                className='h-full max-h-[500px] w-full md:max-h-[90vh] xl:min-w-[800px]'
                preload='metadata'
                poster='/images/allinone.png'
                onContextMenu={(e) => e.preventDefault()}
              ></video>
              {!playing ? (
                <div className='z-1 absolute left-[50%] top-[50%] flex h-20 w-20 -translate-x-[50%] -translate-y-[50%] items-center justify-center rounded-full border-4 border-blue-500 md:-translate-x-[10%]'>
                  <i
                    className='fas fa-play cursor-pointer text-5xl text-blue-500 shadow-xl'
                    onClick={playVideo}
                  ></i>
                </div>
              ) : (
                <div className='z-1 absolute left-[50%] top-[50%] flex h-20 w-20 -translate-x-[50%] -translate-y-[50%] items-center justify-center rounded-full border-4 border-blue-500 opacity-0 transition-opacity group-hover:opacity-100 md:-translate-x-[10%]'>
                  <i
                    className='fas fa-pause cursor-pointer text-5xl text-blue-500 shadow-xl'
                    onClick={playVideo}
                  ></i>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
