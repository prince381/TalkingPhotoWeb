/* eslint-disable unused-imports/no-unused-vars */
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = req.query.id as string;

  try {
    if (!id || !id.startsWith('cs_')) {
      throw new Error('Invalid CheckoutSession ID.');
    }
    const session = await stripe.checkout.sessions.retrieve(id);
    res.status(200).json({ session: session });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}
