/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
import { DocumentData } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import {
  deleteDocument,
  fetchVideoStatus,
  purgeStorage,
  queryStore,
  VideoMetaData,
  VideoResponseType,
} from '@/lib/helper';

import Loader from '@/components/Loader';

export default function Gallery() {
  const [videos, setVideos] = useState<VideoResponseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoOnPlay, setVideoOnPlay] = useState(false);

  const getSavedVideos = async () => {
    try {
      const data = await queryStore('TalkingPhotos');
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const {
    data: videoMetaData,
    isError,
    error,
  } = useQuery('metadata', getSavedVideos);

  if (isError) {
    console.log(error);
    setLoading(false);
  }

  const playCurrentVideo = (src: string) => {
    const video = document.getElementById('vidonplay') as HTMLVideoElement;
    video.src = src;
    setVideoOnPlay(true);
  };

  const removeVideo = async (id: string) => {
    try {
      const filteredVideos = videos.filter((vid) => vid.id !== id);
      setVideos(filteredVideos);
      await deleteDocument('TalkingPhotos', id);
    } catch (error) {
      console.log('Something went wrong while deleting video:', error);
    }
  };

  const closeVideoModal = (e: React.MouseEvent<HTMLDivElement>) => {
    const modal = document.getElementById('vidModal') as HTMLDivElement;
    const target = e.target as HTMLElement;
    const content = modal.querySelector('#vidContainer') as HTMLDivElement;
    if (content.contains(target)) return;
    setVideoOnPlay(false);
    console.log(target);
  };

  useEffect(() => {
    (async () => {
      if (videoMetaData && videoMetaData.length > 0) {
        const videoTasks = videoMetaData.map(async (video) => {
          // console.log(video)
          const status = await fetchVideoStatus(video.video_id);
          return status;
        });
        const videoData = await Promise.all(videoTasks);
        const availableVideos = videoData.filter((vid) => vid !== null);
        setVideos(availableVideos);
        setLoading(false);
      } else setLoading(false);
    })();
  }, [videoMetaData]);

  useEffect(() => {
    (async () => {
      // console.log(videos)
      if (videos.length > 0 && videoMetaData) {
        const fileList = videoMetaData.map(
          (meta: DocumentData) => `${meta.talking_photo.id}.mp3`
        );
        await purgeStorage('generatedPodcasts', fileList);
      }
    })();
  }, [videos]);

  return (
    <>
      {/* <LoadingScreen loading={loading} /> */}
      <div className={`h-max w-screen ${videoOnPlay ? 'fixed z-10' : ''}`}>
        <div className='mx-auto h-max w-[95%] max-w-[1200px] py-6'>
          <h1 className='text-base'>Videos</h1>
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
            <div className='embed flex min-h-[70vh] w-full items-center justify-center'>
              <Loader loading={loading} />
            </div>
          ) : (
            <div
              className={`mt-8 h-max w-full ${
                videoMetaData && videos.length > 0
                  ? 'grid grid-cols-1 gap-5 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-8'
                  : ''
              }`}
            >
              {videoMetaData && videos.length > 0 ? (
                videos.map((video: VideoResponseType, index: number) => {
                  return (
                    <VideoCard
                      video={video}
                      metadata={videoMetaData[index] as VideoMetaData}
                      playVideo={playCurrentVideo}
                      removeVideo={removeVideo}
                      key={video.id}
                    />
                  );
                })
              ) : (
                <div className='flex min-h-[70vh] w-full flex-col items-center justify-center'>
                  <i className='fas fa-folder-open text-5xl text-gray-300'></i>
                  <p className='mt-3 text-center text-base'>
                    You have no videos now! Videos you create will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const VideoCard = ({
  video,
  metadata,
  playVideo,
  removeVideo,
}: {
  video: VideoResponseType;
  metadata: VideoMetaData;
  playVideo: (src: string) => void;
  removeVideo: (id: string) => void;
}) => {
  return (
    <div className='flex flex-col items-center'>
      <div className='card group relative h-max w-full max-w-[300px] rounded-md py-3 transition-all hover:shadow-lg'>
        <div className='flex items-center justify-end px-3 group-hover:visible group-hover:opacity-100 lg:invisible lg:opacity-0'>
          <a
            href={video.video_url}
            download
            className='icon-light mr-2.5 flex items-center justify-center rounded-md p-2'
            title='Download video'
          >
            <i className='fas fa-download text-white'></i>
          </a>
          <button
            className='icon-light mr-2.5 flex items-center justify-center rounded-md p-2'
            onClick={() =>
              navigator.clipboard.writeText(video.video_url as string)
            }
            title='Copy video url'
          >
            <i className='fas fa-copy text-white'></i>
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
          className='relative my-3 h-full max-h-[150px] w-full cursor-pointer bg-black'
          onClick={() => playVideo(video.video_url as string)}
        >
          <img
            src={metadata.talking_photo.image_url}
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
      <div className='mx-auto flex max-w-[200px] flex-col items-center py-5'>
        <p className='w-full truncate text-center text-base'>{video.id}</p>
        <p className='w-full truncate text-center text-sm text-gray-500'>
          {new Date(metadata.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
