/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import Image from 'next/image';
import router from 'next/router';
import React, { useEffect, useLayoutEffect } from 'react';

import { generateVideo } from '@/lib/helper';

import Seo from '@/components/Seo';

// import { UserContext } from '@/context/userContext';
import { auth, firestore } from '../../../firebase/firebase';

export default function Login() {
  // const userInfo = React.useContext(UserContext);

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

        if (isSignInWithEmailLink(auth, window.location.href) && !user) {
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
              await saveTempDataToDb(uid);
              await saveUserInfo(uid, email as string);
              Cookies.set(
                'allinUserCred',
                JSON.stringify({ email, displayName, uid }),
                { expires: 7 }
              );
              router.push('/gallery');
            })
            .catch((error) => {
              console.log(error);
            });
        }

        if (user) {
          router.push('/gallery');
        }
      } catch (error) {
        return;
      }
    })();
  }, []);

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
