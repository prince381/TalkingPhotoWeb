/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
// eslint-disable-next-line unused-imports/no-unused-imports
import {
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { generateVideo } from '@/lib/helper';

import LoadingScreen from '@/components/LoadingScreen';
import Seo from '@/components/Seo';

// import { UserContext } from '@/context/userContext';
import { auth, firestore } from '../../../firebase/firebase';

export default function Login() {
  const router = useRouter();
  // const userInfo = React.useContext(UserContext);
  const [email, setEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [loginState, setLoginState] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [getNews, setGetNews] = useState(true);

  // Save temp data to firestore
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

  const authenticateUserWithEmail = () => {
    if (!acceptTerms) {
      alert('Please accept the terms and conditions');
      return;
    }

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

  const handleGoogleAuth = () => {
    if (!acceptTerms) {
      alert('Please accept the terms and conditions');
      return;
    }

    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async (result) => {
        // console.log(result);
        setLoading(true);
        const { email, displayName, uid } = result.user;
        await saveTempDataToDb(uid);
        await saveUserInfo(uid, email as string);
        Cookies.set(
          'allinUserCred',
          JSON.stringify({ email, displayName, uid }),
          { expires: 7 }
        );

        if (getNews) {
          const _doc = doc(firestore, 'UpdateSubscribers', uid);
          await setDoc(_doc, { id: uid, email });
        }

        router.push('/gallery');
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <>
      <Seo templateTitle='Login' />
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
              className={`sub-card my-6 w-full rounded-lg border-none py-3 focus:border-none ${
                error
                  ? 'outline-1 outline-red-500 focus:outline-1 focus:ring-red-500'
                  : ''
              }`}
              placeholder='Email address'
              value={email}
              onInput={(e) => {
                e.preventDefault();
                const { value } = e.target as HTMLInputElement;
                const isMail = /\w+@[a-zA-Z_]+?\.([a-z]{2,3})+/.test(value);
                // Check to make sure email is valid and there is no space
                if (!isMail || value.includes(' ')) {
                  setError(true);
                } else {
                  setError(false);
                }

                if (value.trimStart() === '') {
                  (e.target as HTMLInputElement).value = '';
                  setEmail('');
                } else {
                  setEmail(value);
                }
              }}
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
            {/* {!loginState && ( */}
            <div className='mt-5 flex flex-col'>
              <div className='mb-4 w-full'>
                <input
                  type='checkbox'
                  id='terms'
                  className='mr-2 inline-block rounded-sm checked:border-none checked:outline-none'
                  checked={acceptTerms ? true : false}
                  onChange={() => {
                    if (!acceptTerms) {
                      setAcceptTerms(true);
                    } else {
                      setAcceptTerms(false);
                    }
                  }}
                />
                <label htmlFor='terms' className='cursor-pointer text-sm'>
                  I agree to the{' '}
                  <Link href='/terms' className='text-blue-500'>
                    terms of service
                  </Link>
                </label>
              </div>
              <div>
                <input
                  type='checkbox'
                  id='info'
                  className='mr-2 inline-block rounded-sm checked:border-none checked:outline-none'
                  checked={getNews ? true : false}
                  onChange={() => {
                    if (!getNews) {
                      setGetNews(true);
                    } else {
                      setGetNews(false);
                    }
                  }}
                />
                <label htmlFor='info' className='cursor-pointer text-sm'>
                  I want to receive product updates
                </label>
              </div>
            </div>
            {/* )} */}
          </form>
        </div>
      </div>
    </>
  );
}
