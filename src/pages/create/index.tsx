/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable unused-imports/no-unused-vars */
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import { createVideo, fetchResources, VideoPayloadType } from '@/lib/helper';

import LoadingScreen from '@/components/LoadingScreen';

import { firestore } from '../../../firebase/firebase';

type Photo = {
  circle_image: string;
  id: string;
  image_url: string;
  is_preset?: boolean;
};

type Voice = {
  gender: 'Femal' | 'Male';
  language: string;
  name: string;
  preview: string;
  voice_id: string;
  locale?: string;
};

export default function CreateVideo() {
  const { isSuccess, isError, data, error } = useQuery(
    'resources',
    fetchResources
  );
  const [selectedAvatar, setSelectedAvatar] = useState<Photo>({} as Photo);
  const [activeTab, setActiveTab] = useState('text');
  const [inputText, setInputText] = useState('');

  const [loading, setLoading] = useState(true);
  const [voiceModalActive, setVoiceModalActive] = useState(false);

  const [voiceOnPlay, setVoiceOnPlay] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedGender, setSelectedGender] = useState('Male');

  const [selectedVoice, setSelectedVoice] = useState<Voice>({
    gender: 'Male',
    language: 'English',
    name: 'Paul - Natural',
    preview: 'https://static.movio.la/voice_preview/k6dKrFe85PisZ3FMLeppUM.mp3',
    voice_id: '077ab11b14f04ce0b49b5f6e5cc20979',
  });
  const [voices, setVoices] = useState<Voice[]>([]);
  const [languages, setLanguages] = useState<string[] | Set<string>>([]);

  const avatarNames = [
    'Jason Calacanis',
    'David Friedberg',
    'David Sacks',
    'Chamath Palihapitiya',
  ];

  // if (isLoading) return <LoadingScreen loading={isLoading} />;

  if (isError) {
    console.log(error);
    setLoading(false);
    alert('Something went wrong while fetching resources...');
  }

  useEffect(() => {
    if (isSuccess) {
      console.log(data);
      setVoices(data.voices);
      const langs = new Set(
        data.voices.map((voice: Voice) => voice.language)
      ) as Set<string>;
      setLanguages(langs);
      setLoading(false);
    }
  }, [isSuccess, data]);

  // useEffect(() => {
  //   console.log(voiceOnPlay)
  // }, [voiceOnPlay])

  const playCurrentAudio = (id: string) => {
    const audioFiles = document.querySelectorAll('audio');
    audioFiles.forEach((audio) => {
      if (audio.id === id) {
        if (audio.paused) {
          audio.play();
          setVoiceOnPlay(id);
        } else {
          audio.pause();
          setVoiceOnPlay('');
        }
      } else {
        audio.pause();
        audio.currentTime = 0.0;
      }
    });
  };

  const sendVideo = async () => {
    if (!selectedAvatar.id || !inputText) return;
    const payload: VideoPayloadType = {
      background: '#ffffff',
      clips: [
        {
          talking_photo_id: selectedAvatar.id,
          talking_photo_style: 'normal',
          input_text: inputText,
          scale: 1,
          voice_id: selectedVoice.voice_id,
        },
      ],
      ratio: '16:9',
      test: true,
      version: 'v1alpha',
    };

    try {
      setLoading(true);
      const response = await createVideo(payload);
      const { talking_photo_id, video_id, timestamp } = response;
      const avatar = data.photos.find(
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

  return (
    <>
      <LoadingScreen loading={loading} />
      <div
        className={`fixed left-0 top-0 z-50 flex h-screen w-screen items-center justify-center ${
          voiceModalActive
            ? 'pointer-events-auto visible opacity-100'
            : 'pointer-events-none hidden opacity-0'
        } transition-all`}
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <div
          className={`relative flex h-[80%] w-[90%] max-w-[1000px] flex-col items-center rounded-md bg-gray-100 px-4 pb-7 pt-9 shadow-lg transition-all md:flex-row md:items-start md:pt-12 ${
            voiceModalActive
              ? 'translate-y-0 translate-x-0 scale-100 opacity-100'
              : 'translate-y-10 translate-x-10 scale-50 opacity-0'
          }`}
        >
          <i
            className='fas fa-times absolute top-2 right-4 text-lg text-gray-400 transition-colors hover:text-gray-800'
            onClick={() => setVoiceModalActive(false)}
          ></i>
          <div className='mb-4 flex h-[40%] w-full flex-col items-center md:mb-0 md:h-full md:w-[50%] md:max-w-[300px]'>
            <div className='flex w-full items-center'>
              <p className='mr-2 text-sm'>Gender:</p>
              <div className='flex items-center'>
                <div className='radio mr-10'>
                  <input
                    type='radio'
                    id='male'
                    name='gender'
                    value={selectedGender}
                    onChange={(e) => setSelectedGender('Male')}
                    checked={selectedGender === 'Male'}
                  />
                  <label htmlFor='male'>Male</label>
                </div>
                <div className='radio'>
                  <input
                    type='radio'
                    id='female'
                    name='gender'
                    value={selectedGender}
                    onChange={(e) => setSelectedGender('Female')}
                    checked={selectedGender === 'Female'}
                  />
                  <label htmlFor='female'>Female</label>
                </div>
              </div>
            </div>
            <p className='mt-5 self-start text-sm'>Language</p>
            <div className='mt-1.5 grid max-h-[100px] w-full grid-cols-2 gap-1.5 overflow-y-auto rounded-md xxs:grid-cols-3 xs:grid-cols-4 md:h-full md:max-h-[100%] md:grid-cols-2'>
              {Array.from(languages).length > 0
                ? Array.from(languages).map((lang: string, index: number) => {
                    return (
                      <div className='radio mr-10' key={index}>
                        <input
                          type='radio'
                          id={`lang-${index}`}
                          name='language'
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(lang)}
                          checked={selectedLanguage === lang}
                        />
                        <label htmlFor={`lang-${index}`}>{lang}</label>
                      </div>
                    );
                  })
                : null}
            </div>
          </div>
          <div className='h-full w-full overflow-y-auto rounded-md border border-gray-200 bg-white p-2'>
            <div className='grid h-max w-full grid-cols-1 gap-4 pr-2 sm:grid-cols-2'>
              {voices.length > 0
                ? voices
                    .filter((voice: Voice) => {
                      return (
                        voice.gender === selectedGender &&
                        voice.language === selectedLanguage
                      );
                    })
                    .map((voice: Voice) => {
                      return (
                        <div
                          className='h-max w-full max-w-[100%] cursor-pointer rounded-md border border-indigo-200 bg-white p-1.5'
                          key={voice.voice_id}
                        >
                          <div
                            className='relative flex h-full w-full items-center rounded-md bg-gray-100 p-3 transition-all hover:bg-indigo-50'
                            onClick={() => {
                              setSelectedVoice(voice);
                              setVoiceModalActive(false);
                            }}
                          >
                            <i className='fas fa-microphone mr-3 text-lg'></i>
                            <div className=''>
                              <p className='mb-1 text-base'>{voice.name}</p>
                              <p className='text-sm'>
                                {voice.gender}, {voice.language}
                              </p>
                            </div>
                            {voiceOnPlay !== voice.voice_id ? (
                              <i
                                id={`play-${voice.voice_id}`}
                                className='fas fa-play absolute right-2 top-auto z-10 cursor-pointer lg:right-4'
                                onClick={() => playCurrentAudio(voice.voice_id)}
                              ></i>
                            ) : (
                              <i
                                id={`play-${voice.voice_id}`}
                                className='fas fa-pause absolute right-2 top-auto z-10 cursor-pointer lg:right-4'
                                onClick={() => playCurrentAudio(voice.voice_id)}
                              ></i>
                            )}
                            <audio
                              id={voice.voice_id}
                              src={voice.preview}
                              hidden
                              onEnded={() => setVoiceOnPlay('')}
                            ></audio>
                          </div>
                        </div>
                      );
                    })
                : null}
            </div>
          </div>
        </div>
      </div>
      <div className='h-max w-screen'>
        <div className='mx-auto flex w-[95%] max-w-[1200px] flex-col items-center py-5 lg:py-10'>
          <h1 className='max-w-[600px] text-center text-base lg:text-3xl'>
            Create your video with your favorite character
          </h1>
          <div className='m-auto flex h-max w-full flex-col items-center py-5 lg:mt-24 lg:flex-row-reverse lg:items-start lg:py-0'>
            <div className='flex w-full flex-col items-center'>
              <div className='mb-5 flex h-[30vh] max-h-[500px] w-full max-w-[500px] flex-col items-center justify-center overflow-hidden rounded-md bg-gray-100 p-3 sm:h-[400px] md:h-[50vh] lg:max-w-full'>
                {selectedAvatar.image_url ? (
                  <img
                    src={selectedAvatar.image_url}
                    alt='avatar image'
                    className='h-full w-full'
                  />
                ) : (
                  <i className='fas fa-images text-5xl text-gray-400'></i>
                )}
              </div>
              <button
                className='mb-8 hidden cursor-pointer rounded-md bg-indigo-700 px-9 py-3 text-white lg:block'
                onClick={sendVideo}
              >
                Create Video
              </button>
            </div>
            <div className='flex h-max w-full flex-col items-center lg:mr-10 lg:items-start'>
              <h3 className='mb-3 text-base lg:text-lg'>Pick an avatar</h3>
              <div className='h-max w-full overflow-x-auto px-2 py-2.5'>
                <div className='m-auto flex h-max w-max items-center lg:m-0'>
                  {data?.photos
                    ? data.photos
                        .filter((photo: Photo) => !photo.is_preset)
                        .map((photo: Photo, index: number) => (
                          <div
                            className={`mr-2.5 mb-2 cursor-pointer rounded-full bg-gray-300 p-0.5 last:mr-0 lg:mr-4 ${
                              selectedAvatar.id === photo.id
                                ? 'outline outline-2 outline-indigo-900'
                                : ''
                            }`}
                            key={photo.id}
                            title={avatarNames[index]}
                            onClick={() => setSelectedAvatar(photo)}
                          >
                            <img
                              src={photo.circle_image}
                              alt='avatar photo'
                              className='max-h-[75px] min-h-[75px] min-w-[75px] max-w-[75px] rounded-full lg:max-h-[90px] lg:min-h-[90px] lg:min-w-[90px] lg:max-w-[90px]'
                            />
                          </div>
                        ))
                    : [0, 1, 2, 3].map((num: number) => (
                        <div
                          key={num}
                          className='skeleton-load mr-2.5 mb-2 max-h-[75px] min-h-[75px] min-w-[75px] max-w-[75px] rounded-full last:mr-0 lg:max-h-[90px] lg:min-h-[90px] lg:min-w-[90px] lg:max-w-[90px]'
                        ></div>
                      ))}
                </div>
              </div>
              <div className='my-5 h-max w-full'>
                <div className='flex h-max w-full flex-col items-center'>
                  <div className='mb-2.5 flex h-max w-full items-center px-2'>
                    <button
                      className={`border-none bg-none px-4 py-2 text-sm outline-none ${
                        activeTab === 'text'
                          ? 'bg-gray-100  text-indigo-700'
                          : ''
                      } cursor-pointer rounded-md transition-all`}
                      onClick={() => setActiveTab('text')}
                    >
                      <i className='fas fa-pen mr-1.5'></i>
                      <span>Text Script</span>
                    </button>
                    <button
                      className={`border-none bg-none px-4 py-2 text-sm outline-none ${
                        activeTab === 'audio'
                          ? 'bg-gray-100  text-indigo-700'
                          : ''
                      } cursor-pointer rounded-md transition-all`}
                      onClick={() => setActiveTab('audio')}
                    >
                      <i className='fas fa-microphone mr-1.5'></i>
                      <span>Audio Script</span>
                    </button>
                  </div>
                  <div className='h-max max-h-[500px] w-full'>
                    {activeTab === 'text' ? (
                      <div className='flex h-full w-full flex-col items-center'>
                        <textarea
                          name='text_script'
                          id='textScript'
                          className='border-1 h-[20vh] max-h-[200px] w-full resize-none rounded-md border border-indigo-700 outline-none'
                          placeholder='Type or paste a paragraph here...'
                          onChange={(e) => setInputText(e.target.value)}
                        ></textarea>
                        <div className='relative mt-1 text-sm text-gray-400'>
                          or{' '}
                          <span className='cursor-pointer text-indigo-700'>
                            Generate
                          </span>{' '}
                          text script with GPT-4
                        </div>
                      </div>
                    ) : (
                      <div className='flex h-[25vh] max-h-[200px] w-full items-center justify-center rounded-md border border-dashed border-indigo-700 bg-slate-50'>
                        <button className='flex cursor-pointer flex-col items-center border-none bg-none outline-none'>
                          <i className='fas fa-upload mb-1.5 text-5xl text-indigo-700'></i>
                          <span className='text-sm text-indigo-700'>
                            Choose a File to upload
                          </span>
                          <span className='text-sm text-gray-400'>
                            MP3, WAV, up to 100mb, 10min
                          </span>
                        </button>
                        <input type='file' id='audioFile' hidden />
                      </div>
                    )}
                  </div>
                  {activeTab === 'text' ? (
                    <div className='mt-5 h-max w-full max-w-[300px] cursor-pointer rounded-md border border-indigo-200 bg-white p-1.5'>
                      <div
                        className='relative flex h-full w-full items-center rounded-md bg-gray-100 p-3 transition-all hover:bg-indigo-50'
                        onClick={() => setVoiceModalActive(true)}
                      >
                        <i className='fas fa-microphone mr-3 text-lg'></i>
                        <div className=''>
                          <p className='mb-1 text-base'>{selectedVoice.name}</p>
                          <p className='text-sm'>
                            {selectedVoice.gender}, {selectedVoice.language}
                          </p>
                        </div>
                        {voiceOnPlay !== selectedVoice.voice_id ? (
                          <i
                            id={`play-${selectedVoice.voice_id}`}
                            className='fas fa-play absolute right-4 top-auto z-10 cursor-pointer'
                            onClick={() =>
                              playCurrentAudio(selectedVoice.voice_id)
                            }
                          ></i>
                        ) : (
                          <i
                            id={`play-${selectedVoice.voice_id}`}
                            className='fas fa-pause absolute right-4 top-auto z-10 cursor-pointer'
                            onClick={() =>
                              playCurrentAudio(selectedVoice.voice_id)
                            }
                          ></i>
                        )}
                        <audio
                          id={selectedVoice.voice_id}
                          src={selectedVoice.preview}
                          hidden
                          onEnded={() => setVoiceOnPlay('')}
                        ></audio>
                      </div>
                    </div>
                  ) : null}
                  <button
                    className='mt-8 cursor-pointer rounded-md bg-indigo-700 px-9 py-3 text-white lg:hidden'
                    onClick={sendVideo}
                  >
                    Create Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
