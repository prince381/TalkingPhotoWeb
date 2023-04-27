/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';

import { VideoData } from '@/lib/helper';

interface VideoCardProps {
  track: VideoData;
  canPlay: boolean;
  canCopy?: boolean;
  copyHandler?: (id: string, type: 'audio' | 'video') => void;
  canShare?: boolean;
  shareHandler?: (id: string, type: 'audio' | 'video') => void;
  setCurrentMedia?: React.Dispatch<any>;
  playMedia: (src: string, type: 'audio' | 'video') => void;
  removeMedia: (id: string, type: 'audio' | 'video') => void;
}

export default function VideoCard({
  track,
  canPlay,
  canCopy,
  copyHandler,
  canShare,
  shareHandler,
  setCurrentMedia,
  playMedia,
  removeMedia,
}: VideoCardProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className='video-card flex flex-col items-center'>
      <div className='card group relative h-max w-full max-w-[300px] rounded-md py-3 transition-all hover:shadow-lg'>
        <div
          className='relative my-3 h-[150px] max-h-[150px] w-full cursor-pointer bg-black'
          onClick={() => {
            if (canPlay) {
              setCurrentMedia ? setCurrentMedia(track) : null;
              setTimeout(() => {
                playMedia(track.url as string, 'video');
              }, 500);
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
        <div className='flex justify-between'>
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
              <i className='fas fa-video'></i>
            ) : null}
            {track.status !== 'completed' ? track.status : ''}
          </div>
          <div className='flex w-max items-center justify-center px-3'>
            {canShare && track.status !== 'failed' && (
              <button
                className='flex cursor-pointer items-center justify-center text-blue-500'
                title='Download audio'
                onClick={() => {
                  if (shareHandler)
                    shareHandler(track.videoId as string, 'video');
                }}
              >
                <i className='fab fa-twitter text-base'></i>
              </button>
            )}
            {canCopy && track.status !== 'failed' && (
              <button
                className='relative mx-3 flex cursor-pointer items-center justify-center text-blue-500'
                onClick={() => {
                  if (copyHandler)
                    copyHandler(track.videoId as string, 'video');
                  setCopied(true);
                  setTimeout(() => {
                    setCopied(false);
                  }, 2000);
                }}
                title='Copy video url'
                disabled={track.status === 'processing'}
              >
                {copied && (
                  <span className='absolute -top-4 cursor-pointer text-sm text-blue-400'>
                    Copied!
                  </span>
                )}
                <i className='fas fa-copy text-base'></i>
              </button>
            )}
            {track.status === 'failed' ? (
              <button
                className='flex items-center justify-center text-base text-red-500'
                title='Delete audio'
                onClick={() => removeMedia(track.videoId as string, 'video')}
              >
                <i className='fas fa-trash'></i>
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className='mx-auto flex flex-col items-center py-2.5'>
        {track.status === 'processing' ? (
          <p className='mb-2 text-center text-xs leading-tight text-gray-400'>
            Video generation could take 5-10 minutes depending on your internet
            strength.
          </p>
        ) : null}
        <p className='max-w-[200px] truncate text-center text-base'>
          {track.videoTitle || track.videoId}
        </p>
        <p className='max-w-[200px] truncate text-center text-sm text-gray-500'>
          {new Date(track.timestamp as Date).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
