/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
// eslint-disable-next-line unused-imports/no-unused-imports
import {
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import LoadingScreen from '@/components/LoadingScreen';

import { auth, firestore } from '../../../firebase/firebase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [loginState, setLoginState] = useState(true);
  const [loading, setLoading] = useState(false);

  const authenticateUserWithEmail = () => {
    if (email) {
      setSendingLink(true);

      sendSignInLinkToEmail(auth, email, {
        url: window.location.origin + '/success',
        handleCodeInApp: true,
      })
        .then(() => {
          Cookies.set('allin_auth_mail', email);
          setEmailSent(true);
          setSendingLink(false);

          setTimeout(() => {
            setEmailSent(false);
            setEmail('');
          }, 3000);
        })
        .catch((error) => {
          console.log('An error occured:', error);
          setSendingLink(false);
        });
    }
  };

  async function saveTempDataToDb(uid: string) {
    const tempData = Cookies.get('allinTempData');
    if (tempData) {
      const audioData = JSON.parse(tempData);
      const _docData = { ...audioData, id: uid };
      const _doc = doc(firestore, `AudioPodcasts/${audioData.audioId}`);
      await setDoc(_doc, _docData);
      Cookies.remove('allinTempData');
    }
  }

  const handleGoogleAuth = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async (result) => {
        // console.log(result);
        setLoading(true);
        const { email, displayName, uid } = result.user;
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
  };

  return (
    <>
      <LoadingScreen loading={loading} />
      <div className='relative flex h-max min-h-[100vh] w-screen items-center justify-center'>
        <div className='modal-card flex h-max w-[95%] max-w-[500px] flex-col items-center rounded-lg shadow-lg'>
          <form
            className='flex h-max w-full flex-col items-center px-5 py-8 md:p-12'
            onSubmit={(e) => e.preventDefault()}
          >
            <h3>Welcome</h3>
            <p className='text-center text-base'>
              {loginState ? 'Login to your account' : 'Create a new account'}
            </p>
            <p
              className={`bg-green-500 text-sm text-white transition-all ${
                emailSent
                  ? 'visible mt-5 max-h-max translate-y-0 p-4 opacity-100'
                  : 'invisible mt-0 max-h-0 translate-y-5 p-0 opacity-0'
              }`}
            >
              Please check your email for the login link.
            </p>
            <input
              type='email'
              className='sub-card my-6 w-full rounded-lg border-none py-3 outline-none focus:outline-none'
              placeholder='Email address'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              className={`w-full max-w-[300px] rounded-xl py-4 px-10 text-white ${
                sendingLink ? 'bg-gray-500' : 'bg-blue-500'
              }`}
              onClick={authenticateUserWithEmail}
            >
              {sendingLink ? 'Loading...' : 'Continue'}
            </button>
            {loginState ? (
              <p className='my-5 text-base'>
                Don't have an account? &nbsp;
                <span
                  className='cursor-pointer text-blue-500'
                  onClick={() => setLoginState(false)}
                >
                  Sign up
                </span>
              </p>
            ) : (
              <p className='my-5 cursor-pointer text-base'>
                Already have an account? &nbsp;
                <span
                  className='text-blue-500'
                  onClick={() => setLoginState(true)}
                >
                  Login
                </span>
              </p>
            )}
            <span className='mb-5 block text-sm'>Or</span>
            <button
              className='flex w-full max-w-[300px] items-center rounded-xl border border-blue-500 py-4 px-10'
              onClick={handleGoogleAuth}
            >
              <img
                src='/images/google.png'
                alt='Google icon'
                className='mr-2 h-6 w-6'
              />
              {loginState ? 'Login with Google' : 'Sign up with Google'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
