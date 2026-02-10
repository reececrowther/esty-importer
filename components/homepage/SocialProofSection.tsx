/**
 * Placeholder section for testimonials and usage stats.
 * Built for creators and print sellers messaging.
 */
export default function SocialProofSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-gray-200 dark:border-gray-800 bg-slate-50/80 dark:bg-gray-900/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white">
          Built for creators and print sellers
        </h2>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Join sellers who list faster and focus on what they love — making art.
        </p>

        {/* Usage stats — placeholder values for now */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '12,000+', label: 'Listings created' },
            { value: '50,000+', label: 'Mockups generated' },
            { value: '2,400+', label: 'Hours saved' },
            { value: '500+', label: 'Happy sellers' },
          ].map((stat) => (
            <div key={stat.label} className="text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 py-6 px-4">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials — placeholder quotes for now */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "I used to spend an hour per listing writing titles and descriptions. Now I get a full listing pack in under a minute. Game changer for my poster shop.",
              name: "Maya K.",
              role: "Etsy poster seller",
            },
            {
              quote: "The mockups look so professional and the SEO tags actually work — my new listings are getting found. Finally a tool that gets how Etsy sellers think.",
              name: "James T.",
              role: "Print & wall art shop",
            },
            {
              quote: "I batch-create mockups for my whole collection in one go. More time for designing, less time on the boring stuff. Exactly what I needed.",
              name: "Sophie L.",
              role: "Etsy print seller",
            },
          ].map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-6"
            >
              <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                {t.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
