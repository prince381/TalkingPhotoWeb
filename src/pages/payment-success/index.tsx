/* eslint-disable react-hooks/exhaustive-deps */
import axios from 'axios';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { firestore } from '../../../firebase/firebase';

export default function Success() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    if (router.isReady) {
      const { session_id } = router.query;
      if (session_id) {
        setSessionId(session_id as string);
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    (async () => {
      if (sessionId) {
        // console.log('Session Id:', sessionId);
        const url = `/api/checkout_sessions/${sessionId}`;
        const { data: response } = await axios.get(url);
        // console.log('Response:', response);
        const {
          customer_details: { email: paymentEmail },
          payment_status,
          payment_intent,
        } = response.session;

        const user = Cookies.get('allinUserCred');

        if (user && payment_status) {
          const { uid, email } = JSON.parse(user);
          const q = query(
            collection(firestore, 'Users'),
            where('email', '==', email),
            where('uid', '==', uid)
          );
          const userDoc = await getDocs(q);
          const userDocId = userDoc.docs[0].id;
          const userDocRef = doc(firestore, 'Users', userDocId);
          await updateDoc(userDocRef, {
            paymentEmail,
            paid: payment_status === 'paid' ? true : false,
            paymentIntentId: payment_intent,
            videos: 0,
            audios: 0,
          });
        }
        router.push('/create');
      } else {
        router.push('/create');
      }
    })();
  }, [sessionId]);

  return (
    <div className='flex h-screen flex-col items-center justify-center'>
      <Image
        src='/images/success.png'
        alt='check-circle'
        width={80}
        height={80}
      />
      <h1 className='mt-4 text-2xl font-bold'>Payment Successful</h1>
      <p className='text-base'>Redirecting...</p>
    </div>
  );
}
