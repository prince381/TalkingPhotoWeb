/* eslint-disable @next/next/no-img-element */
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
        <div className='fixed -left-10 -z-10 hidden w-screen md:left-0 lg:block'>
          <img src='/images/domino.png' alt='background fixed image' />
        </div>
        <div className='flex min-h-[70vh] w-screen flex-col items-center justify-center'>
          <div className='mx-auto flex h-max min-h-[70vh] w-[95%] max-w-[1200px] flex-col py-20 md:flex-row md:items-center'>
            <div className='mb-8 flex flex-col items-center justify-center md:mr-10 md:mb-0 md:w-[50%]'>
              <h2 className='mb-5 text-5xl text-gray-800'>Want more?</h2>
              <p className='w-full max-w-[400px] text-center text-sm text-gray-800 md:text-base xl:max-w-[500px]'>
                Hey folks, it's Jason here! Let me introduce you to AllInPod.ai,
                an incredible AI audio experience created by the talented team
                at{' '}
                <a href='https://mycreativitybox.com' className='text-blue-500'>
                  My Creativity Box
                </a>
                . They heard our request on the All In podcast to come up with
                AI-generated rap songs featuring us - the Besties: Chamath,
                Sacks, and Friedberg. So, they designed this cutting-edge
                platform that lets you create personalized rap verses using our
                unique voices. Dive into this entertaining audio adventure and
                have a blast crafting your own lyrical masterpieces with
                AllInPod.ai. Give it a whirl, and unleash your creativity!
              </p>
            </div>
            <div className='group relative h-full min-h-[50vh] w-full md:h-[70vh] md:w-[50%]'>
              <video
                ref={introvid}
                src='https://firebasestorage.googleapis.com/v0/b/all-in-pod.appspot.com/o/premadeVideos%2FJ%20for%20allin.mp4?alt=media&token=59c8c501-d970-4b0f-b0d5-0a56ba2f8e39#t=0.001'
                className='h-full min-h-[50vh] w-full object-cover md:h-[70vh]'
                preload='metadata'
              ></video>
              {!playing ? (
                <i
                  className='fas fa-play z-1 absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white shadow-xl'
                  onClick={playVideo}
                ></i>
              ) : (
                <i
                  className='fas fa-pause z-1 absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100'
                  onClick={playVideo}
                ></i>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
