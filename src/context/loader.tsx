/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useState } from 'react';

export const LoaderContext = createContext<{
  loading: boolean;
  fullPageLoading: boolean;
  setLoading: React.Dispatch<any>;
  setFullPageLoading: React.Dispatch<any>;
}>({
  loading: false,
  fullPageLoading: false,
  setLoading: () => {},
  setFullPageLoading: () => {},
});

export const LoaderContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [fullPageLoading, setFullPageLoading] = useState<boolean>(false);
  const value = { loading, fullPageLoading, setLoading, setFullPageLoading };

  return (
    <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>
  );
};
