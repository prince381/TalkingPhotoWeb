/* eslint-disable unused-imports/no-unused-vars */
import React, { useContext } from 'react';

import { LoaderContext } from '@/context/loader';

export default function CreateVideo() {
  const loader = useContext(LoaderContext);

  return <div>this is where we create a video</div>;
}
