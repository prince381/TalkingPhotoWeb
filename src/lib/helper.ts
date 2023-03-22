/* eslint-disable no-console */
import axios from 'axios';
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { firestore, storage } from '../../firebase/firebase';

type OpenGraphType = {
  siteName: string;
  description: string;
  templateTitle?: string;
  logo?: string;
};

export type VideoPayloadType = {
  background?: string;
  clips: [
    {
      avatar_id?: string;
      avatar_style?: 'normal' | 'circle';
      talking_photo_id?: string;
      talking_photo_style?: 'normal' | 'circle';
      input_text?: string;
      input_audio?: string;
      scale?: number;
      voice_id?: string;
    }
  ];
  ratio: string;
  test: boolean;
  version: string;
};

export type VideoResponseType = {
  video_id: string;
  talking_photo_id: string;
  voice_id: string;
  id?: string;
  timestamp?: Date;
  error?: Error;
  status?: 'processing' | 'completed' | 'failed';
  video_url?: string;
};

export type VideoMetaData = {
  talking_photo: {
    circle_image: string;
    id: string;
    image_url: string;
  };
  timestamp: Date;
  video_id: string;
};

// !STARTERCONF This OG is generated from https://github.com/theodorusclarence/og
// Please clone them and self-host if your site is going to be visited by many people.
// Then change the url and the default logo.
export function openGraph({
  siteName,
  templateTitle,
  description,
  // !STARTERCONF Or, you can use my server with your own logo.
  logo = 'https://og.<your-domain>/images/logo.jpg',
}: OpenGraphType): string {
  const ogLogo = encodeURIComponent(logo);
  const ogSiteName = encodeURIComponent(siteName.trim());
  const ogTemplateTitle = templateTitle
    ? encodeURIComponent(templateTitle.trim())
    : undefined;
  const ogDesc = encodeURIComponent(description.trim());

  return `https://og.<your-domain>/api/general?siteName=${ogSiteName}&description=${ogDesc}&logo=${ogLogo}${
    ogTemplateTitle ? `&templateTitle=${ogTemplateTitle}` : ''
  }`;
}

export function getFromLocalStorage(key: string): string | null {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(key);
  }
  return null;
}

export function getFromSessionStorage(key: string): string | null {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(key);
  }
  return null;
}

export function trimChar(
  char: string,
  removeChars: string | string[],
  pos: 'start' | 'end' | 'both' = 'both'
) {
  let newChar = char.trim();
  switch (pos) {
    case 'start':
      newChar =
        removeChars.indexOf(newChar[0]) >= 0 ? newChar.slice(1) : newChar;
      break;
    case 'end':
      newChar =
        removeChars.indexOf(newChar.slice(-1)) >= 0
          ? newChar.slice(0, -1)
          : newChar;
      break;
    default:
      newChar =
        removeChars.indexOf(newChar[0]) >= 0 &&
        removeChars.indexOf(newChar.slice(-1)) >= 0
          ? newChar.slice(1, -1)
          : removeChars.indexOf(newChar[0]) >= 0 &&
            removeChars.indexOf(newChar.slice(-1)) < 0
          ? newChar.slice(1)
          : removeChars.indexOf(newChar[0]) < 0 &&
            removeChars.indexOf(newChar.slice(-1)) >= 0
          ? newChar.slice(0, -1)
          : newChar;
      break;
  }
  newChar = newChar.trim();
  return newChar;
}

//convert base64 data url to a blob file
export const base64ToBlob = async (
  url: string,
  type: string,
  fileName: string
) => {
  const blobData = await (await fetch(url)).blob();
  const file = new File([blobData], fileName, { type: type });
  return file;
};

export const blobToB64Url = (data: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(data);
    reader.onload = () => {
      const dataurl = reader.result as string;
      resolve(dataurl);
    };
  });
};

export async function fetchResources() {
  const url = process.env.NEXT_PUBLIC_SERVER as string;
  try {
    const {
      data: { data: response },
    } = await axios.get(`${url}/talking_photo/all`);
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function fetchPhotos() {
  const url = process.env.NEXT_PUBLIC_SERVER as string;
  try {
    const {
      data: { data: response },
    } = await axios.get(`${url}/talking_photo/photos`);
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function createVideo(
  payload: VideoPayloadType
): Promise<VideoResponseType> {
  const url = process.env.NEXT_PUBLIC_SERVER as string;
  try {
    const {
      data: { data: response },
    } = await axios.post(`${url}/talking_photo/create`, payload);
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function fetchVideoStatus(id: string) {
  const url = process.env.NEXT_PUBLIC_SERVER as string;
  try {
    const {
      data: { data: response },
    } = await axios.get(`${url}/talking_photo/get_video/${id}`);
    return response;
  } catch (error) {
    console.log(error, id);
    return null;
  }
}

export async function queryStore(collection_name: string) {
  const ref = collection(firestore, collection_name);
  const data: DocumentData[] = [];
  try {
    const docs = await getDocs(ref);
    docs.forEach((doc) => {
      const id = doc.id;
      const docData = doc.data();
      data.push({ id, ...docData });
    });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function removeFromStorage(ref_name: string, filename: string) {
  if (!filename) return;

  const fileRef = ref(storage, `${ref_name}/${filename}`);
  try {
    await deleteObject(fileRef);
  } catch (error) {
    console.log(filename, 'does not exist..');
  }
}

export async function deleteDocument(collection_name: string, doc_id: string) {
  const ref = doc(firestore, collection_name, doc_id);
  try {
    await deleteDoc(ref);
  } catch (error) {
    console.log('Document with id', doc_id, 'does not exist');
  }
}

//create a text to speech
export const getVoiceOver = async (
  text: string,
  voice_id: string
): Promise<Blob> => {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
  const config = {
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': process.env.NEXT_PUBLIC_TTS_API_KEY,
    },
  };
  try {
    const response = await axios.post(
      url,
      { text: text },
      { ...config, responseType: 'blob' }
    );
    const blob = response.data;
    return blob;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// get all voices
export async function fetchVoices() {
  const url = 'https://api.elevenlabs.io/v1/voices';
  const config = {
    headers: {
      Accept: 'audio/json',
      'Content-Type': 'application/json',
      'xi-api-key': process.env.NEXT_PUBLIC_TTS_API_KEY,
    },
  };
  try {
    const {
      data: { voices: response },
    } = await axios.get(url, config);
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
