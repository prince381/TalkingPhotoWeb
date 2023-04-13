/* eslint-disable no-console */
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import Image from 'next/image';
import router from 'next/router';
import React, { useEffect, useLayoutEffect } from 'react';

import { auth, firestore } from '../../../firebase/firebase';

export default function Login() {
  useLayoutEffect(() => {
    const user = Cookies.get('userCredential');
    if (user) {
      router.push('/gallery');
    }
  }, []);

  async function saveTempDataToDb(uid: string) {
    const tempData = Cookies.get('allinTempAudioData');
    if (tempData) {
      const audioData = JSON.parse(tempData);
      const _docData = { ...audioData, id: uid };
      const _doc = doc(firestore, `AudioPodcasts/${audioData.audioId}`);
      await setDoc(_doc, _docData);
      Cookies.remove('allinTempAudioData');
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
              Cookies.set(
                'allinUserCred',
                JSON.stringify({ email, displayName, uid })
              );
              Cookies.set('allin_SSID', uid);
              await saveTempDataToDb(uid);
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
  );
}
