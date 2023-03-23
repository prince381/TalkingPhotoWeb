/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
import { collection, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import {
  deleteDocument,
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

  const getSavedVideos = () => {
    const collectionRef = collection(firestore, 'TalkingPhotos');
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
    if (content.contains(target)) return;
    video.pause();
    video.src = '';
    setVideoOnPlay(false);
    // console.log(target);
  };

  useEffect(() => {
    getSavedVideos();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (videos && videos.length > 0) {
          const processedVideos = videos.filter(
            (video) => video.video_url && !video.watermarked_url
          );
          if (processedVideos.length > 0) {
            const tasks = processedVideos.map(async (video) => {
              // return await fetchVideoStatus(video.video_id);
              return video;
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
        <div className='mx-auto h-max w-[95%] max-w-[1200px] py-6'>
          <h1 className='text-base md:text-2xl xl:text-4xl'>Videos</h1>
          <div
            id='vidModal'
            className={`modal fixed left-0 top-0 z-[1000] flex h-screen w-screen items-center justify-center ${
              videoOnPlay
                ? 'pointer-events-auto visible opacity-100'
                : 'pointer-events-none invisible opacity-0'
            } transition-all`}
            onClick={closeVideoModal}
          >
            <button className='z-1 absolute top-8 right-8 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white lg:h-10 lg:w-10'>
              <i className='fas fa-times text-xl text-white'></i>
            </button>
            <div
              id='vidContainer'
              className='h-[50vh] max-h-[900px] w-[90%] max-w-[1080px] bg-blue-500 p-1 shadow-md md:h-[70vh]'
            >
              <video
                id='vidonplay'
                className='h-full w-full object-fill'
                controls
              ></video>
            </div>
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
            <div className='mt-8 grid h-max w-full grid-cols-1 gap-5 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-8'>
              {videos.map((video: VideoResponseType) => {
                return (
                  <VideoCard
                    video={video}
                    playVideo={playCurrentVideo}
                    removeVideo={removeVideo}
                    key={video.id}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

const VideoCard = ({
  video,
  playVideo,
  removeVideo,
}: {
  video: VideoResponseType;
  playVideo: (src: string) => void;
  removeVideo: (id: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className='flex flex-col items-center'>
      <div className='card group relative h-max w-full max-w-[300px] rounded-md py-3 transition-all hover:shadow-lg'>
        <div className='flex items-center justify-end px-3 group-hover:visible group-hover:opacity-100 lg:invisible lg:opacity-0'>
          {/* <a
            href={video.video_url}
            download
            className='icon-light mr-2.5 flex items-center justify-center rounded-md p-2'
            title='Download video'
          >
            <i className='fas fa-download text-white'></i>
          </a> */}
          <button
            className={`icon-light mr-2.5 flex items-center justify-center rounded-md p-2 ${
              copied ? 'text-blue-500' : 'text-white'
            }`}
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
              <span className='absolute -top-[10px] text-xs text-blue-500'>
                Copied!
              </span>
            )}
            <i className='fas fa-copy'></i>
          </button>
          <button
            className='icon-light flex items-center justify-center rounded-md p-2'
            title='Delete video'
            onClick={() => removeVideo(video.id as string)}
          >
            <i className='fas fa-trash text-white'></i>
          </button>
        </div>
        <div
          className='relative my-3 h-[150px] max-h-[150px] w-full cursor-pointer bg-black'
          onClick={() => playVideo(video.video_url as string)}
        >
          <img
            src={video.talking_photo?.image_url}
            alt='video poster'
            className='mx-auto h-full w-[70%] object-cover'
          />
          <i className='fas fa-play invisible absolute top-[50%] left-[50%] z-50 -translate-x-[50%] -translate-y-[50%] text-4xl text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100'></i>
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
            Video generation could take up to 3-5 minutes depending on your
            internet strength.
          </p>
        ) : null}
        <p className='max-w-[200px] truncate text-center text-base'>
          {video.id}
        </p>
        <p className='max-w-[200px] truncate text-center text-sm text-gray-500'>
          {new Date(video.timestamp as Date).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
