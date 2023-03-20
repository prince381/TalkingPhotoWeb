import React from 'react';

export default function Switch({
  toggle,
}: {
  toggle: (value: boolean) => void;
}) {
  return (
    <div className='switch h-max w-max'>
      <input
        type='checkbox'
        id='theme-toggle'
        className='hidden appearance-none'
        onChange={(e) => toggle(e.target.checked)}
      />
      <label htmlFor='theme-toggle'>Night mode</label>
    </div>
  );
}
