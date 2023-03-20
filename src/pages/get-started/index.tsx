/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable no-console */
import { doc, DocumentData, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Image from 'next/image';
import { useRouter } from 'next/router';
import banner from 'public/images/music-banner.jpg';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import {
  createVideo,
  fetchPhotos,
  fetchVoices,
  getVoiceOver,
  queryStore,
  VideoPayloadType,
} from '@/lib/helper';

import Loader from '@/components/Loader';

import { firestore, storage } from '../../../firebase/firebase';

const getPremadeVideos = async () => {
  try {
    const data = await queryStore('premade');
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

type Photo = {
  circle_image: string;
  id: string;
  image_url: string;
  is_preset?: boolean;
};

export default function GetStarted() {
  // const [mode, setMode] = useState('dark');
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState<Photo>({} as Photo);
  const [talkingAvatar, setTalkingAvatar] = useState<Photo>({} as Photo);
  const [videoPreview, selectVideoPreview] = useState<DocumentData>(
    {} as DocumentData
  );

  const [inputText, setInputText] = useState('');
  const [videoName, setVideoName] = useState('');
  const [vidOnPlay, setVidOnPlay] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const premadeVideos = [
    {
      title: 'Started from the bottom',
      artiste: 'Drake',
      id: 'started_from_the_bottom',
    },
    { title: 'Mockingbird', artiste: 'Eminem', id: 'mockingbird' },
    {
      title: 'Amari',
      artiste: 'J Cole',
      id: 'amari',
    },
    { title: 'Mockingbird', artiste: 'Eminem', id: 'mockingbird1' },
  ];

  const { data: photos, isLoading: loadingPhotos } = useQuery(
    'photos',
    fetchPhotos
  );

  const { data: premade, isLoading: loadingPremade } = useQuery(
    'premade',
    getPremadeVideos
  );

  const { data: voices } = useQuery('voices', fetchVoices);

  useEffect(() => {
    if (photos && premade) {
      // console.log(premade, photos);
      const avatars = photos.filter((photo: Photo) => !photo.is_preset);
      if (selectedAvatar.id && videoName) return;
      setSelectedAvatar(avatars[0]);
      setVideoName(premadeVideos[0].id);
    }
  }, [premade, photos]);

  useEffect(() => {
    if (selectedAvatar.id && premade) {
      const video = premade.find(
        (doc) => doc.id === selectedAvatar.id
      ) as DocumentData;
      selectVideoPreview(video);
    }
  }, [selectedAvatar]);

  // useEffect(() => {
  //   console.log(voices)
  // }, [voices])

  const getName = (id: string) => {
    if (premade) {
      const doc = premade.find((doc) => doc.id === id);
      const name = doc ? doc.name : 'Avatar Name';
      return name;
    } else return 'Avatar Name';
  };

  const playCurrentVideo = (id: string) => {
    const videoFiles = document.querySelectorAll('video');
    videoFiles.forEach((video) => {
      if (video.id === id) {
        if (video.paused) {
          video.play();
          setVidOnPlay(id);
        } else {
          video.pause();
          setVidOnPlay('');
        }
      } else {
        video.pause();
        video.currentTime = 0.0;
      }
    });
  };

  const sendVideo = async (avatar_id: string, audio: string) => {
    if (!avatar_id || !audio) return;
    const payload: VideoPayloadType = {
      background: '#000000',
      clips: [
        {
          talking_photo_id: avatar_id,
          talking_photo_style: 'normal',
          input_audio: audio,
          scale: 1,
        },
      ],
      ratio: '16:9',
      test: true,
      version: 'v1alpha',
    };

    try {
      const response = await createVideo(payload);
      const { talking_photo_id, video_id, timestamp } = response;
      const avatar = photos.find(
        (photo: Photo) => photo.id === talking_photo_id
      );

      if (avatar) {
        const _doc = doc(firestore, `TalkingPhotos/${video_id}`);
        await setDoc(_doc, {
          talking_photo: avatar,
          timestamp,
          video_id,
        });
        setLoading(false);
        router.push('/videos');
        // console.log('Video uploaded successfully and will complete soon', response);
      } else {
        setLoading(false);
        throw new Error('Something went wrong while saving data to firestore');
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const generateVideo = async () => {
    if (!inputText && !talkingAvatar.id) return;
    console.log(inputText, talkingAvatar);
    setLoading(true);
    try {
      const target = premade?.find((doc) => doc.id === talkingAvatar.id);
      if (target) {
        const targetName = target.name.toLowerCase();
        const targetVoice = voices.find(
          (voice: any) =>
            voice.category === 'cloned' && voice.name === targetName
        );
        const voiceBlob = await getVoiceOver(inputText, targetVoice.voice_id);
        const audioRef = ref(
          storage,
          `generatedPodcasts/${talkingAvatar.id}.mp3`
        );
        await uploadBytes(audioRef, voiceBlob);
        const audioUrl = await getDownloadURL(audioRef);
        await sendVideo(talkingAvatar.id, audioUrl);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      throw error;
    }
  };

  return (
    <>
      {/* <LoadingScreen loading={loadingPhotos && loadingPremade} /> */}
      <div className='mx-auto h-max w-[95%] max-w-[1200px] py-10'>
        <div className='flex h-max w-full flex-col items-center'>
          <div className='card flex h-max w-full flex-col items-center rounded-lg px-2.5 py-4 shadow-sm xs:px-4 md:flex-row lg:px-10 lg:py-6 xl:py-10'>
            <div className='h-full w-full md:h-fit md:w-[60%]'>
              <h2 className='mb-3 text-base lg:mb-5'>Choose the speaker:</h2>
              <div className='grid grid-cols-1 gap-2 xs:flex xs:gap-0'>
                <div className='h-max w-full overflow-x-auto px-2 py-2.5 xs:mr-2.5 xs:w-max xs:overflow-x-hidden'>
                  <div className='m-auto flex h-max w-max items-center xs:h-full xs:flex-col xs:items-start lg:m-0'>
                    {photos
                      ? photos
                          .filter((photo: Photo) => !photo.is_preset)
                          .map((photo: Photo, index: number) => (
                            <div
                              className='mr-4 mb-4 cursor-pointer rounded-full bg-gray-300 outline outline-4 outline-blue-900 last:mr-0 lg:last:mb-0'
                              key={photo.id}
                              title={getName(photo.id)}
                              onClick={() => {
                                setSelectedAvatar(photo);
                                setVideoLoaded(false);
                                setVidOnPlay('');
                              }}
                            >
                              <img
                                src={photo.circle_image}
                                alt='avatar photo'
                                className={`max-h-[60px] min-h-[60px] min-w-[60px] max-w-[60px] rounded-full ${
                                  selectedAvatar.id === photo.id
                                    ? 'grayscale-0'
                                    : 'grayscale'
                                }`}
                              />
                            </div>
                          ))
                      : [0, 1, 2, 3].map((num: number) => (
                          <div
                            key={num}
                            className='skeleton-load mr-2.5 mb-2 max-h-[60px] min-h-[60px] min-w-[60px] max-w-[60px] rounded-full last:mr-0'
                          ></div>
                        ))}
                  </div>
                </div>
                <div
                  className={`relative h-full max-h-[300px] min-h-[300px] w-full max-w-[530px] lg:max-h-[310px] ${
                    videoPreview && videoPreview[videoName] && videoLoaded
                      ? 'border-2 border-blue-400'
                      : ''
                  } overflow-hidden rounded-lg transition-all`}
                >
                  {videoPreview && videoPreview[videoName] ? (
                    <video
                      src={videoPreview[videoName]}
                      id='premade-vid'
                      className='h-full max-h-[300px] min-h-[300px] w-full max-w-[530px] object-cover lg:max-h-[310px]'
                      onCanPlayThrough={() => {
                        console.log('video loaded ....');
                        setVideoLoaded(true);
                      }}
                    ></video>
                  ) : (
                    <div className='skeleton-load absolute left-0 top-0 z-10 h-full w-full lg:max-h-[310px]'></div>
                  )}
                  {!videoLoaded ? (
                    <div className='skeleton-load absolute left-0 top-0 z-10 h-full w-full lg:max-h-[310px]'></div>
                  ) : null}
                  {vidOnPlay !== 'premade-vid' ? (
                    <i
                      className='fas fa-play absolute left-[50%] top-[50%] z-50 -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white shadow-xl'
                      onClick={() => playCurrentVideo('premade-vid')}
                    ></i>
                  ) : (
                    <i
                      className='fas fa-pause absolute left-[50%] top-[50%] z-50 -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white shadow-xl'
                      onClick={() => playCurrentVideo('premade-vid')}
                    ></i>
                  )}
                </div>
              </div>
            </div>
            <div className='mt-5 h-max w-full md:mt-0 md:ml-3 md:w-[40%]'>
              <h2 className='mb-3 text-base'>Choose the music:</h2>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2'>
                {photos && premade
                  ? premadeVideos.map((vid) => (
                      <div
                        className={`relative flex max-h-[150px] flex-col p-1 ${
                          videoName === vid.id
                            ? 'card-selected bg-blue-500'
                            : 'sub-card'
                        } group cursor-pointer rounded-lg shadow-sm`}
                        key={vid.id}
                        onClick={() => {
                          setVideoName(vid.id);
                          setVidOnPlay('');
                        }}
                      >
                        <div className='h-[50%] max-h-[70px] w-full overflow-hidden rounded-t-lg lg:max-h-[130px]'>
                          <Image
                            src={banner}
                            alt='music banner'
                            className='h-full max-h-[100px] w-full bg-top object-cover transition-all duration-200 group-hover:scale-110 lg:max-h-[130px]'
                            priority
                          />
                        </div>
                        <div className='p-2'>
                          <p className='text-sm'>{vid.artiste}</p>
                          <h4 className='truncate text-sm'>{vid.title}</h4>
                        </div>
                      </div>
                    ))
                  : [0, 1, 2, 3].map((num: number) => (
                      <div
                        key={num}
                        className='skeleton-load h-full min-h-[130px] w-full min-w-[140px] rounded-lg'
                      ></div>
                    ))}
              </div>
            </div>
          </div>
          <div className='mt-8 flex h-max w-full flex-col items-center md:items-start lg:flex-row'>
            <div className='mb-5 h-max w-full rounded-lg  bg-blue-500 py-3 px-4 shadow-sm md:py-5 md:px-8 lg:mb-0 lg:mr-4 lg:h-[580px] lg:w-[40%] lg:py-8'>
              <div className='flex h-max w-full flex-col'>
                <h2 className='mb-4 text-base text-white'>Want more?</h2>
                <p className='text-gray-100'>
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                  Laudantium maxime, commodi numquam minima cum tempore est
                  aliquam hic odit esse aperiam neque pariatur obcaecati itaque
                  voluptas adipisci ab ipsa accusamus natus quam rerum modi
                  provident, cupiditate dolorem.
                </p>
                <div className='relative mt-8 min-h-[270px] w-full overflow-hidden rounded-lg'>
                  <video
                    src='https://firebasestorage.googleapis.com/v0/b/mochi-tales.appspot.com/o/premadeVideos%2FChamath%20telling%20jokes.mp4?alt=media&token=7f1d1439-2115-4177-97e7-9206614153e7'
                    className='min-h-[270px] w-full object-cover'
                    id='demo'
                    // onCanPlayThrough={() => {}}
                  ></video>
                  {vidOnPlay !== 'demo' ? (
                    <i
                      className='fas fa-play absolute left-[50%] top-[50%] z-50 -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white shadow-xl'
                      onClick={() => playCurrentVideo('demo')}
                    ></i>
                  ) : (
                    <i
                      className='fas fa-pause absolute left-[50%] top-[50%] z-50 -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white shadow-xl'
                      onClick={() => playCurrentVideo('demo')}
                    ></i>
                  )}
                </div>
              </div>
            </div>
            <div className='card h-max w-full rounded-lg py-3 px-4 shadow-sm md:h-full md:py-5 md:px-8 lg:h-[580px] lg:w-[60%] lg:py-8'>
              <div className='flex h-max w-full flex-col'>
                <h2 className='mb-3 text-base'>Write the text:</h2>
                <textarea
                  name='text_script'
                  id='textScript'
                  className='sub-card mb-3 h-[15vh] max-h-[100px] w-full resize-none rounded-md border-none outline-none focus:border-none focus:outline-none md:max-h-[200px] lg:mb-5 lg:h-[180px]'
                  placeholder='Type or paste a paragraph here...'
                  onChange={(e) => setInputText(e.target.value)}
                ></textarea>
                <h2 className='mb-3 text-base'>Choose the speaker:</h2>
                <div className='h-max w-full overflow-x-auto px-2 py-2.5'>
                  <div className='m-auto flex h-max w-max items-center lg:m-0 lg:justify-around'>
                    {photos
                      ? photos
                          .filter((photo: Photo) => !photo.is_preset)
                          .map((photo: Photo) => (
                            <div
                              key={photo.id}
                              className='mr-3 flex flex-col items-center lg:mr-4'
                            >
                              <div
                                className={`mb-2 cursor-pointer rounded-full bg-gray-300 ${
                                  talkingAvatar.id === photo.id
                                    ? 'outline outline-4 outline-blue-900 grayscale-0'
                                    : 'grayscale'
                                }`}
                                title={getName(photo.id)}
                                onClick={() => setTalkingAvatar(photo)}
                              >
                                <img
                                  src={photo.circle_image}
                                  alt='avatar photo'
                                  className='max-h-[75px] min-h-[75px] min-w-[75px] max-w-[75px] rounded-full lg:max-h-[100px] lg:min-h-[100px] lg:min-w-[100px] lg:max-w-[100px]'
                                />
                              </div>
                              <p className='text-xxs badge inline-block rounded-2xl px-3 py-1 text-center md:text-xs lg:text-sm'>
                                {getName(photo.id)}
                              </p>
                            </div>
                          ))
                      : [0, 1, 2, 3].map((num: number) => (
                          <div
                            key={num}
                            className='skeleton-load mr-2.5 mb-2 max-h-[75px] min-h-[75px] min-w-[75px] max-w-[75px] rounded-full last:mr-0 lg:max-h-[100px] lg:min-h-[100px] lg:min-w-[100px] lg:max-w-[100px]'
                          ></div>
                        ))}
                  </div>
                </div>
                <button
                  className='rounded-5xl embed mt-6 flex w-full max-w-[300px] cursor-pointer items-center justify-center self-center bg-blue-500 py-5 px-10 text-white'
                  onClick={generateVideo}
                >
                  {loading ? (
                    <Loader loading={true} />
                  ) : (
                    <span>Generate the video</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
