/* eslint-disable unused-imports/no-unused-vars */
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';

import Switch from '@/components/Switch';

const links = [
  { href: '/get-started', label: 'Get started' },
  { href: '/gallery', label: 'Gallery' },
  // { href: '/create', label: 'Generate' },
];

export default function Header() {
  const router = useRouter();

  const toggleTheme = (val: boolean) => {
    if (val) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  };

  return (
    <header className='header sticky top-0 left-0 z-10 h-max w-screen py-5 sm:py-8'>
      <div className='mx-auto flex h-max w-[95%] max-w-[1200px] items-center justify-between border-b pb-4 sm:border-b-0'>
        <Link href='/' className='text-base font-bold md:text-lg'>
          allinpod.ai
        </Link>
        <div className='flex items-center'>
          <Switch toggle={toggleTheme} />
          <nav className='hidden sm:ml-8 sm:inline-block'>
            <ul className='flex items-center justify-between space-x-5 transition-all duration-75'>
              {links.map(({ href, label }) => (
                <li key={`${href}${label}`}>
                  <Link
                    href={href}
                    className={`transition-all duration-75 hover:text-blue-400 ${
                      href === router.pathname ? 'text-blue-400' : ''
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <nav className='mx-auto mt-3 w-max sm:hidden'>
        <ul className='flex items-center justify-between space-x-5 transition-all duration-75'>
          {links.map(({ href, label }) => (
            <li key={`${href}${label}`}>
              <Link
                href={href}
                className={`transition-all duration-75 hover:text-blue-400 ${
                  href === router.pathname ? 'text-blue-400' : ''
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
