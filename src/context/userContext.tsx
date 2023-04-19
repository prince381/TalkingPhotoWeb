/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, Dispatch, useState } from 'react';

type UserContextType = {
  email: string;
  setEmail: Dispatch<string>;
  uid: string;
  setUid: Dispatch<string>;
  paid: boolean;
  setPaid: Dispatch<boolean>;
  generatedVideos: number;
  setGeneratedVideos: Dispatch<number>;
};

export const UserContext = createContext<UserContextType>({
  email: '',
  setEmail: () => {},
  uid: '',
  setUid: () => {},
  paid: false,
  setPaid: () => {},
  generatedVideos: 0,
  setGeneratedVideos: () => {},
});

type UserProviderProps = {
  children: React.ReactElement;
};

const UserProvider = ({ children }: UserProviderProps) => {
  const [email, setEmail] = useState('');
  const [paid, setPaid] = useState(false);
  const [uid, setUid] = useState('');
  const [generatedVideos, setGeneratedVideos] = useState(0);

  const values = {
    email,
    setEmail,
    paid,
    setPaid,
    uid,
    setUid,
    generatedVideos,
    setGeneratedVideos,
  };

  return <UserContext.Provider value={values}>{children}</UserContext.Provider>;
};

export default UserProvider;
