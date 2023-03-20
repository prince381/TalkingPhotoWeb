import Link from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';

import Switch from '@/components/Switch';

const links = [
  { href: '/get-started', label: 'Get started' },
  { href: '/create', label: 'Generate' },
  { href: '/gallery', label: 'Gallery' },
];

export default function Header() {
  const router = useRouter();

  const toggleTheme = (val: boolean) => {
    if (val) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  };

  // React.useEffect(() => {
  //   console.log(router)
  // }, [router])

  return (
    <header className='sticky top-0 left-0 z-10 w-screen'>
      <div className='header mx-auto flex h-max w-[95%] max-w-[1200px] flex-col-reverse items-center py-5 xxs:flex-row xxs:justify-between md:py-8'>
        <Link href='/' className='hidden xs:inline'>
          Video Podcast
        </Link>
        <Switch toggle={toggleTheme} />
        <nav className='mb-5 xxs:mb-0 xs:ml-6 md:ml-0'>
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
    </header>
  );
}
