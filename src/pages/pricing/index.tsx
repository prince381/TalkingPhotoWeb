/* eslint-disable no-console */
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

type PricingCardProps = {
  title: string;
  price: string;
  description: string;
  features: string[];
  onClick: () => void;
  shadow?: string;
  currentplan?: boolean;
  filled?: boolean;
};

const PricingCard = ({
  title,
  price,
  description,
  features,
  shadow,
  currentplan,
  filled,
  onClick,
}: PricingCardProps) => {
  const [loading, setLoading] = useState(false);

  const getButtonText = (title: string) => {
    if (title === 'Free') {
      return 'Try for Free';
    } else if (title === 'Creator') {
      return 'Subscribe Now';
    } else {
      return "Let's Talk Now";
    }
  };

  return (
    <div
      className={`flex h-max w-full max-w-[350px] flex-col rounded-md border border-gray-200 transition-all ${
        shadow || 'shadow-md'
      }`}
    >
      <div className='h-max w-full p-5'>
        <h3
          className={`mb-4 inline-block text-lg font-bold ${
            currentplan ? 'bg-gray-200 px-1' : ''
          }`}
        >
          {title}
        </h3>
        <p className='mb-5 text-base font-bold'>${price}</p>
        <p className='mb-6 text-sm text-gray-500'>{description}</p>
        <div className='mb-6 h-[1px] w-full bg-gray-200'></div>
        {title === 'Creator' && (
          <p className='mb-3 text-sm text-gray-500'>
            Everything in the Free plan plus
          </p>
        )}
        {title === "Let's talk" && (
          <p className='mb-3 text-sm text-gray-500'>Custom features plus</p>
        )}
        <ul className='mb-5 h-max w-full'>
          {features.map((feature, index) => (
            <li
              key={index}
              className='mb-3 flex items-center text-sm last:mb-0'
            >
              <span className='mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#F4EBFF]'>
                <i className='fas fa-check text-sm text-blue-500'></i>
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <motion.button
          className={`flex w-full cursor-pointer items-center justify-center rounded-sm py-3 ${
            filled
              ? 'bg-blue-500 text-white'
              : 'border border-blue-500 bg-transparent text-blue-500'
          }`}
          onClick={() => {
            if (title === 'Creator') {
              setLoading(true);
              try {
                onClick();
              } catch (error) {
                setLoading(false);
              }
            } else {
              onClick();
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'Please wait...' : getButtonText(title)}
        </motion.button>
      </div>
    </div>
  );
};

export default function Pricing() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState('free');

  const packages = [
    {
      title: 'Free',
      price: '0',
      description:
        'Generate up to 3 audios and 1 video per month. Get unlimited access to the gallery with user-generated content.',
      features: [
        '1 video',
        '3 audios',
        'Watermark on the videos',
        'Unlimited access to the gallery',
      ],
      onClick: () => router.push('/create'),
    },
    {
      title: 'Creator',
      price: '12',
      description: 'Generate up to 100 audios and 10 videos per month.',
      features: [
        '10 videos',
        '100 audios',
        'Watermark-free video export',
        'High quality videos',
        'Customer Support',
      ],
      onClick: () => toCheckout(),
    },
    {
      title: "Let's Talk",
      price: '',
      description:
        'For businesses and enterprises that require custom features and a plan.',
      features: [
        'Unlimited video creation',
        'Unlimited audio creation',
        'Realtime support',
        'Direct feature requests',
        'All-in podcast Besties respect',
      ],
      onClick: () => (window.location.href = 'mailto:hi@mycreativitybox.com'),
    },
  ];

  const toCheckout = async () => {
    const url = '/api/checkout_sessions';

    try {
      const { data: response } = await axios.post(url, {
        priceId: process.env.NEXT_PUBLIC_PRICE_ID,
      });
      // console.log(response);

      const stripeKey = process.env
        .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string;
      const stripe = await loadStripe(stripeKey);
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: response.session.id,
        });

        if (error) throw error;
      } else {
        console.log('Stripe is not loaded');
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const { userPlan } = router.query;
    if (userPlan) {
      setCurrentPlan(userPlan as string);
    }
  }, [router.query]);

  return (
    <div className='flex h-full w-full items-center justify-center'>
      <div className='flex h-max min-h-[70vh] w-[95%] max-w-[1200px] flex-col items-center py-10 md:py-20'>
        <h1 className='mb-5 md:mb-16'>Pricing</h1>
        <div className='flex h-max w-full flex-col flex-wrap items-center gap-5 md:flex-row md:items-start'>
          {packages.map((item, index) => (
            <PricingCard
              key={index}
              title={item.title}
              price={item.price}
              description={item.description}
              features={item.features}
              onClick={item.onClick}
              shadow={index === 1 ? 'shadow-xl' : 'shadow-md'}
              currentplan={item.title.toLowerCase() === currentPlan}
              filled={index === 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
