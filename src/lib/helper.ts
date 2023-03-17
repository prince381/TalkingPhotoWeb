/* eslint-disable no-console */
import axios from 'axios';

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
  timestamp?: Date;
  error?: Error;
  status?: 'processing' | 'completed' | 'failed';
  video_url?: string;
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
