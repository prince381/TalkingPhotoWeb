/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import { fetchVideoStatus, queryStore, VideoResponseType } from '@/lib/helper';

const getSavedVideos = async () => {
  try {
    const data = await queryStore('TalkingPhotos');
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export default function Videos() {
  const [videos, setVideos] = useState<VideoResponseType[]>([]);

  const { data: videoMetaData } = useQuery('premade', getSavedVideos);

  const getVideos = useCallback(() => {
    (async () => {
      if (videoMetaData) {
        const videoTasks = videoMetaData.map(async (video) => {
          const status = await fetchVideoStatus(video.video_id);
          return status;
        });
        const videoData = await Promise.all(videoTasks);
        setVideos(videoData);
      }
    })();
  }, [videoMetaData]);

  useEffect(() => {
    getVideos();
  }, [videoMetaData]);

  useEffect(() => {
    if (videos) {
      console.log(videos);
    }
  }, [videos]);

  return <div>Your videos will be previewed here.</div>;
}
