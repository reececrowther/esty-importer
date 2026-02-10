import { FEATURES } from '@/lib/features';

const faqItems = [
  {
    q: 'Do I need Photoshop?',
    a: 'No. You only need PSD mockup files (from marketplaces or your own). The app replaces the smart-object layer and exports images for you.',
  },
  ...(FEATURES.ETSY_UPLOAD
    ? [{
        q: 'How do I connect my Etsy shop?',
        a: "In the dashboard, use the Etsy connect option. You'll sign in with Etsy and authorize the app. Your shop stays under your control; we only use access to create listings you approve.",
      }]
    : [{
        q: 'Can I upload directly to Etsy?',
        a: 'Not in the current MVP. You get mockup images and listing copy (title, description, tags) to preview and download—then copy them into Etsy yourself. Direct Etsy upload is planned for a later release.',
      }]),
  {
    q: 'Can I cancel anytime?',
    a: "Yes. You can cancel your Plus subscription at any time. You'll keep access until the end of your current billing period, and your account will stay on the Free tier after that.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Frequently asked questions
        </h2>
        <dl className="mt-12 space-y-8">
          {faqItems.map((faq) => (
            <div key={faq.q}>
              <dt className="text-lg font-semibold text-gray-900 dark:text-white">{faq.q}</dt>
              <dd className="mt-2 text-gray-600 dark:text-gray-400">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
