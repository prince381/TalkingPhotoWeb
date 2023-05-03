/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable no-console */
import { doc, DocumentData, onSnapshot, setDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import {
  fetchPhotos,
  fetchVoices,
  generateVideo,
  queryStore,
  uuidv4,
} from '@/lib/helper';

import LoadingScreen from '@/components/LoadingScreen';
import Seo from '@/components/Seo';

import { firestore } from '../../../firebase/firebase';

const getPremadeVideos = async () => {
  try {
    const data = await queryStore('premade');
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getUntrainedVideos = async () => {
  try {
    const data = await queryStore('untrained');
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

type UserInfo = {
  email: string;
  uid: string;
  paid: boolean;
  paymentIntentId?: string;
  videos: number;
  audios: number;
};

export default function GetStarted() {
  // const [mode, setMode] = useState('dark');
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState<Photo>({} as Photo);
  const [talkingAvatar, setTalkingAvatar] = useState<Photo>({} as Photo);
  const [videoPreview, selectVideoPreview] = useState<DocumentData>(
    {} as DocumentData
  );

  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>({
    email: '',
    uid: '',
    paid: false,
    videos: 0,
    audios: 0,
  });

  const [inputText, setInputText] = useState('');
  const [artifactTitle, setArtifactTitle] = useState('');
  const [artifactType, setArtifactType] = useState<'audio' | 'video'>('audio');
  const [videoName, setVideoName] = useState('');
  const [vidOnPlay, setVidOnPlay] = useState('');
  const [appState, setAppState] = useState('init');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [vidType, setVidType] = useState('premade');

  const scriptRef = React.useRef<HTMLTextAreaElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [hasSymbol, setHasSymbol] = useState(false);

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
      image: '/images/drake.jpg',
    },
    {
      title: 'Mockingbird',
      artiste: 'Eminem',
      id: 'mockingbird',
      image: '/images/eminem.jpg',
    },
    {
      title: 'Starboy',
      artiste: 'The Weeknd',
      id: 'starboy',
      image: '/images/weekend.jpg',
    },
    {
      title: 'All the way up',
      artiste: 'Fat Joe',
      id: 'all_the_way_up',
      image: '/images/fatjoe.jpg',
    },
  ];

  const untrainedVideos = [
    {
      title: 'Started from the bottom',
      artiste: 'Drake',
      id: 'started_from_the_bottom',
      image: '/images/drake.jpg',
    },
    {
      title: 'Mockingbird',
      artiste: 'Eminem',
      id: 'mockingbird',
      image: '/images/eminem.jpg',
    },
    {
      title: 'Amari',
      artiste: 'J Cole',
      id: 'amari',
      image: '/images/jcole.jpg',
    },
    {
      title: 'Rich as f**k',
      artiste: 'Lil Wayne',
      id: 'rich_as_fk',
      image: '/images/weezy.jpg',
    },
  ];

  const { data: photos } = useQuery('photos', fetchPhotos);
  const { data: premade } = useQuery('premade', getPremadeVideos);
  const { data: untrained } = useQuery('untrained', getUntrainedVideos);
  const { data: voices } = useQuery('voices', fetchVoices);

  const getSavedUser = () => {
    const userCred = Cookies.get('allinUserCred');

    if (userCred) {
      const user = JSON.parse(userCred);
      const userRef = doc(firestore, 'Users', user.uid);
      onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const { email, paid, uid, videos, audios } =
            snapshot.data() as DocumentData;
          setCurrentUserInfo({ email, paid, uid, videos, audios });
        }
      });
    }
  };

  const getName = (id: string) => {
    if (premade) {
      const doc = premade.find((doc) => doc.id === id);
      const name = doc ? doc.name : 'Avatar Name';
      return name;
    } else return 'Avatar Name';
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    let dStr = d.toLocaleString();
    dStr = dStr.replaceAll('/', '.');
    dStr = dStr.replaceAll(', ', '_');
    dStr = dStr.replaceAll(':', '_');
    return dStr;
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

  const generatePodcast = async () => {
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
        const targetVoiceId = targetVoice
          ? targetVoice.voice_id
          : 'TxGEqnHWrfWFTfGW9XjX';

        let inputData;

        if (artifactType === 'audio') {
          inputData = {
            inputText,
            talkingAvatar,
            audioTitle: title,
            voiceId: targetVoiceId,
            timestamp: Date.now(),
            audioId: uuidv4(),
            status: 'processing',
            type: 'audio',
            opened: false,
          };
        } else {
          inputData = {
            talkingAvatar,
            title,
            voiceId: targetVoiceId,
            type: 'video',
            opened: false,
            inputText,
            test: !currentUserInfo.paid,
          };
        }

        // check if the user is logged in or not and if not, redirect to login page
        // but first save the input data in a cookie
        const user = Cookies.get('allinUserCred');
        if (!user) {
          Cookies.set('allinTempData', JSON.stringify(inputData), {
            expires: 1,
          });
          router.push('/login');
        } else {
          const userCred = JSON.parse(user);
          const { uid } = userCred;

          if (artifactType === 'audio') {
            const _docData = { ...inputData, id: uid };
            const _doc = doc(firestore, `AudioPodcasts/${inputData.audioId}`);
            await setDoc(_doc, _docData);
            router.push('/gallery');
          }

          if (artifactType === 'video') {
            const { talkingAvatar, title, voiceId, inputText, test, opened } =
              inputData;
            await generateVideo(
              talkingAvatar,
              inputText,
              voiceId,
              title as string,
              uid,
              test as boolean,
              'video',
              opened
            );
            router.push('/gallery');
          }
        }
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

  useEffect(() => {
    getSavedUser();

    const section = document.getElementById('generate');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // useEffect(() => {
  //   console.log('userInfo', currentUserInfo);
  // }, [currentUserInfo]);

  // Automatically set the first video preview when all data
  // is loaded
  useEffect(() => {
    if (vidType === 'premade' && premade && photos) {
      const avatars = photos.filter(
        (photo: Photo) => !photo.is_preset && savedPhotoIds.includes(photo.id)
      );
      if (selectedAvatar.id && videoName) return;
      setSelectedAvatar(avatars[0]);
      setVideoName(premadeVideos[0].id);
    } else if (vidType === 'untrained' && untrained && photos) {
      const avatars = photos.filter(
        (photo: Photo) => !photo.is_preset && savedPhotoIds.includes(photo.id)
      );
      if (selectedAvatar.id && videoName) return;
      setSelectedAvatar(avatars[0]);
      setVideoName(untrainedVideos[0].id);
    }
  }, [premade, photos, untrained, vidType]);

  useEffect(() => {
    if (vidType === 'premade') {
      if (selectedAvatar.id && premade) {
        const video = premade.find(
          (doc) => doc.id === selectedAvatar.id
        ) as DocumentData;
        selectVideoPreview(video);
      }
    } else if (vidType === 'untrained') {
      if (selectedAvatar.id && untrained) {
        const video = untrained.find(
          (doc) => doc.id === selectedAvatar.id
        ) as DocumentData;
        selectVideoPreview(video);
      }
    }
  }, [selectedAvatar, vidType]);

  // Select one talking avatar by default
  useEffect(() => {
    if (photos) {
      const avatars = photos.filter(
        (photo: Photo) => !photo.is_preset && savedPhotoIds.includes(photo.id)
      );
      setTalkingAvatar(avatars[0]);
      const defaultText = `${getName(avatars[0].id)}_${formatDate(new Date())}`;
      setArtifactTitle(defaultText);
    }
  }, [photos]);

  return (
    <>
      <Seo templateTitle='Generate' />
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
            <h2 className='text-base font-bold md:self-start lg:text-lg xxl:text-xl'>
              What should we title your podcast?
            </h2>
            <input
              ref={inputRef}
              value={artifactTitle}
              type='text'
              className='sub-card mt-2 w-full rounded-lg border-none py-3 outline-none'
              onChange={() => {
                setArtifactTitle(inputRef.current?.value || '');
              }}
              autoFocus
              onFocus={(e) => e.target.select()}
              required
            />
            <div className='mb-3 h-max w-full'>
              <label className='flex items-center text-base font-bold lg:text-lg xxl:text-xl'>
                Choose the type:
              </label>
              <div className='relative h-max w-full'>
                <select
                  name='artifactType'
                  id='artifactType'
                  className='sub-card mt-2 w-full rounded-lg border-none py-3 outline-none'
                  defaultValue='audio'
                  onChange={(e) => {
                    setArtifactType(e.target.value as 'audio' | 'video');
                  }}
                >
                  <option value='audio'>Only audio</option>
                  <option value='video'>Video</option>
                </select>
                <i className='fas fa-chevron-down absolute top-1/2 right-4 z-10 -translate-y-[30%] text-base font-bold text-black'></i>
              </div>
            </div>
            {artifactType === 'video' &&
            !currentUserInfo.paid &&
            currentUserInfo.videos >= 1 ? (
              <div className='mx-auto w-[90%] text-center'>
                <p className='text-sm text-blue-500'>
                  You have reached the limit of 1 video per free user account.
                  Subscribe for just <b>$12</b> to continue generating your
                  video podcasts.
                </p>
              </div>
            ) : artifactType === 'video' &&
              currentUserInfo.paid &&
              currentUserInfo.videos >= 10 ? (
              <div className='mx-auto w-[90%] text-center'>
                <p className='text-sm text-blue-500'>
                  You have reached the limit of 3 videos per paid user account.
                  Please renew your subscription if you need more.
                </p>
              </div>
            ) : artifactType === 'audio' &&
              !currentUserInfo.paid &&
              currentUserInfo.audios >= 3 ? (
              <div className='mx-auto w-[90%] text-center'>
                <p className='text-sm text-blue-500'>
                  You have reached the limit of 3 audios per free user account.
                  Please renew your subscription if you need more.
                </p>
              </div>
            ) : artifactType === 'audio' &&
              currentUserInfo.paid &&
              currentUserInfo.audios >= 100 ? (
              <div className='mx-auto w-[90%] text-center'>
                <p className='text-sm text-blue-500'>
                  You have reached the limit of 100 audios per paid user
                  account. Please renew your subscription if you need more.
                </p>
              </div>
            ) : null}
            <button
              className='rounded-5xl mt-5 w-full max-w-[300px] bg-blue-500 py-4 px-10 text-white'
              onClick={() => {
                if (
                  (artifactType === 'video' &&
                    !currentUserInfo.paid &&
                    currentUserInfo.videos >= 1) ||
                  (artifactType === 'video' &&
                    currentUserInfo.paid &&
                    currentUserInfo.videos >= 10) ||
                  (artifactType === 'audio' &&
                    !currentUserInfo.paid &&
                    currentUserInfo.audios >= 3) ||
                  (artifactType === 'audio' &&
                    currentUserInfo.paid &&
                    currentUserInfo.audios >= 100)
                ) {
                  setSubscribing(true);
                  router.push(
                    {
                      pathname: '/pricing',
                      query: {
                        userPlan: currentUserInfo.paid ? 'creator' : 'free',
                      },
                    },
                    '/pricing'
                  );
                } else {
                  generatePodcast();
                }
              }}
            >
              {subscribing
                ? 'Please wait...'
                : (artifactType === 'video' &&
                    !currentUserInfo.paid &&
                    currentUserInfo.videos >= 1) ||
                  (artifactType === 'video' &&
                    currentUserInfo.paid &&
                    currentUserInfo.videos >= 10) ||
                  (artifactType === 'audio' &&
                    !currentUserInfo.paid &&
                    currentUserInfo.audios >= 3) ||
                  (artifactType === 'audio' &&
                    currentUserInfo.paid &&
                    currentUserInfo.audios >= 100)
                ? 'Subscribe'
                : 'Submit'}
            </button>
          </div>
        </div>
      )}
      <div className='mx-auto h-max w-[95%] max-w-[1200px] py-10'>
        <div className='flex h-max w-full flex-col items-center'>
          <div className='mb-5 flex h-max w-full items-center rounded-lg bg-blue-400 p-3.5 md:p-6'>
            {/* <i className="fas fa-info text-white text-xl md:text-2xl mr-5"></i> */}
            <p className='text-sm text-white'>
              We created this platform to have fun with Besties and explore the
              incredible power of AI. Join us on this journey of transforming
              podcasting, blogging, and more with AI voice and video generation.
              Follow us to stay up-to-date on our latest developments. Be a part
              of the future of content creation.{' '}
              <a href='https://mycreativitybox.com' className='underline'>
                My Creativity Box team
              </a>
              .
            </p>
          </div>
          <div className='card flex h-max w-full flex-col items-center rounded-lg px-2.5 py-4 shadow-sm xs:px-4 lg:py-6 xl:py-10'>
            <div className='rounded-5xl mb-8 flex w-max items-center overflow-hidden border-2 border-blue-500'>
              <button
                className={`cursor-pointer border-none bg-none py-2 px-6 transition-all ${
                  vidType === 'premade'
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-500'
                }`}
                onClick={() => setVidType('premade')}
              >
                Trained
              </button>
              <button
                className={`cursor-pointer border-none bg-none py-2 px-6 transition-all ${
                  vidType === 'untrained'
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-500'
                }`}
                onClick={() => setVidType('untrained')}
              >
                Untrained
              </button>
            </div>
            <div className='flex h-max w-full flex-col items-center md:flex-row'>
              <div className='flex h-full w-full flex-col items-center md:h-fit md:w-max lg:min-w-[250px]'>
                <h2 className='mb-3 inline-block self-start whitespace-nowrap rounded-3xl py-1.5 px-5 text-sm lg:mb-5 lg:text-base'>
                  Pick the bestie:
                </h2>
                <div className='h-max w-full overflow-x-auto px-2 py-2.5 xs:mr-2.5 xs:w-max'>
                  <div className='m-auto flex h-max w-max items-center xs:h-full xs:items-start md:grid md:grid-cols-1 md:flex-col lg:m-0  lg:overflow-x-visible'>
                    {photos
                      ? photos
                          .filter(
                            (photo: Photo) =>
                              !photo.is_preset &&
                              savedPhotoIds.includes(photo.id)
                          )
                          .map((photo: Photo, index: number) => (
                            <div
                              className='mr-4 mb-2 flex flex-col-reverse items-center last:mr-0 sm:mr-6 sm:last:mr-0 md:mr-0 md:items-start lg:w-max lg:flex-row-reverse lg:items-center lg:justify-end  lg:last:mb-0'
                              key={photo.id}
                            >
                              <p
                                className={`mt-1 hidden max-w-[110px] text-center text-xs xxs:inline-block md:hidden lg:inline-block lg:text-left lg:text-sm ${
                                  selectedAvatar.id === photo.id &&
                                  'text-blue-500'
                                }`}
                              >
                                {getName(photo.id)}
                              </p>
                              <div
                                className={`cursor-pointer rounded-full border-2  bg-gray-300 lg:mr-5 ${
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
                className={`group relative mx-5 mb-7 h-full max-h-[300px] min-h-[300px] w-full max-w-[600px] md:mb-0 md:max-h-full ${
                  videoPreview && videoPreview[videoName]
                    ? 'border-2 border-blue-400'
                    : ''
                } overflow-hidden rounded-lg transition-all`}
              >
                {videoPreview && videoPreview[videoName] ? (
                  <video
                    src={videoPreview[videoName].src}
                    poster={`/images/${videoPreview[videoName].poster}.png`}
                    id='premade-vid'
                    className='h-full max-h-[300px] min-h-[300px] w-full max-w-[600px] object-cover md:max-h-[335px]'
                    controls
                    controlsList='nodownload nofullscreen noremoteplayback nocontextmenu noplaybackrate'
                    onContextMenu={(e) => e.preventDefault()}
                  ></video>
                ) : (
                  <div className='skeleton-load z-1 absolute left-0 top-0 h-full max-h-[300px] min-h-[300px] w-full md:max-h-[335px]'></div>
                )}
                {vidOnPlay !== 'premade-vid' ? (
                  <i
                    className='fas fa-play z-1 absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white shadow-xl'
                    onClick={() => playCurrentVideo('premade-vid')}
                  ></i>
                ) : (
                  <i
                    className='fas fa-pause z-1 absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] cursor-pointer text-5xl text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100'
                    onClick={() => playCurrentVideo('premade-vid')}
                  ></i>
                )}
              </div>
              <div className='flex h-full w-full flex-col items-center md:h-fit md:w-max lg:min-w-[250px]'>
                <h2 className='mb-3 inline-block self-start whitespace-nowrap rounded-3xl py-1.5 px-5 text-sm lg:mb-5 lg:text-base'>
                  Choose the song:
                </h2>
                <div className='h-max w-full overflow-x-auto px-2 py-2.5 xs:w-max xs:overflow-x-hidden'>
                  {vidType === 'premade' ? (
                    <div className='m-auto flex h-max w-max items-start xs:h-full xs:items-start md:grid md:grid-cols-1 md:flex-col lg:m-0'>
                      {photos && premade
                        ? premadeVideos.map((vid) => (
                            <div
                              className='mr-4 mb-2 flex flex-col items-center last:mr-0 sm:mr-6 sm:last:mr-0 md:mr-0 md:flex-row md:justify-start lg:min-w-[250px] lg:last:mb-0'
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
                                  src={vid.image}
                                  alt='avatar photo'
                                  width={60}
                                  height={60}
                                  className={`max-h-[60px] min-h-[60px] min-w-[60px] max-w-[60px] rounded-full object-cover ${
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
                  ) : (
                    <div className='m-auto flex h-max w-max items-start xs:h-full xs:items-start md:grid md:grid-cols-1 md:flex-col lg:m-0'>
                      {photos && untrained
                        ? untrainedVideos.map((vid) => (
                            <div
                              className='mr-4 mb-2 flex flex-col items-center last:mr-0 sm:mr-6 sm:last:mr-0 md:mr-0 md:flex-row md:justify-start lg:min-w-[250px] lg:last:mb-0'
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
                                  src={vid.image}
                                  alt='avatar photo'
                                  width={60}
                                  height={60}
                                  className={`max-h-[60px] min-h-[60px] min-w-[60px] max-w-[60px] rounded-full object-cover ${
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
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className='mt-8 flex h-max w-full items-center' id='generate'>
            <div className='card h-max w-full rounded-lg py-3 px-4 shadow-sm md:h-full md:py-5 md:px-8 lg:py-5'>
              <div className='flex h-max w-full flex-col'>
                <h2 className='mb-3 text-base'>
                  Enter your script{' '}
                  <span className='text-base font-bold text-red-500'>*</span>
                </h2>
                <textarea
                  name='text_script'
                  id='textScript'
                  className={`sub-card mb-1 h-[25vh] w-full resize-none rounded-md border-none focus:border-none ${
                    hasSymbol
                      ? 'outline-1 outline-red-500 focus:outline-1 focus:ring-red-500'
                      : ''
                  }`}
                  placeholder='Type or paste a paragraph here...'
                  ref={scriptRef}
                  value={inputText}
                  onInput={() => {
                    const text = scriptRef.current?.value;
                    if (text && text.length > 700)
                      setInputText(text.slice(0, 700));
                    else setInputText(text || '');

                    // Check if the text includes symbols
                    if (text && text.match(/[^a-zA-Z0-9\s;:,.'"`«»!?-]/g)) {
                      setHasSymbol(true);
                    } else {
                      setHasSymbol(false);
                    }
                  }}
                ></textarea>
                <p
                  className={`mb-5 flex w-full items-center self-end text-sm ${
                    hasSymbol ? 'justify-between' : 'justify-end'
                  }`}
                >
                  {hasSymbol && (
                    <span className='text-red-500'>
                      Do not include symbols (eg. @,~,+,-,$,^,&,*,#)
                    </span>
                  )}
                  <span>{inputText.length} / 700 characters</span>
                </p>
                <h2 className='mb-3 text-base'>
                  Pick the bestie{' '}
                  <span className='text-base font-bold text-red-500'>*</span>
                </h2>
                <div className='h-max w-full overflow-x-auto px-2 py-2.5'>
                  <div className='m-auto flex h-max w-max items-center'>
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
                                    ? 'border-2 border-blue-500 grayscale-0'
                                    : 'grayscale'
                                }`}
                                title={getName(photo.id)}
                                onClick={() => {
                                  setTalkingAvatar(photo);
                                  const defaultText = `${getName(
                                    photo.id
                                  )}_${formatDate(new Date())}`;
                                  setArtifactTitle(defaultText);
                                }}
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
                {appState === 'noAvatar' && (
                  <p className='mt-4 text-center text-sm text-red-500'>
                    Please pick your bestie
                  </p>
                )}
                <button
                  className={`rounded-5xl embed mt-3 flex w-full max-w-[300px] cursor-pointer items-center justify-center self-center ${
                    !inputText || !talkingAvatar.id
                      ? 'cursor-not-allowed bg-gray-400'
                      : 'cursor-pointer bg-blue-500'
                  } py-5 px-10 text-white`}
                  onClick={() => {
                    if (inputText && talkingAvatar.id && !hasSymbol)
                      setAppState('generating');

                    if (inputText && !talkingAvatar.id) {
                      setAppState('noAvatar');
                      setTimeout(() => {
                        setAppState('init');
                      }, 3000);
                    }
                  }}
                  disabled={!inputText || !talkingAvatar.id}
                >
                  <span>Generate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
