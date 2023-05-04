/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import router from 'next/router';
import React, { useEffect, useLayoutEffect } from 'react';

import { generateVideo } from '@/lib/helper';

import Seo from '@/components/Seo';

// import { UserContext } from '@/context/userContext';
import { auth, firestore } from '../../../firebase/firebase';

export default function Login() {
  // const userInfo = React.useContext(UserContext);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  useLayoutEffect(() => {
    const user = Cookies.get('userCredential');
    if (user) {
      router.push('/gallery');
    }
  }, []);

  async function saveTempDataToDb(uid: string) {
    const tempData = Cookies.get('allinTempData');
    if (tempData) {
      const data = JSON.parse(tempData);
      const _docData = { ...data, id: uid };

      if (data.type === 'audio') {
        const _doc = doc(firestore, `AudioPodcasts/${data.audioId}`);
        await setDoc(_doc, _docData);
        Cookies.remove('allinTempData');
      }

      if (data.type === 'video') {
        const {
          talkingAvatar,
          title,
          voiceId,
          type,
          inputText,
          test,
          opened,
          id,
        } = _docData;
        await generateVideo(
          talkingAvatar,
          inputText,
          voiceId,
          title,
          id,
          test,
          type,
          opened
        );
        Cookies.remove('allinTempData');
      }
    }
  }

  // Get or set user's info in firestore
  async function saveUserInfo(uid: string, email: string) {
    const _doc = doc(firestore, `Users/${uid}`);
    const _docSnap = await getDoc(_doc);
    if (!_docSnap.exists()) {
      const _docData = { email, uid, paid: false, videos: 0, audios: 0 };
      await setDoc(_doc, _docData);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const user = Cookies.get('allinUserCred');
        if (user) {
          router.push('/gallery');
        }

        if (isSignInWithEmailLink(auth, window.location.href)) {
          const userMail = Cookies.get('allin_auth_mail');

          if (!userMail) {
            router.push('/login');
            return;
          }

          const link = window.location.href;
          await signInWithEmailLink(auth, userMail, link)
            .then(async (results) => {
              Cookies.remove('allin_auth_mail');
              const { email, displayName, uid } = results.user;
              Cookies.set(
                'allinUserCred',
                JSON.stringify({ email, displayName, uid }),
                { expires: 7 }
              );

              setLoading(false);
              setSuccess(true);

              try {
                await saveTempDataToDb(uid);
                await saveUserInfo(uid, email as string);
              } catch (error) {
                console.log(error);
              } finally {
                router.push('/gallery');
              }
            })
            .catch((error) => {
              console.log(error);
            });
        } else {
          setLoading(false);
          setError(true);
          return;
        }
      } catch (error) {
        console.log(error);
        setLoading(false);
        setError(true);
        return;
      }
    })();
  }, []);

  if (loading)
    return (
      <>
        <Seo templateTitle='Login' />
        <div className='flex h-screen flex-col items-center justify-center'>
          <Image
            src='/images/cog-loading.gif'
            alt='loading'
            width={80}
            height={80}
          />
          <p className='mt-4 text-base'>We're logging you in. Please wait...</p>
        </div>
      </>
    );

  if (error)
    return (
      <>
        <Seo templateTitle='Login' />
        <div className='flex h-screen flex-col items-center justify-center'>
          <div className='relative'>
            <i className='fas fa-user text-[70px]'></i>
            <i className='fas fa-exclamation-circle absolute -bottom-3 -right-4 text-3xl text-red-600'></i>
          </div>
          <p className='mt-5 text-base'>
            Something went wrong while trying to log in. Please try again.
          </p>
          <Link
            href='/create'
            className='cursor-pointer text-base text-blue-500 hover:underline'
          >
            Return to the playground
          </Link>
        </div>
      </>
    );

  if (success)
    return (
      <>
        <Seo templateTitle='Login' />
        <div className='flex h-screen flex-col items-center justify-center'>
          <Image
            src='/images/success.png'
            alt='check-circle'
            width={80}
            height={80}
          />
          <h1 className='mt-4 text-2xl font-bold'>Login Successful</h1>
          <p className='text-base'>Redirecting...</p>
        </div>
      </>
    );
}
