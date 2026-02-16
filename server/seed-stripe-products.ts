import { getUncachableStripeClient } from './stripeClient';

const BOOST_PRODUCTS = [
  {
    name: '$50,000 Cash Boost',
    description: 'Perfect for closing your next deal',
    metadata: { sku: 'cash_small', type: 'cash', cashAmount: '50000', weeksAmount: '0' },
    priceInCents: 99,
  },
  {
    name: '$150,000 Cash Boost',
    description: 'Level up your investment power',
    metadata: { sku: 'cash_medium', type: 'cash', cashAmount: '150000', weeksAmount: '0' },
    priceInCents: 199,
  },
  {
    name: '$300,000 Cash Boost',
    description: 'Premium investor package',
    metadata: { sku: 'cash_large', type: 'cash', cashAmount: '300000', weeksAmount: '0' },
    priceInCents: 299,
  },
  {
    name: '10 Extra Months',
    description: 'More time to find opportunities',
    metadata: { sku: 'weeks_small', type: 'weeks', cashAmount: '0', weeksAmount: '10' },
    priceInCents: 99,
  },
  {
    name: '25 Extra Months',
    description: 'Extended timeline for success',
    metadata: { sku: 'weeks_medium', type: 'weeks', cashAmount: '0', weeksAmount: '25' },
    priceInCents: 199,
  },
  {
    name: 'Ultimate Bundle',
    description: 'Cash & Time combo package - $200K cash + 20 months',
    metadata: { sku: 'bundle_ultimate', type: 'bundle', cashAmount: '200000', weeksAmount: '20' },
    priceInCents: 499,
  },
];

async function seedProducts() {
  const stripe = await getUncachableStripeClient();
  console.log('Seeding Stripe products for Dealbreak boosts...\n');

  for (const boost of BOOST_PRODUCTS) {
    const existing = await stripe.products.search({ query: `name:'${boost.name}'` });
    if (existing.data.length > 0) {
      console.log(`Already exists: ${boost.name} (${existing.data[0].id})`);
      const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
      if (prices.data.length > 0) {
        console.log(`  Price: ${prices.data[0].id} ($${(prices.data[0].unit_amount! / 100).toFixed(2)})\n`);
      }
      continue;
    }

    const product = await stripe.products.create({
      name: boost.name,
      description: boost.description,
      metadata: boost.metadata,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: boost.priceInCents,
      currency: 'usd',
    });

    console.log(`Created: ${boost.name}`);
    console.log(`  Product ID: ${product.id}`);
    console.log(`  Price ID: ${price.id} ($${(boost.priceInCents / 100).toFixed(2)})\n`);
  }

  console.log('Done! Products are ready for checkout.');
}

seedProducts().catch(console.error);
