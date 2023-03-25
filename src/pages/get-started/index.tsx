/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable no-console */
import axios from 'axios';
import { doc, DocumentData, onSnapshot, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Image from 'next/image';
import { useRouter } from 'next/router';
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

import LoadingScreen from '@/components/LoadingScreen';

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
  const [appState, setAppState] = useState('init');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ips, setIps] = useState<string[]>([]);
  const [userIp, setUserIp] = useState('');

  const scriptRef = React.useRef<HTMLTextAreaElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const savedPhotoIds = [
    '5ffc20fde7324504849c373bdffc410b',
    'dd93b8bf5935467facd99de7f4d34bcb',
    'e145c2ebc7cb441cb6523108de1244df',
    'e5b732284e6a48ca89a6c384f73bf7b8',
  ];

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
    { title: 'Rich as F**k', artiste: 'Lil Wayne', id: 'rich_as_fk' },
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

  const getSavedIPs = () => {
    const ipRef = doc(firestore, 'metadata', 'talkingphoto');
    onSnapshot(ipRef, (snapshot) => {
      const data = snapshot.data() as DocumentData;
      setIps([...data.ip_addresses] as string[]);
    });
  };

  useEffect(() => {
    getSavedIPs();
    (async () => {
      try {
        const ip = await axios.get('https://api.ipify.org');
        setUserIp(ip.data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  useEffect(() => {
    if (photos && premade) {
      console.log(premade, photos);
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

  const sendVideo = async (avatar_id: string, audio: string, title: string) => {
    if (!avatar_id || !audio || !title) return;
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
      test: false,
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
          status: 'processing',
          timestamp,
          video_id,
          title,
        });

        // if (!ips.includes(userIp)) {
        //   const ipRef = doc(firestore, 'metadata', 'talkingphoto');
        //   await setDoc(ipRef, {
        //     ip_addresses: [...ips, userIp],
        //   });
        // }

        router.push(
          {
            pathname: '/gallery',
            query: {
              storageRef: 'generatedPodcasts',
              file: `${talkingAvatar.id}.mp3`,
            },
          },
          '/gallery'
        );
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
    // console.log(ips, userIp);
    if (ips.includes(userIp)) {
      alert('You have reached your limit of one request per IP address!');
      return;
    }

    const title = inputRef.current?.value;
    if (!title) {
      (inputRef.current as HTMLInputElement).focus();
      return;
    }

    setAppState('init');
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
        await sendVideo(talkingAvatar.id, audioUrl, title);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      throw error;
    }
  };

  const closeModal = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const modalContent = document.getElementById(
      'modal-content'
    ) as HTMLDivElement;
    if (!modalContent.contains(target)) {
      setAppState('init');
    }
  };

  return (
    <>
      <LoadingScreen loading={loading} />
      {appState === 'generating' && (
        <div
          id='modal'
          className='fixed left-0 top-0 z-[500] flex h-screen w-screen items-center justify-center backdrop-blur-sm'
          onClick={closeModal}
        >
          <button className='z-1 absolute top-8 right-8 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black lg:h-10 lg:w-10'>
            <i className='fas fa-times text-xl text-black'></i>
          </button>
          <div
            id='modal-content'
            className='modal-card flex h-max w-[90%] max-w-[700px] flex-col items-center rounded-lg p-5 shadow-md lg:py-8 lg:px-12'
          >
            <h2 className='text-lg font-bold md:self-start lg:text-xl xxl:text-2xl'>
              What should we title your video?
            </h2>
            <input
              ref={inputRef}
              type='text'
              className='sub-card my-6 w-full rounded-lg border-none py-3 outline-none'
              required
            />
            <button
              className='rounded-5xl w-full max-w-[300px] bg-blue-500 py-4 px-10 text-white'
              onClick={generateVideo}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      <div className='mx-auto h-max w-[95%] max-w-[1200px] py-10'>
        <div className='flex h-max w-full flex-col items-center'>
          <div className='card flex h-max w-full flex-col items-center rounded-lg px-2.5 py-4 shadow-sm xs:px-4 md:flex-row lg:py-6 xl:py-10'>
            <div className='flex h-full w-full flex-col items-center md:h-fit md:w-max'>
              <h2 className='sub-card mb-3 inline-block self-start whitespace-nowrap rounded-3xl py-1.5 px-5 text-sm lg:mb-5 lg:text-base'>
                Pick the bestie
              </h2>
              <div className='h-max w-full overflow-x-auto px-2 py-2.5 xs:mr-2.5 xs:w-max'>
                <div className='m-auto flex h-max w-max items-center xs:h-full xs:items-start md:grid md:grid-cols-1 md:flex-col lg:m-0  lg:overflow-x-visible'>
                  {photos
                    ? photos
                        .filter(
                          (photo: Photo) =>
                            !photo.is_preset && savedPhotoIds.includes(photo.id)
                        )
                        .map((photo: Photo, index: number) => (
                          <div
                            className='mr-4 mb-2 flex flex-col-reverse items-center last:mr-0 sm:mr-6 sm:last:mr-0 md:mr-0 md:items-start lg:flex-row lg:items-center lg:justify-end lg:last:mb-0'
                            key={photo.id}
                          >
                            <p
                              className={`text-xxs mt-1 hidden max-w-[150px] xxs:inline-block md:hidden lg:inline-block lg:text-sm ${
                                selectedAvatar.id === photo.id &&
                                'text-blue-500'
                              }`}
                            >
                              {getName(photo.id)}
                            </p>
                            <div
                              className={`cursor-pointer rounded-full border-2  bg-gray-300 lg:ml-5 ${
                                selectedAvatar.id === photo.id &&
                                'border-blue-500'
                              }`}
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
            </div>
            <div
              className={`relative mx-5 mb-7 h-full max-h-[300px] min-h-[300px] w-full max-w-[600px] md:mb-0 md:max-h-full ${
                videoPreview && videoPreview[videoName] && videoLoaded
                  ? 'border-2 border-blue-400'
                  : ''
              } overflow-hidden rounded-lg transition-all`}
            >
              {videoPreview && videoPreview[videoName] ? (
                <video
                  src={videoPreview[videoName]}
                  id='premade-vid'
                  className='h-full max-h-[300px] min-h-[300px] w-full max-w-[600px] object-cover md:max-h-full'
                  onCanPlayThrough={() => {
                    console.log('video loaded ....');
                    setVideoLoaded(true);
                  }}
                ></video>
              ) : (
                <div className='skeleton-load z-1 absolute left-0 top-0 h-full w-full md:max-h-full'></div>
              )}
              {!videoLoaded ? (
                <div className='skeleton-load z-1 absolute left-0 top-0 h-full w-full md:max-h-full'></div>
              ) : null}
              {vidOnPlay !== 'premade-vid' ? (
                <i
                  className='fas fa-play z-1 absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white shadow-xl'
                  onClick={() => playCurrentVideo('premade-vid')}
                ></i>
              ) : (
                <i
                  className='fas fa-pause z-1 absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white shadow-xl'
                  onClick={() => playCurrentVideo('premade-vid')}
                ></i>
              )}
            </div>
            <div className='flex h-full w-full flex-col items-center md:h-fit md:w-max'>
              <h2 className='sub-card mb-3 inline-block self-start whitespace-nowrap rounded-3xl py-1.5 px-5 text-sm lg:mb-5 lg:text-base'>
                Choose the song
              </h2>
              <div className='h-max w-full overflow-x-auto px-2 py-2.5 xs:w-max xs:overflow-x-hidden'>
                <div className='m-auto flex h-max w-max items-start xs:h-full xs:items-start md:grid md:grid-cols-1 md:flex-col lg:m-0'>
                  {photos && premade
                    ? premadeVideos.map((vid) => (
                        <div
                          className='mr-4 mb-2 flex flex-col items-center last:mr-0 sm:mr-6 sm:last:mr-0 md:mr-0 md:flex-row md:justify-start lg:last:mb-0'
                          key={vid.id}
                        >
                          <div
                            className={`cursor-pointer rounded-full border-2 border-blue-500 bg-gray-300 md:mr-3 lg:mr-6 ${
                              videoName === vid.id && 'current-song'
                            }`}
                            onClick={() => {
                              setVideoName(vid.id);
                              setVidOnPlay('');
                            }}
                          >
                            <Image
                              src='/images/music-banner.jpg'
                              alt='avatar photo'
                              width={60}
                              height={60}
                              className={`max-h-[60px] min-h-[60px] min-w-[60px] max-w-[60px] rounded-full ${
                                videoName === vid.id
                                  ? 'grayscale-0'
                                  : 'grayscale'
                              }`}
                              priority
                            />
                          </div>
                          <p
                            className={`text-xxs mt-1 max-w-[80px] text-center xxs:max-w-[120px] md:text-left lg:text-sm ${
                              videoName === vid.id ? 'text-blue-500' : ''
                            }`}
                          >
                            <span className='block text-sm font-bold'>
                              {vid.artiste}
                            </span>
                            <span className='hidden text-sm xs:block'>
                              {vid.title}
                            </span>
                          </p>
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
            </div>
            {/* <div className='mt-5 h-max w-full md:mt-0 md:ml-3 md:w-[40%]'>
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
            </div> */}
          </div>
          <div className='mt-8 flex h-max w-full flex-col items-center md:items-start lg:flex-row'>
            <div className='mb-5 h-max w-full rounded-lg  bg-blue-500 py-3 px-4 shadow-sm md:py-5 md:px-8 lg:mb-0 lg:mr-4 lg:h-[600px] lg:w-[40%] lg:py-8'>
              <div className='flex h-max w-full flex-col'>
                <h2 className='mb-4 text-base text-white'>Want more?</h2>
                <p className='text-gray-100'>
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                  Laudantium maxime, commodi numquam minima cum tempore est
                  aliquam hic odit esse aperiam neque pariatur obcaecati itaque
                  voluptas adipisci ab ipsa accusamus natus quam rerum modi
                  provident, cupiditate dolorem.
                </p>
                <div className='relative mt-8 min-h-[270px] w-full overflow-hidden rounded-lg lg:min-h-[300px]'>
                  <video
                    src='https://firebasestorage.googleapis.com/v0/b/mochi-tales.appspot.com/o/premadeVideos%2FChamath%20telling%20jokes.mp4?alt=media&token=7f1d1439-2115-4177-97e7-9206614153e7'
                    className='min-h-[270px] w-full object-cover lg:min-h-[300px]'
                    id='demo'
                    // onCanPlayThrough={() => {}}
                  ></video>
                  {vidOnPlay !== 'demo' ? (
                    <i
                      className='fas fa-play z-1 absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white shadow-xl'
                      onClick={() => playCurrentVideo('demo')}
                    ></i>
                  ) : (
                    <i
                      className='fas fa-pause z-1 absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white shadow-xl'
                      onClick={() => playCurrentVideo('demo')}
                    ></i>
                  )}
                </div>
              </div>
            </div>
            <div className='card h-max w-full rounded-lg py-3 px-4 shadow-sm md:h-full md:py-5 md:px-8 lg:h-[600px] lg:w-[60%] lg:py-8'>
              <div className='flex h-max w-full flex-col'>
                <h2 className='mb-3 text-base'>Write the text:</h2>
                <textarea
                  name='text_script'
                  id='textScript'
                  className='sub-card mb-1 h-[15vh] max-h-[100px] w-full resize-none rounded-md border-none outline-none focus:border-none focus:outline-none md:max-h-[200px] lg:h-[180px]'
                  placeholder='Type or paste a paragraph here...'
                  ref={scriptRef}
                  value={inputText}
                  onInput={() => {
                    const text = scriptRef.current?.value;
                    if (text && text.length > 450)
                      setInputText(text.slice(0, 450));
                    else setInputText(text || '');
                  }}
                ></textarea>
                <p
                  className={`mb-3 self-end text-sm lg:mb-5 ${
                    inputText.length > 450 ? 'text-red-500' : 'text-gray-600'
                  }`}
                >
                  {inputText.length} / 450 characters
                </p>
                <h2 className='mb-3 text-base'>Choose the speaker:</h2>
                <div className='h-max w-full overflow-x-auto px-2 py-2.5'>
                  <div className='m-auto flex h-max w-max items-center lg:m-0 lg:justify-around'>
                    {photos
                      ? photos
                          .filter(
                            (photo: Photo) =>
                              !photo.is_preset &&
                              savedPhotoIds.includes(photo.id)
                          )
                          .map((photo: Photo) => (
                            <div
                              key={photo.id}
                              className='mr-1 flex flex-col items-center lg:mr-4'
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
                  className={`rounded-5xl embed mt-6 flex w-full max-w-[300px] cursor-pointer items-center justify-center self-center ${
                    !inputText || !talkingAvatar.id
                      ? 'cursor-not-allowed bg-gray-400'
                      : 'cursor-pointer bg-blue-500'
                  } py-5 px-10 text-white`}
                  onClick={() => {
                    if (inputText && talkingAvatar.id)
                      setAppState('generating');
                  }}
                  disabled={!inputText || !talkingAvatar.id}
                >
                  <span>Generate the video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
