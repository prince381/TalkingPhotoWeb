import React from 'react';

export default function Loader({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <div className='loader'>
      <div className='bars'>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
