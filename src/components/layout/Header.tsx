/* eslint-disable unused-imports/no-unused-vars */
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';

import { auth } from '../../../firebase/firebase';

const links = [
  { href: '/about', label: 'About us' },
  { href: '/create', label: 'Generate' },
  { href: '/gallery', label: 'Gallery' },
];

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);

  const toggleTheme = (val: boolean) => {
    if (val) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  };

  const logout = () => {
    auth.signOut().then(() => {
      Cookies.remove('allinUserCred');
      router.reload();
    });
  };

  React.useEffect(() => {
    const userCred = Cookies.get('allinUserCred');

    if (userCred) {
      setUser(JSON.parse(userCred));
    }
  }, []);

  return (
    <header className='header sticky top-0 left-0 z-10 h-max w-screen py-5 sm:py-8'>
      <div className='mx-auto flex h-max w-[95%] max-w-[1200px] items-center justify-between bg-[#f5f5f5]'>
        <Link href='/create' className='text-base font-bold md:text-lg'>
          allinpod.ai
        </Link>
        <div className='flex items-center bg-[#f5f5f5]'>
          {/* <Switch toggle={toggleTheme} /> */}
          <nav className='hidden sm:ml-8 sm:inline-block'>
            <ul className='flex items-center justify-between space-x-5 transition-all duration-75'>
              {links.map(({ href, label }) => (
                <li key={`${href}${label}`}>
                  <Link
                    href={href}
                    className={`text-sm transition-all duration-75 hover:text-blue-400 ${
                      href === router.pathname ? 'text-blue-400' : ''
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href='https://allinpod.canny.io/feature-requests'
                  target='_blank'
                  className='text-sm transition-all duration-75 hover:text-blue-400'
                >
                  Feature Requests
                </Link>
              </li>
              <li>
                {user ? (
                  <button
                    className='border-none bg-none text-xs transition-all duration-75 hover:text-blue-400'
                    onClick={logout}
                  >
                    Log out
                  </button>
                ) : (
                  <Link
                    href='/login'
                    className='text-sm transition-all duration-75 hover:text-blue-400'
                  >
                    Log in
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
        <button
          className='h-max w-8 cursor-pointer sm:hidden'
          onClick={() => {
            if (isMenuOpen) {
              setIsMenuOpen(false);
            } else {
              setIsMenuOpen(true);
            }
          }}
        >
          <div
            className={`my-1.5 h-[3px] w-full bg-blue-500 transition-all ${
              isMenuOpen ? 'translate-y-1.5 -rotate-45' : ''
            }`}
          ></div>
          <div
            className={`my-1.5 h-[3px] w-full bg-blue-500 transition-all ${
              isMenuOpen ? 'opacity-0' : ''
            }`}
          ></div>
          <div
            className={`my-1.5 h-[3px] w-full bg-blue-500 transition-all ${
              isMenuOpen ? '-translate-y-3 rotate-45' : ''
            }`}
          ></div>
        </button>
      </div>
      <nav
        className={`absolute left-0 top-[90%] -z-10 mx-auto h-max w-screen bg-[#f5f5f5] py-10 transition-all sm:hidden ${
          isMenuOpen ? 'translate-y-0' : '-translate-y-[150%]'
        }`}
      >
        <ul className='flex flex-col items-center space-y-8 transition-all duration-75'>
          {links.map(({ href, label }) => (
            <li key={`${href}${label}`}>
              <Link
                href={href}
                className={`text-sm transition-all duration-75 hover:text-blue-400 ${
                  href === router.pathname ? 'text-blue-400' : ''
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href='https://allinpod.canny.io/feature-requests'
              target='_blank'
              className='text-sm transition-all duration-75 hover:text-blue-400'
            >
              Feature Requests
            </Link>
          </li>
          <li>
            {user ? (
              <button className='border-none bg-none' onClick={logout}>
                Log out
              </button>
            ) : (
              <Link
                href='/login'
                className='text-sm transition-all duration-75 hover:text-blue-400'
              >
                Log in
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
