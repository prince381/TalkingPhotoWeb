import React from 'react';

export default function LoadingScreen({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <div className='loading-screen'>
      <div className='bars'>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
