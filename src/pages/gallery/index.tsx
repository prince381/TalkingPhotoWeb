/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
import copy from 'copy-to-clipboard';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import {
  AudioData,
  deleteDocument,
  fetchVideoStatus,
  generateAudio,
  VideoData,
} from '@/lib/helper';

import AudioCard from '@/components/AudioCard';
import Loader from '@/components/Loader';
import Seo from '@/components/Seo';
import VideoCard from '@/components/VideoCard';

import { firestore } from '../../../firebase/firebase';

export default function Gallery() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tracks, setTracks] = useState<(AudioData & VideoData)[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [mediaOnPlay, setMediaOnPlay] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<
    (AudioData & VideoData) | null
  >(null);
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
          // check and add a type for the already saved podcasts
          if (docData.type) return { ...docData };
          return { ...docData, type: 'audio' };
        });
        if (data.length > 0) {
          // sort by timestamp
          const sortedData = data.sort((a: any, b: any) => {
            const aDate = new Date(a.timestamp);
            const bDate = new Date(b.timestamp);
            return bDate.getTime() - aDate.getTime();
          });
          setTracks(sortedData as (AudioData & VideoData)[]);
        } else setLoading(false);
      });
    } catch (error) {
      console.log('Something went wrong while fetching saved podcasts:', error);
      setIsError(true);
    }
  };

  const playCurrentMedia = (track: AudioData | VideoData | any) => {
    let media: HTMLAudioElement | HTMLVideoElement;
    if (track.type === 'audio') {
      media = document.getElementById('audioonplay') as HTMLAudioElement;
    } else {
      media = document.getElementById('videoonplay') as HTMLVideoElement;
    }

    media.src = track.url as string;
    media.load();
    setMediaOnPlay(true);

    media.oncanplay = async () => {
      setCanPlay(true);

      if (currentUser && currentUser.uid) {
        if (!track.opened && currentUser.uid === track.id) {
          const trackRef = doc(
            firestore,
            'AudioPodcasts',
            track.type === 'audio' ? track.audioId : track.videoId
          );
          await updateDoc(trackRef, { opened: true });
        }
      }
    };
  };

  const removeMedia = async (id: string, type: 'audio' | 'video') => {
    try {
      const newTracks = [
        ...tracks.filter((track) => {
          if (type === 'audio') return track.audioId !== id;
          return track.videoId !== id;
        }),
      ];
      setTracks(newTracks);
      await deleteDocument('AudioPodcasts', id);
    } catch (error) {
      console.log('Something went wrong while deleting audio:', error);
    }
  };

  // This is a comment

  const closeMediaModal = (e: React.MouseEvent<HTMLDivElement>) => {
    let media: HTMLAudioElement | HTMLVideoElement;
    if (currentMedia?.type === 'audio')
      media = document.getElementById('audioonplay') as HTMLAudioElement;
    else media = document.getElementById('videoonplay') as HTMLVideoElement;

    const modal = document.getElementById('mediaModal') as HTMLDivElement;
    const target = e.target as HTMLElement;
    const content = modal.querySelector('#mediaContainer') as HTMLDivElement;

    if (content.contains(target) && !target.classList.contains('fa-times'))
      return;

    media.pause();
    media.src = '';

    setMediaOnPlay(false);
    setCurrentMedia(null);
    setCanPlay(false);
    // console.log(target);
  };

  const shortenUrl = async (url: string) => {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    );
    const data = await response.text();
    return data;
  };

  const createTwitterShareContent = async (
    id: string,
    type: 'audio' | 'video'
  ) => {
    const hashtags =
      'allinpodcast,davidsacks,jasoncalacanis,chamathpalihapitiya,davidfriedberg';
    const text = 'AI made All-in podcast Besties talks';
    const url = `${window.location.href}?track=${id}&type=${type}`;
    const shareUrl = await shortenUrl(url);
    return `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}&hashtags=${hashtags}`;
  };

  const shareToTwitter = async (id: string, type: 'audio' | 'video') => {
    const url = await createTwitterShareContent(id, type);
    window.open(url, '_blank');
  };

  const copyMediaLink = async (id: string, type: 'audio' | 'video') => {
    const url = `${window.location.href}?track=${id}&type=${type}`;
    const shareUrl = await shortenUrl(url);
    copy(shareUrl);
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
    }, 2000);
    // navigator.clipboard.writeText(shareUrl).then(() => {
    // });
  };

  useEffect(() => {
    getSavedPodcasts();

    const userCred = Cookies.get('allinUserCred');
    if (userCred) {
      const user = JSON.parse(userCred);
      setCurrentUser(user);
    }
  }, []);

  // useEffect(() => {
  //   if (currentUser) console.log(currentUser);
  // }, [currentUser]);

  useEffect(() => {
    (async () => {
      try {
        if (tracks && tracks.length > 0) {
          const unprocessedTracks = tracks.filter(
            (track) => track.status === 'processing'
          );
          if (unprocessedTracks.length > 0) {
            const tasks = unprocessedTracks.map(async (track) => {
              if (track.type === 'audio') return await generateAudio(track);
              return await fetchVideoStatus(track.videoId, track.test || true);
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

    if (router.query.track && router.query.type) {
      const id = router.query.track as string;
      const type = router.query.type as string;
      const track = tracks.find((track) => {
        if (type === 'audio') return track.audioId === id;
        return track.videoId === id;
      });
      if (track) {
        console.log('current track', track);
        setCurrentMedia(track);
        setMediaOnPlay(true);
        setTimeout(() => {
          playCurrentMedia(track);
        }, 500);
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
      <Seo templateTitle='Gallery' />
      <div className='h-max w-screen'>
        <div
          id='mediaModal'
          className={`fixed left-0 top-0 z-[1000] flex h-screen w-screen items-center justify-center backdrop-blur-sm transition-all duration-300 ${
            mediaOnPlay
              ? 'pointer-events-auto visible opacity-100'
              : 'pointer-events-none invisible opacity-0'
          }`}
          onClick={closeMediaModal}
        >
          <div
            id='mediaContainer'
            className='relative h-max w-[90%] max-w-[900px] rounded-2xl bg-white p-5 shadow-md md:px-8'
          >
            <i
              className='fas fa-times absolute right-3 top-2 cursor-pointer text-xl text-black xxs:right-5 xxs:top-4 md:text-2xl'
              onClick={closeMediaModal}
            ></i>
            <div className='mb-8 mt-6 flex flex-col-reverse items-center justify-between xxs:mt-2 xxs:justify-start xs:flex-row'>
              <h2 className='mt-3 max-w-[400px] truncate text-base text-black xs:mt-0 md:text-lg xl:text-xl'>
                {(currentMedia?.type === 'audio'
                  ? currentMedia.audioTitle
                  : currentMedia?.videoTitle) || 'Untitled Podcast'}
              </h2>
              <ul className='flex items-center justify-between xxs:ml-6'>
                <li className='mr-3 xxs:mr-5'>
                  <button
                    className='flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full bg-blue-500 p-2 text-white shadow-md sm:h-[40px] sm:w-[40px]'
                    onClick={() => {
                      if (currentMedia?.type === 'audio')
                        shareToTwitter(
                          currentMedia?.audioId as string,
                          'audio'
                        );
                      else
                        shareToTwitter(
                          currentMedia?.videoId as string,
                          'video'
                        );
                    }}
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
                    onClick={() => {
                      if (currentMedia?.type === 'audio')
                        copyMediaLink(currentMedia?.audioId as string, 'audio');
                      else
                        copyMediaLink(currentMedia?.videoId as string, 'video');
                    }}
                  >
                    <i className='fas fa-copy text-sm sm:text-base md:text-lg'></i>
                  </button>
                </li>
              </ul>
            </div>
            {currentMedia?.type === 'video' ? (
              <div className='relative mb-6 w-full'>
                <video
                  id='videoonplay'
                  className={`relative mb-6 w-full ${
                    canPlay ? 'opacity-100' : 'opacity-50'
                  }`}
                  controls
                  preload='auto'
                  playsInline
                  controlsList='nodownload noremoteplayback noplaybackrate'
                  onContextMenu={(e) => e.preventDefault()}
                ></video>
                <img
                  src='/images/watermark.png'
                  alt='watermark'
                  className={`pointer-events-none absolute left-0 top-0 z-10 h-full w-full ${
                    canPlay ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            ) : (
              <audio
                id='audioonplay'
                className={`relative mb-6 w-full ${
                  canPlay ? 'opacity-100' : 'opacity-50'
                }`}
                controls
                preload='auto'
                playsInline
                controlsList='nodownload noremoteplayback noplaybackrate'
              ></audio>
            )}
            {!canPlay && (
              <img
                src='/images/loading.gif'
                alt='loader'
                className='absolute left-[50%] top-[50%] z-10 h-12 w-12 -translate-x-[50%] md:-translate-y-[20%]'
              />
            )}
            <p className='text-sm text-black md:text-base'>
              Uploaded on{' '}
              {new Date(currentMedia?.timestamp as Date).toLocaleString()}
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
                <i className='fas fa-chevron-right'></i>
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
                  You have no generated podcasts now! Podcasts you've created
                  will appear here.
                </p>
              </div>
            ) : null}
            {tracks.length > 0 && !loading ? (
              <div className='bg-main mt-8 h-max w-full rounded-2xl p-2 md:p-3'>
                <div className='grid h-max w-full grid-cols-1 gap-5 xs:grid-cols-2 md:grid-cols-3 lg:gap-8'>
                  {tracks
                    .filter((track) => track.status === 'completed')
                    .map((track) => {
                      return track.type === 'audio' ? (
                        <AudioCard
                          track={track}
                          canPlay={track.status === 'completed'}
                          opened={
                            currentUser && currentUser.uid === track.id
                              ? (track.opened as boolean)
                              : true
                          }
                          canCopy={true}
                          copyHandler={copyMediaLink}
                          canShare={true}
                          shareHandler={shareToTwitter}
                          setCurrentMedia={setCurrentMedia}
                          playMedia={playCurrentMedia}
                          removeMedia={removeMedia}
                          key={track.audioId}
                        />
                      ) : (
                        <VideoCard
                          track={track}
                          canPlay={track.status === 'completed'}
                          opened={
                            currentUser && currentUser.uid === track.id
                              ? (track.opened as boolean)
                              : true
                          }
                          canCopy={true}
                          copyHandler={copyMediaLink}
                          canShare={true}
                          shareHandler={shareToTwitter}
                          setCurrentMedia={setCurrentMedia}
                          playMedia={playCurrentMedia}
                          removeMedia={removeMedia}
                          key={track.videoId}
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
                  className='fas fa-chevron-left absolute left-0 text-xl lg:hidden'
                  onClick={() => setShowAudio(false)}
                ></i>
                <h2 className='text-base lg:text-xl'>Processing</h2>
              </div>
              <div className='mt-8 flex min-h-[] w-full max-w-[300px] flex-col items-center'>
                {tracks
                  .filter((track) => track.status !== 'completed')
                  .map((track) => {
                    return track.type === 'audio' ? (
                      <AudioCard
                        track={track}
                        canPlay={track.status === 'completed'}
                        opened={
                          currentUser && currentUser.uid === track.id
                            ? (track.opened as boolean)
                            : true
                        }
                        canCopy={false}
                        copyHandler={copyMediaLink}
                        canShare={false}
                        shareHandler={shareToTwitter}
                        setCurrentMedia={setCurrentMedia}
                        playMedia={playCurrentMedia}
                        removeMedia={removeMedia}
                        key={track.audioId}
                      />
                    ) : (
                      <VideoCard
                        track={track}
                        canPlay={track.status === 'completed'}
                        opened={
                          currentUser && currentUser.uid === track.id
                            ? (track.opened as boolean)
                            : true
                        }
                        canCopy={false}
                        copyHandler={copyMediaLink}
                        canShare={false}
                        shareHandler={shareToTwitter}
                        setCurrentMedia={setCurrentMedia}
                        playMedia={playCurrentMedia}
                        removeMedia={removeMedia}
                        key={track.videoId}
                      />
                    );
                  })}
                <button className='out-box flex h-max max-w-[250px] cursor-pointer flex-col items-center rounded-2xl p-10'>
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
