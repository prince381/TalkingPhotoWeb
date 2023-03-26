/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import {
  deleteDocument,
  fetchVideoStatus,
  removeFromStorage,
  VideoResponseType,
} from '@/lib/helper';

import Loader from '@/components/Loader';

import { firestore } from '../../../firebase/firebase';

export default function Gallery() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoResponseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [videoOnPlay, setVideoOnPlay] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoResponseType | null>(
    null
  );

  const getSavedVideos = () => {
    const collectionRef = query(
      collection(firestore, 'TalkingPhotos'),
      orderBy('timestamp', 'desc')
    );
    onSnapshot(collectionRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        const id = doc.id;
        return { id, ...docData };
      });
      setVideos(data as VideoResponseType[]);
    });
  };

  const playCurrentVideo = (src: string) => {
    const video = document.getElementById('vidonplay') as HTMLVideoElement;
    video.src = src;
    setVideoOnPlay(true);
    video.oncanplaythrough = () => video.play();
  };

  const removeVideo = async (id: string) => {
    try {
      await deleteDocument('TalkingPhotos', id);
    } catch (error) {
      console.log('Something went wrong while deleting video:', error);
    }
  };

  const closeVideoModal = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = document.getElementById('vidonplay') as HTMLVideoElement;
    const modal = document.getElementById('vidModal') as HTMLDivElement;
    const target = e.target as HTMLElement;
    const content = modal.querySelector('#vidContainer') as HTMLDivElement;
    if (content.contains(target) && !target.classList.contains('fa-times'))
      return;
    video.pause();
    video.src = '';
    setVideoOnPlay(false);
    setCurrentVideo(null);
    // console.log(target);
  };

  useEffect(() => {
    getSavedVideos();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (videos && videos.length > 0) {
          const unprocessedVideos = videos.filter(
            (video) => video.status === 'processing'
          );
          if (unprocessedVideos.length > 0) {
            const tasks = unprocessedVideos.map(async (video) => {
              return await fetchVideoStatus(video.video_id);
              // return video;
            });
            await Promise.all(tasks);
          }
        }
      } catch (error) {
        console.log('Something went wrong while fetching video status:', error);
        setIsError(true);
      }
    })();
  }, [videos]);

  useEffect(() => {
    console.log(videos);
    if (videos.length > 0 || isError) setLoading(false);
  }, [videos, isError]);

  // Remove the temporary saved audio file from storage
  useEffect(() => {
    (async () => {
      console.log(router.query);
      const { storageRef, file } = router.query;
      if (storageRef && file) {
        await removeFromStorage(storageRef as string, file as string);
      }
    })();
  }, [router.query]);

  return (
    <>
      {/* <LoadingScreen loading={loading} /> */}
      <div className={`h-max w-screen ${videoOnPlay ? 'fixed z-10' : ''}`}>
        <div
          id='vidModal'
          className={`fixed left-0 top-0 z-[1000] flex h-screen w-screen items-center justify-center backdrop-blur-sm transition-all duration-300 ${
            videoOnPlay
              ? 'pointer-events-auto visible opacity-100'
              : 'pointer-events-none invisible opacity-0'
          }`}
          onClick={closeVideoModal}
        >
          <div
            id='vidContainer'
            className='relative h-max w-[90%] max-w-[1080px] rounded-2xl bg-white p-5 shadow-md md:px-8'
          >
            <i
              className='fas fa-times absolute right-3 top-2 cursor-pointer text-xl text-black xxs:right-5 xxs:top-4 md:text-2xl'
              onClick={closeVideoModal}
            ></i>
            <div className='mb-3 mt-5 flex items-center justify-between xxs:mt-2 xxs:justify-start'>
              <h2 className='text-base text-black md:text-lg xl:text-xl'>
                {currentVideo?.title || 'Untitled Video'}
              </h2>
              <ul className='flex items-center justify-between xxs:ml-6'>
                <li className='mr-3 xxs:mr-5'>
                  <button className='flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full bg-blue-500 p-2 text-white shadow-md sm:h-[40px] sm:w-[40px]'>
                    <i className='fab fa-twitter text-sm sm:text-base md:text-lg'></i>
                  </button>
                </li>
                <li className='relative mr-3 xxs:mr-5'>
                  <button className='flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full bg-blue-500 p-2 text-white shadow-md sm:h-[40px] sm:w-[40px]'>
                    <i className='fas fa-copy text-sm sm:text-base md:text-lg'></i>
                  </button>
                </li>
              </ul>
            </div>
            <video
              id='vidonplay'
              className='mb-4 h-[50vh] max-h-[400px] w-full object-fill md:h-[60vh] md:max-h-[600px]'
              controls
            ></video>
            <p className='text-sm text-black md:text-base'>
              Uploaded on{' '}
              {new Date(currentVideo?.timestamp as Date).toLocaleString()}
            </p>
          </div>
        </div>
        <div className='mx-auto w-[95%] max-w-[1200px] py-6 lg:flex lg:justify-between'>
          <div className='h-max w-full lg:mr-8'>
            <div className='flex items-center justify-between'>
              <h1 className='text-base md:text-2xl xl:text-4xl'>Videos</h1>
              <button
                className='flex cursor-pointer items-center md:text-base lg:hidden'
                onClick={() => setShowVideos(true)}
              >
                <span className='mr-2 inline-block'>Video list</span>
                <i className='fas fa-video'></i>
              </button>
            </div>
            {loading ? (
              <div className='body-embed flex min-h-[70vh] w-full items-center justify-center'>
                <Loader loading={loading} />
              </div>
            ) : null}
            {videos.length === 0 && !loading ? (
              <div className='flex min-h-[70vh] w-full flex-col items-center justify-center'>
                <i className='fas fa-folder-open text-5xl text-gray-300'></i>
                <p className='mt-3 text-center text-base'>
                  You have no videos now! Videos you create will appear here.
                </p>
              </div>
            ) : null}
            {videos.length > 0 && !loading ? (
              <div className='bg-main mt-8 h-max w-full rounded-2xl p-2 md:p-3'>
                <div className='grid h-max w-full grid-cols-1 gap-5 xs:grid-cols-2 md:grid-cols-3 lg:gap-8'>
                  {videos
                    .filter((video) => video.status === 'completed')
                    .map((video: VideoResponseType) => {
                      return (
                        <VideoCard
                          video={video}
                          canPlay={video.status === 'completed'}
                          canCopy={false}
                          canShare={false}
                          setCurrentVideo={setCurrentVideo}
                          playVideo={playCurrentVideo}
                          removeVideo={removeVideo}
                          key={video.id}
                        />
                      );
                    })}
                </div>
              </div>
            ) : null}
          </div>
          <div
            className={`aside card fixed right-0 top-[50%] z-50 h-[100%] w-[70%] max-w-[300px] -translate-y-[50%] overflow-y-auto overflow-x-hidden shadow-md lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-y-0 lg:translate-x-0 lg:rounded-2xl ${
              showVideos ? 'translate-x-0' : 'translate-x-full'
            } transition-all duration-300`}
          >
            <div className='mx-auto flex w-[90%] flex-col items-center py-5'>
              <div className='card relative flex w-full items-center justify-center'>
                <i
                  className='fas fa-chevron-right absolute left-0 text-xl lg:hidden'
                  onClick={() => setShowVideos(false)}
                ></i>
                <h2 className='text-base lg:text-xl'>Your videos</h2>
              </div>
              <div className='mt-8 flex min-h-[] w-full max-w-[300px] flex-col items-center'>
                {videos
                  .filter((video) => video.status !== 'completed')
                  .map((video: VideoResponseType) => {
                    return (
                      <VideoCard
                        video={video}
                        canPlay={video.status === 'completed'}
                        canCopy={true}
                        canShare={true}
                        playVideo={playCurrentVideo}
                        removeVideo={removeVideo}
                        key={video.id}
                      />
                    );
                  })}
                <button className='out-box flex h-max w-[250px] cursor-pointer flex-col items-center rounded-2xl p-10'>
                  <Link
                    href='/get-started'
                    className='inline-block h-max w-full'
                  >
                    <i className='fas fa-microphone text-4xl'></i>
                    <span className='mt-5 inline-block text-base'>
                      Click here to generate a new video
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

const VideoCard = ({
  video,
  canPlay,
  canCopy,
  canShare,
  setCurrentVideo,
  playVideo,
  removeVideo,
}: {
  video: VideoResponseType;
  canPlay: boolean;
  canCopy?: boolean;
  canShare?: boolean;
  setCurrentVideo?: React.Dispatch<any>;
  playVideo: (src: string) => void;
  removeVideo: (id: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className='video-card flex flex-col items-center'>
      <div className='card group relative h-max w-full max-w-[300px] rounded-md py-3 transition-all hover:shadow-lg'>
        <div
          className={`icons flex items-center justify-center px-3 group-hover:visible group-hover:opacity-100 lg:invisible lg:opacity-0 ${
            video.status === 'completed'
              ? 'visible opacity-100'
              : 'invisible opacity-0'
          }`}
        >
          {canShare && video.status !== 'failed' && (
            <button
              className='mr-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-blue-500 p-2 text-white'
              title='Download video'
            >
              <i className='fab fa-twitter'></i>
            </button>
          )}
          {canCopy && video.status !== 'failed' && (
            <button
              className='mr-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-blue-500 p-2 text-white'
              onClick={() => {
                navigator.clipboard.writeText(video.video_url as string);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 2000);
              }}
              title='Copy video url'
              disabled={video.status === 'processing'}
            >
              {copied && (
                <span className='absolute -top-[22px] text-xs text-blue-500'>
                  Copied!
                </span>
              )}
              <i className='fas fa-copy'></i>
            </button>
          )}
          {video.status === 'failed' ? (
            <button
              className='flex h-[30px] w-[30px] items-center justify-center rounded-full bg-blue-500 p-2 text-white'
              title='Delete video'
              onClick={() => removeVideo(video.id as string)}
            >
              <i className='fas fa-trash text-white'></i>
            </button>
          ) : null}
        </div>
        <div
          className='relative my-3 h-[150px] max-h-[150px] w-full cursor-pointer bg-black'
          onClick={() => {
            if (canPlay) {
              playVideo(video.video_url as string);
              setCurrentVideo ? setCurrentVideo(video) : null;
            }
          }}
        >
          <img
            src={video.talking_photo?.image_url}
            alt='video poster'
            className='mx-auto h-full w-[70%] object-cover'
          />
          {video.status === 'completed' ? (
            <i className='fas fa-play invisible absolute top-[50%] left-[50%] z-50 -translate-x-[50%] -translate-y-[50%] text-4xl text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100'></i>
          ) : null}
        </div>
        <div
          className={`mx-3 w-max py-1 px-2 ${
            video.status === 'completed'
              ? 'bg-blue-500'
              : video.status === 'failed'
              ? 'bg-red-500'
              : 'bg-gray-300'
          } flex items-center rounded-lg text-sm text-white`}
        >
          {video.status === 'completed' ? (
            <i className='fas fa-video mr-2'></i>
          ) : null}
          {video.status}
        </div>
      </div>
      <div className='mx-auto flex flex-col items-center py-2.5'>
        {video.status === 'processing' ? (
          <p className='mb-2 text-center text-xs leading-tight text-gray-400'>
            Video generation could take 3-5 minutes depending on your internet
            strength.
          </p>
        ) : null}
        <p className='max-w-[200px] truncate text-center text-base'>
          {video.title || video.id}
        </p>
        <p className='max-w-[200px] truncate text-center text-sm text-gray-500'>
          {new Date(video.timestamp as Date).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
