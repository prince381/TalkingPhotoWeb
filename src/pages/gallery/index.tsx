/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { AudioData, deleteDocument, generateAudio } from '@/lib/helper';

import Loader from '@/components/Loader';

import { firestore } from '../../../firebase/firebase';

export default function Gallery() {
  const router = useRouter();
  const [tracks, setTracks] = useState<AudioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [audioOnPlay, setAudioOnPlay] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<AudioData | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const getSavedPodcasts = () => {
    try {
      const collectionRef = query(
        collection(firestore, 'AudioPodcasts'),
        orderBy('timestamp', 'desc')
      );
      onSnapshot(collectionRef, (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return { ...docData };
        });
        if (data.length > 0) setTracks(data as AudioData[]);
        else setLoading(false);
      });
    } catch (error) {
      console.log('Something went wrong while fetching saved podcasts:', error);
      setIsError(true);
    }
  };

  const playCurrentAudio = (src: string) => {
    const audio = document.getElementById('audioonplay') as HTMLAudioElement;
    audio.src = src;
    setAudioOnPlay(true);
    audio.oncanplaythrough = () => audio.play();
  };

  const removeAudio = async (id: string) => {
    try {
      const newTracks = [...tracks.filter((track) => track.audioId !== id)];
      setTracks(newTracks);
      await deleteDocument('AudioPodcasts', id);
    } catch (error) {
      console.log('Something went wrong while deleting audio:', error);
    }
  };

  const closeAudioModal = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = document.getElementById('audioonplay') as HTMLAudioElement;
    const modal = document.getElementById('audioModal') as HTMLDivElement;
    const target = e.target as HTMLElement;
    const content = modal.querySelector('#audioContainer') as HTMLDivElement;
    if (content.contains(target) && !target.classList.contains('fa-times'))
      return;
    audio.pause();
    audio.src = '';
    setAudioOnPlay(false);
    setCurrentAudio(null);
    // console.log(target);
  };

  const createTwitterShareContent = (id: string) => {
    const hashtags =
      'allinpodcast,davidsacks,jasoncalacanis,chamathpalihapitiya,davidfriedberg';
    const text = 'AI made All-in podcast Besties talks';
    const url = `${window.location.href}?track=${id}`;
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;
  };

  const shareToTwitter = (id: string) => {
    const url = createTwitterShareContent(id);
    window.open(url, '_blank');
  };

  const copyAudioLink = (id: string) => {
    const url = `${window.location.href}?track=${id}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
    }, 2000);
  };

  useEffect(() => {
    getSavedPodcasts();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (tracks && tracks.length > 0) {
          const unprocessedTracks = tracks.filter(
            (track) => track.status === 'processing'
          );
          if (unprocessedTracks.length > 0) {
            const tasks = unprocessedTracks.map(async (track) => {
              return await generateAudio(track);
              // return video;
            });
            await Promise.all(tasks);
          }
        }
      } catch (error) {
        console.log('Something went wrong while generating the audio:', error);
        setIsError(true);
      }
    })();

    if (router.query.track) {
      const id = router.query.track as string;
      const track = tracks.find((track) => track.audioId === id);
      if (track) {
        setCurrentAudio(track);
        setAudioOnPlay(true);
        playCurrentAudio(track.url as string);
      }
    }
  }, [tracks]);

  useEffect(() => {
    // console.log(tracks);
    if (tracks.length > 0 || isError) setLoading(false);
  }, [tracks, isError]);

  return (
    <>
      {/* <LoadingScreen loading={loading} /> */}
      <div className={`h-max w-screen ${audioOnPlay ? 'fixed z-10' : ''}`}>
        <div
          id='audioModal'
          className={`fixed left-0 top-0 z-[1000] flex h-screen w-screen items-center justify-center backdrop-blur-sm transition-all duration-300 ${
            audioOnPlay
              ? 'pointer-events-auto visible opacity-100'
              : 'pointer-events-none invisible opacity-0'
          }`}
          onClick={closeAudioModal}
        >
          <div
            id='audioContainer'
            className='relative h-max w-[90%] max-w-[900px] rounded-2xl bg-white p-5 shadow-md md:px-8'
          >
            <i
              className='fas fa-times absolute right-3 top-2 cursor-pointer text-xl text-black xxs:right-5 xxs:top-4 md:text-2xl'
              onClick={closeAudioModal}
            ></i>
            <div className='mb-8 mt-6 flex flex-col-reverse items-center justify-between xxs:mt-2 xxs:justify-start xs:flex-row'>
              <h2 className='mt-3 max-w-[400px] truncate text-base text-black xs:mt-0 md:text-lg xl:text-xl'>
                {currentAudio?.audioTitle || 'Untitled Audio'}
              </h2>
              <ul className='flex items-center justify-between xxs:ml-6'>
                <li className='mr-3 xxs:mr-5'>
                  <button
                    className='flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full bg-blue-500 p-2 text-white shadow-md sm:h-[40px] sm:w-[40px]'
                    onClick={() =>
                      shareToTwitter(currentAudio?.audioId as string)
                    }
                  >
                    <i className='fab fa-twitter text-sm sm:text-base md:text-lg'></i>
                  </button>
                </li>
                <li className='relative mr-3 xxs:mr-5'>
                  <span
                    className={`absolute left-[50%] -top-6 -translate-x-[50%] text-sm text-blue-500 transition-all ${
                      linkCopied ? 'visible opacity-100' : 'invisible opacity-0'
                    }`}
                  >
                    Copied
                  </span>
                  <button
                    className='flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full bg-blue-500 p-2 text-white shadow-md sm:h-[40px] sm:w-[40px]'
                    onClick={() =>
                      copyAudioLink(currentAudio?.audioId as string)
                    }
                  >
                    <i className='fas fa-copy text-sm sm:text-base md:text-lg'></i>
                  </button>
                </li>
              </ul>
            </div>
            <audio id='audioonplay' className='mb-6 w-full' controls></audio>
            <p className='text-sm text-black md:text-base'>
              Uploaded on{' '}
              {new Date(currentAudio?.timestamp as Date).toLocaleString()}
            </p>
          </div>
        </div>
        <div className='mx-auto w-[95%] max-w-[1200px] py-6 lg:flex lg:justify-between'>
          <div className='h-max w-full lg:mr-8'>
            <div className='flex items-center justify-between'>
              <h1 className='text-base md:text-2xl xl:text-4xl'>Podcasts</h1>
              <button
                className='flex cursor-pointer items-center md:text-base lg:hidden'
                onClick={() => setShowAudio(true)}
              >
                <span className='mr-2 inline-block'>Processing</span>
                <i className='fas fa-video'></i>
              </button>
            </div>
            {loading ? (
              <div className='body-embed flex min-h-[70vh] w-full items-center justify-center'>
                <Loader loading={loading} />
              </div>
            ) : null}
            {tracks.length === 0 && !loading ? (
              <div className='flex min-h-[70vh] w-full flex-col items-center justify-center'>
                <i className='fas fa-folder-open text-5xl text-gray-300'></i>
                <p className='mt-3 text-center text-base'>
                  You have no generated audio now! Audio you've created will
                  appear here.
                </p>
              </div>
            ) : null}
            {tracks.length > 0 && !loading ? (
              <div className='bg-main mt-8 h-max w-full rounded-2xl p-2 md:p-3'>
                <div className='grid h-max w-full grid-cols-1 gap-5 xs:grid-cols-2 md:grid-cols-3 lg:gap-8'>
                  {tracks
                    .filter((track) => track.status === 'completed')
                    .map((track: AudioData) => {
                      return (
                        <AudioCard
                          track={track}
                          canPlay={track.status === 'completed'}
                          canCopy={false}
                          canShare={false}
                          setCurrentAudio={setCurrentAudio}
                          playAudio={playCurrentAudio}
                          removeAudio={removeAudio}
                          key={track.audioId}
                        />
                      );
                    })}
                </div>
              </div>
            ) : null}
          </div>
          <div
            className={`aside card fixed right-0 top-[50%] z-50 h-[100%] w-[70%] max-w-[300px] -translate-y-[50%] overflow-y-auto overflow-x-hidden shadow-md lg:sticky lg:top-0 lg:z-0 lg:h-[85vh] lg:max-h-[700px] lg:translate-y-0 lg:translate-x-0 lg:rounded-2xl ${
              showAudio ? 'translate-x-0' : 'translate-x-full'
            } transition-all duration-300`}
          >
            <div className='mx-auto flex w-[90%] flex-col items-center py-5'>
              <div className='card relative flex w-full items-center justify-center'>
                <i
                  className='fas fa-chevron-right absolute left-0 text-xl lg:hidden'
                  onClick={() => setShowAudio(false)}
                ></i>
                <h2 className='text-base lg:text-xl'>Processing</h2>
              </div>
              <div className='mt-8 flex min-h-[] w-full max-w-[300px] flex-col items-center'>
                {tracks
                  .filter((track) => track.status !== 'completed')
                  .map((track: AudioData) => {
                    return (
                      <AudioCard
                        track={track}
                        canPlay={track.status === 'completed'}
                        canCopy={false}
                        canShare={false}
                        setCurrentAudio={setCurrentAudio}
                        playAudio={playCurrentAudio}
                        removeAudio={removeAudio}
                        key={track.audioId}
                      />
                    );
                  })}
                <button className='out-box flex h-max w-[250px] cursor-pointer flex-col items-center rounded-2xl p-10'>
                  <Link href='/create' className='inline-block h-max w-full'>
                    <i className='fas fa-microphone text-4xl'></i>
                    <span className='mt-5 inline-block text-base'>
                      Click here to generate a new audio
                    </span>
                  </Link>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const AudioCard = ({
  track,
  canPlay,
  canCopy,
  canShare,
  setCurrentAudio,
  playAudio,
  removeAudio,
}: {
  track: AudioData;
  canPlay: boolean;
  canCopy?: boolean;
  canShare?: boolean;
  setCurrentAudio?: React.Dispatch<any>;
  playAudio: (src: string) => void;
  removeAudio: (id: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className='video-card flex flex-col items-center'>
      <div className='card group relative h-max w-full max-w-[300px] rounded-md py-3 transition-all hover:shadow-lg'>
        <div
          className={`icons flex items-center justify-center px-3 group-hover:visible group-hover:opacity-100 lg:invisible lg:opacity-0 ${
            track.status === 'completed'
              ? 'visible opacity-100'
              : 'invisible opacity-0'
          }`}
        >
          {canShare && track.status !== 'failed' && (
            <button
              className='mr-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-blue-500 p-2 text-white'
              title='Download audio'
            >
              <i className='fab fa-twitter'></i>
            </button>
          )}
          {canCopy && track.status !== 'failed' && (
            <button
              className='mr-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-blue-500 p-2 text-white'
              onClick={() => {
                navigator.clipboard.writeText(track.url as string);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 2000);
              }}
              title='Copy video url'
              disabled={track.status === 'processing'}
            >
              {copied && (
                <span className='absolute -top-[22px] text-xs text-blue-500'>
                  Copied!
                </span>
              )}
              <i className='fas fa-copy'></i>
            </button>
          )}
          {track.status === 'failed' ? (
            <button
              className='flex h-[30px] w-[30px] items-center justify-center rounded-full bg-blue-500 p-2 text-white'
              title='Delete audio'
              onClick={() => removeAudio(track.audioId as string)}
            >
              <i className='fas fa-trash text-white'></i>
            </button>
          ) : null}
        </div>
        <div
          className='relative my-3 h-[150px] max-h-[150px] w-full cursor-pointer bg-black'
          onClick={() => {
            if (canPlay) {
              playAudio(track.url as string);
              setCurrentAudio ? setCurrentAudio(track) : null;
            }
          }}
        >
          <img
            src={track.talkingAvatar?.image_url}
            alt='track poster'
            className='mx-auto h-full w-[70%] object-cover'
          />
          {track.status === 'completed' ? (
            <i className='fas fa-play invisible absolute top-[50%] left-[50%] z-50 -translate-x-[50%] -translate-y-[50%] text-4xl text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100'></i>
          ) : null}
        </div>
        <div
          className={`mx-3 w-max py-1 px-2 ${
            track.status === 'completed'
              ? 'bg-blue-500'
              : track.status === 'failed'
              ? 'bg-red-500'
              : 'bg-gray-300'
          } flex items-center rounded-lg text-sm text-white`}
        >
          {track.status === 'completed' ? (
            <i className='fas fa-volume-up mr-2'></i>
          ) : null}
          {track.status}
        </div>
      </div>
      <div className='mx-auto flex flex-col items-center py-2.5'>
        {track.status === 'processing' ? (
          <p className='mb-2 text-center text-xs leading-tight text-gray-400'>
            Audio generation could take 3-5 minutes depending on your internet
            strength.
          </p>
        ) : null}
        <p className='max-w-[200px] truncate text-center text-base'>
          {track.audioTitle || track.audioId}
        </p>
        <p className='max-w-[200px] truncate text-center text-sm text-gray-500'>
          {new Date(track.timestamp as Date).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
