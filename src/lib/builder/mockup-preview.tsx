'use client';

interface MockupPreviewProps {
  mockup: string;
  className?: string;
}

export function MockupPreview({ mockup, className = '' }: MockupPreviewProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      {renderMockup(mockup)}
    </div>
  );
}

function renderMockup(mockup: string) {
  if (mockup.startsWith('hero-')) return <HeroMockup variant={mockup} />;
  if (mockup.startsWith('features-')) return <FeaturesMockup variant={mockup} />;
  if (mockup.startsWith('product-')) return <ProductMockup variant={mockup} />;
  if (mockup.startsWith('testimonials-')) return <TestimonialsMockup variant={mockup} />;
  if (mockup.startsWith('faq-')) return <FaqMockup variant={mockup} />;
  if (mockup.startsWith('cta-')) return <CtaMockup variant={mockup} />;
  if (mockup.startsWith('contact-')) return <ContactMockup variant={mockup} />;
  if (mockup.startsWith('booking-')) return <BookingMockup variant={mockup} />;
  if (mockup.startsWith('about-')) return <AboutMockup variant={mockup} />;
  if (mockup.startsWith('gallery-')) return <GalleryMockup variant={mockup} />;
  if (mockup.startsWith('video-')) return <VideoMockup variant={mockup} />;
  if (mockup.startsWith('team-')) return <TeamMockup variant={mockup} />;
  if (mockup.startsWith('pricing-')) return <PricingMockup variant={mockup} />;
  if (mockup.startsWith('newsletter-')) return <NewsletterMockup variant={mockup} />;
  if (mockup.startsWith('divider-')) return <DividerMockup variant={mockup} />;
  if (mockup.startsWith('marquee-')) return <MarqueeMockup variant={mockup} />;
  if (mockup.startsWith('menu-')) return <MenuMockup variant={mockup} />;
  if (mockup.startsWith('steps-')) return <StepsMockup variant={mockup} />;
  if (mockup.startsWith('location-')) return <LocationMockup variant={mockup} />;
  if (mockup.startsWith('header-')) return <HeaderMockup variant={mockup} />;
  if (mockup.startsWith('footer-')) return <FooterMockup variant={mockup} />;
  return <DefaultMockup />;
}

function HeroMockup({ variant }: { variant: string }) {
  if (variant === 'hero-full') {
    return (
      <div className="w-full h-full bg-emerald-900 p-3 flex flex-col justify-center items-center gap-1.5">
        <div className="h-2.5 w-3/4 rounded-full bg-white/30" />
        <div className="h-2.5 w-1/2 rounded-full bg-emerald-400" />
        <div className="h-2 w-2/3 rounded-full bg-white/20" />
        <div className="h-4 w-16 rounded-full bg-amber-400 mt-1" />
      </div>
    );
  }
  if (variant === 'hero-split') {
    return (
      <div className="w-full h-full p-3 flex gap-2 items-center">
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-slate-300 dark:bg-white/20" />
          <div className="h-2.5 w-2/3 rounded-full bg-slate-300 dark:bg-white/20" />
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-14 rounded-full bg-emerald-500 mt-1" />
        </div>
        <div className="w-1/3 aspect-square rounded-xl bg-gradient-to-br from-emerald-300 to-teal-400" />
      </div>
    );
  }
  if (variant === 'hero-card') {
    return (
      <div className="w-full h-full bg-slate-200 dark:bg-slate-800 p-3 flex items-center justify-center">
        <div className="w-3/4 bg-white dark:bg-slate-900 rounded-xl p-3 shadow-lg space-y-1.5">
          <div className="h-2.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
          <div className="h-2 w-1/2 rounded-full bg-slate-200 dark:bg-white/10 mx-auto" />
          <div className="h-4 w-16 rounded-full bg-emerald-500 mx-auto mt-2" />
        </div>
      </div>
    );
  }
  if (variant === 'hero-video') {
    return (
      <div className="w-full h-full bg-slate-900 p-3 flex flex-col justify-center items-center gap-1.5 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-slate-900/50" />
        <div className="h-2.5 w-3/4 rounded-full bg-white/30" />
        <div className="h-2.5 w-1/2 rounded-full bg-emerald-400" />
        <div className="h-4 w-16 rounded-full bg-amber-400 mt-1" />
      </div>
    );
  }
  return <DefaultMockup />;
}

function FeaturesMockup({ variant }: { variant: string }) {
  if (variant === 'features-3col') {
    return (
      <div className="w-full h-full p-3 space-y-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg bg-white dark:bg-slate-800 p-1.5 shadow-sm">
              <div className="w-4 h-4 rounded bg-emerald-500 mx-auto mb-1" />
              <div className="h-1.5 w-full rounded-full bg-slate-300 dark:bg-white/20" />
              <div className="h-1.5 w-2/3 rounded-full bg-slate-200 dark:bg-white/10 mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (variant === 'features-list') {
    return (
      <div className="w-full h-full p-3 space-y-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-500 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
              <div className="h-1.5 w-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (variant === 'features-stacked') {
    return (
      <div className="w-full h-full p-3 space-y-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-2 shadow-sm">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[8px] flex items-center justify-center font-bold shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
              <div className="h-1.5 w-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (variant === 'features-masonry') {
    return (
      <div className="w-full h-full p-3 space-y-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-lg bg-white dark:bg-slate-800 p-1.5 shadow-sm row-span-2">
            <div className="w-full h-full rounded bg-gradient-to-br from-emerald-300 to-teal-400" />
          </div>
          <div className="rounded-lg bg-white dark:bg-slate-800 p-1.5 shadow-sm">
            <div className="h-4 w-4 rounded bg-emerald-500 mx-auto mb-1" />
            <div className="h-1.5 w-full rounded-full bg-slate-300 dark:bg-white/20" />
          </div>
          <div className="rounded-lg bg-white dark:bg-slate-800 p-1.5 shadow-sm">
            <div className="h-4 w-4 rounded bg-emerald-500 mx-auto mb-1" />
            <div className="h-1.5 w-full rounded-full bg-slate-300 dark:bg-white/20" />
          </div>
        </div>
      </div>
    );
  }
  return <DefaultMockup />;
}

function ProductMockup({ variant }: { variant: string }) {
  if (variant === 'product-carousel') {
    return (
      <div className="w-full h-full p-3 flex flex-col gap-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        <div className="flex-1 flex gap-1.5 items-center">
          <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-[8px]">‹</span>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg bg-white dark:bg-slate-800 p-1.5 shadow-sm">
                <div className="aspect-square rounded bg-gradient-to-br from-amber-300 to-orange-400 mb-1" />
                <div className="h-1.5 w-full rounded-full bg-slate-300 dark:bg-white/20" />
              </div>
            ))}
          </div>
          <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-[8px]">›</span>
          </div>
        </div>
      </div>
    );
  }
  const cols = variant === 'product-4col' ? 4 : variant === 'product-3col' ? 3 : 2;
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className={`grid grid-cols-${cols} gap-1.5`}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white dark:bg-slate-800 p-1.5 shadow-sm">
            <div className="aspect-square rounded bg-gradient-to-br from-amber-300 to-orange-400 mb-1" />
            <div className="h-1.5 w-full rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1.5 w-2/3 rounded-full bg-emerald-500/60 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsMockup({ variant }: { variant: string }) {
  if (variant === 'testimonials-carousel') {
    return (
      <div className="w-full h-full p-3 flex flex-col gap-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-3/4 rounded-xl bg-white dark:bg-slate-800 p-2 shadow-sm">
            <div className="flex gap-0.5 mb-1">
              {'★★★★★'.split('').map((s, i) => (
                <span key={i} className="text-[8px] text-amber-400">{s}</span>
              ))}
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1.5 w-2/3 rounded-full bg-slate-200 dark:bg-white/10 mt-0.5" />
          </div>
        </div>
        <div className="flex justify-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>
      </div>
    );
  }
  if (variant === 'testimonials-single') {
    return (
      <div className="w-full h-full p-3 flex flex-col justify-center items-center gap-2">
        <div className="text-2xl text-slate-300 dark:bg-white/20">&quot;</div>
        <div className="h-2 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="h-2 w-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="flex items-center gap-1 mt-1">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-500" />
          <div className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className="grid grid-cols-2 gap-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl bg-white dark:bg-slate-800 p-2 shadow-sm">
            <div className="flex gap-0.5 mb-1">
              {'★★★★★'.split('').map((s, j) => (
                <span key={j} className="text-[8px] text-amber-400">{s}</span>
              ))}
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1.5 w-2/3 rounded-full bg-slate-200 dark:bg-white/10 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqMockup({ variant }: { variant: string }) {
  if (variant === 'faq-accordion') {
    return (
      <div className="w-full h-full p-3 space-y-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg bg-white dark:bg-slate-800 px-2 py-1.5 flex items-center justify-between shadow-sm">
            <div className="h-1.5 w-2/3 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="text-[10px] font-bold text-slate-400">+</div>
          </div>
        ))}
      </div>
    );
  }
  if (variant === 'faq-list') {
    return (
      <div className="w-full h-full p-3 space-y-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg bg-white dark:bg-slate-800 p-2 shadow-sm space-y-1">
            <div className="h-1.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className="grid grid-cols-2 gap-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg bg-white dark:bg-slate-800 p-2 shadow-sm space-y-1">
            <div className="h-1.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaMockup({ variant }: { variant: string }) {
  if (variant === 'cta-banner') {
    return (
      <div className="w-full h-full bg-emerald-600 p-3 flex flex-col justify-center items-center gap-1.5">
        <div className="h-2.5 w-1/2 rounded-full bg-white/30" />
        <div className="h-2 w-2/3 rounded-full bg-white/20" />
        <div className="h-4 w-16 rounded-full bg-white mt-1" />
      </div>
    );
  }
  if (variant === 'cta-card') {
    return (
      <div className="w-full h-full bg-slate-200 dark:bg-slate-800 p-3 flex items-center justify-center">
        <div className="w-3/4 bg-white dark:bg-slate-900 rounded-xl p-3 shadow-lg space-y-1.5 text-center">
          <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
          <div className="h-2 w-2/3 rounded-full bg-slate-200 dark:bg-white/10 mx-auto" />
          <div className="h-4 w-14 rounded-full bg-emerald-500 mx-auto mt-1" />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-3 flex items-center gap-2">
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="h-2 w-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="h-6 w-16 rounded-full bg-emerald-500 shrink-0" />
    </div>
  );
}

function ContactMockup({ variant }: { variant: string }) {
  if (variant === 'contact-form-map') {
    return (
      <div className="w-full h-full p-3 flex flex-col gap-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        <div className="flex-1 flex gap-1.5">
          <div className="flex-1 rounded-xl bg-white dark:bg-slate-800 p-2 shadow-sm space-y-1.5">
            <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-4 w-full rounded bg-emerald-500" />
          </div>
          <div className="w-1/3 rounded-xl bg-gradient-to-br from-emerald-300 to-teal-400" />
        </div>
      </div>
    );
  }
  if (variant === 'contact-split') {
    return (
      <div className="w-full h-full p-3 flex gap-2">
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-1.5 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="flex-1 rounded-xl bg-white dark:bg-slate-800 p-2 shadow-sm space-y-1.5">
          <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-full rounded bg-emerald-500" />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className="space-y-1.5">
        <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-full rounded bg-emerald-500" />
      </div>
    </div>
  );
}

function BookingMockup({ variant }: { variant: string }) {
  if (variant === 'booking-split') {
    return (
      <div className="w-full h-full p-3 flex gap-2">
        <div className="flex-[2] rounded-xl bg-white dark:bg-slate-800 p-2 shadow-sm space-y-1.5">
          <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="h-3.5 w-full rounded bg-emerald-500" />
        </div>
        <div className="flex-1 rounded-xl bg-white dark:bg-slate-800 p-2 shadow-sm space-y-1.5">
          <div className="h-1.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-1.5 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className="space-y-1.5">
        <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="h-3.5 w-full rounded bg-emerald-500" />
      </div>
    </div>
  );
}

function AboutMockup({ variant }: { variant: string }) {
  if (variant === 'about-centered') {
    return (
      <div className="w-full h-full p-3 flex flex-col items-center gap-2">
        <div className="w-1/3 aspect-video rounded-xl bg-gradient-to-br from-emerald-300 to-teal-400" />
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="h-1.5 w-3/4 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-1.5 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
    );
  }
  const imageLeft = variant === 'about-left';
  return (
    <div className="w-full h-full p-3 flex gap-2 items-center">
      {imageLeft && <div className="w-1/3 aspect-square rounded-xl bg-gradient-to-br from-emerald-300 to-teal-400" />}
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-1.5 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
      {!imageLeft && <div className="w-1/3 aspect-square rounded-xl bg-gradient-to-br from-emerald-300 to-teal-400" />}
    </div>
  );
}

function GalleryMockup({ variant }: { variant: string }) {
  if (variant === 'gallery-carousel') {
    return (
      <div className="w-full h-full p-3 flex flex-col gap-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-2/3 aspect-video rounded-xl bg-gradient-to-br from-emerald-300 to-teal-400" />
        </div>
        <div className="flex justify-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>
      </div>
    );
  }
  if (variant === 'gallery-masonry') {
    return (
      <div className="w-full h-full p-3 space-y-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className="aspect-square rounded-lg bg-gradient-to-br from-emerald-300 to-teal-400" />
          <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-amber-300 to-orange-400" />
          <div className="aspect-square rounded-lg bg-gradient-to-br from-pink-300 to-rose-400" />
          <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-sky-300 to-blue-400" />
          <div className="aspect-square rounded-lg bg-gradient-to-br from-violet-300 to-purple-400" />
          <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-lime-300 to-emerald-400" />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className="grid grid-cols-4 gap-1.5">
        {['from-emerald-300 to-teal-400', 'from-amber-300 to-orange-400', 'from-pink-300 to-rose-400', 'from-sky-300 to-blue-400'].map((g, i) => (
          <div key={i} className={`aspect-square rounded-lg bg-gradient-to-br ${g}`} />
        ))}
      </div>
    </div>
  );
}

function VideoMockup({ variant }: { variant: string }) {
  if (variant === 'video-centered') {
    return (
      <div className="w-full h-full p-3 flex flex-col gap-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-3/4 aspect-video rounded-xl bg-slate-800 flex items-center justify-center">
            <div className="text-2xl">▶</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className="aspect-video rounded-xl bg-slate-800 flex items-center justify-center">
        <div className="text-2xl">▶</div>
      </div>
    </div>
  );
}

function TeamMockup({ variant }: { variant: string }) {
  if (variant === 'team-list') {
    return (
      <div className="w-full h-full p-3 space-y-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
              <div className="h-1.5 w-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 mx-auto mb-1" />
            <div className="h-1.5 w-full rounded-full bg-slate-300 dark:bg-white/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingMockup({ variant }: { variant: string }) {
  const cols = variant === 'pricing-3tier' ? 3 : 2;
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className={`grid grid-cols-${cols} gap-1.5`}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={`rounded-xl bg-white dark:bg-slate-800 p-2 shadow-sm ${i === 1 ? 'border-2 border-emerald-500' : ''}`}>
            <div className="h-1.5 w-2/3 mx-auto rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-2 w-1/2 mx-auto rounded-full bg-emerald-500/70 mt-1" />
            <div className="space-y-0.5 mt-1">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-1 w-full rounded-full bg-slate-200 dark:bg-white/10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsletterMockup({ variant }: { variant: string }) {
  if (variant === 'newsletter-card') {
    return (
      <div className="w-full h-full bg-emerald-600 p-3 flex items-center justify-center">
        <div className="w-3/4 space-y-1.5 text-center">
          <div className="h-2.5 w-1/2 rounded-full bg-white/30 mx-auto" />
          <div className="h-2 w-2/3 rounded-full bg-white/20 mx-auto" />
          <div className="flex gap-1 mt-1">
            <div className="flex-1 h-4 rounded-full bg-white/20" />
            <div className="w-10 h-4 rounded-full bg-white" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className="h-2 w-2/3 rounded-full bg-slate-200 dark:bg-white/10 mx-auto" />
      <div className="flex gap-1">
        <div className="flex-1 h-4 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="w-10 h-4 rounded-full bg-emerald-500" />
      </div>
    </div>
  );
}

function DividerMockup({ variant }: { variant: string }) {
  if (variant === 'divider-spacer') {
    return <div className="w-full h-full" />;
  }
  return (
    <div className="w-full h-full flex items-center px-3">
      <div className="w-full h-px bg-slate-300 dark:bg-white/20" />
    </div>
  );
}

function MarqueeMockup({ variant }: { variant: string }) {
  return (
    <div className="w-full h-full bg-emerald-600 flex items-center px-2 overflow-hidden">
      <div className="flex gap-3 whitespace-nowrap">
        {['Promo Spesial', '✦', 'Gratis Konsultasi', '✦', 'Buka Setiap Hari', '✦'].map((t, i) => (
          <span key={i} className="text-[8px] text-white font-bold">{t}</span>
        ))}
      </div>
    </div>
  );
}

function MenuMockup({ variant }: { variant: string }) {
  if (variant === 'menu-tabs') {
    return (
      <div className="w-full h-full p-3 space-y-2">
        <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        <div className="flex gap-1 justify-center">
          <div className="px-2 py-0.5 rounded-full bg-emerald-500 text-[8px] text-white font-bold">Kategori 1</div>
          <div className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-[8px] font-bold">Kategori 2</div>
        </div>
        <div className="space-y-1">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-1.5 w-1/3 rounded-full bg-slate-300 dark:bg-white/20" />
              <div className="flex-1 border-b border-dashed border-slate-300 dark:bg-white/20" />
              <div className="h-1.5 w-8 rounded-full bg-emerald-500" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className="space-y-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="h-1.5 w-1/3 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="flex-1 border-b border-dashed border-slate-300 dark:bg-white/20" />
            <div className="h-1.5 w-8 rounded-full bg-emerald-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepsMockup({ variant }: { variant: string }) {
  return (
    <div className="w-full h-full p-3 space-y-2">
      <div className="h-2.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="text-center rounded-lg bg-white dark:bg-slate-800 p-1.5 shadow-sm">
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[8px] flex items-center justify-center font-bold mx-auto mb-1">
              {i + 1}
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1.5 w-2/3 rounded-full bg-slate-200 dark:bg-white/10 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationMockup({ variant }: { variant: string }) {
  return (
    <div className="w-full h-full p-3 flex gap-2">
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-3/4 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-1.5 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-3 w-12 rounded-full bg-emerald-500 mt-1" />
      </div>
      <div className="w-1/3 rounded-xl bg-white dark:bg-slate-800 p-1.5 shadow-sm space-y-1">
        {[0, 1].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-1 w-1/3 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1 w-1/4 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HeaderMockup({ variant }: { variant: string }) {
  if (variant === 'header-split-nav') {
    return (
      <div className="w-full h-full p-2 flex items-center justify-between px-3 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-emerald-500" />
          <div className="flex flex-col gap-0.5">
            <div className="h-1.5 w-12 rounded-full bg-slate-400 dark:bg-white/40" />
            <div className="h-1 w-8 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-5 rounded-full bg-slate-300 dark:bg-white/20" />
          <div className="h-1.5 w-5 rounded-full bg-slate-300 dark:bg-white/20" />
          <div className="h-2.5 w-7 rounded-full bg-emerald-500" />
        </div>
      </div>
    );
  }
  if (variant === 'header-with-topbar') {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-slate-800">
        <div className="h-2.5 bg-emerald-500/80 flex items-center px-2 gap-1">
          <div className="h-1 w-14 rounded-full bg-white/60" />
          <div className="h-1 w-6 rounded-full bg-white/30 ml-auto" />
        </div>
        <div className="flex-1 p-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
            <div className="h-1.5 w-9 rounded-full bg-slate-400 dark:bg-white/40" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-5 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1.5 w-5 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-2.5 w-7 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    );
  }
  if (variant === 'header-glass') {
    return (
      <div className="w-full h-full relative bg-gradient-to-br from-emerald-600 to-teal-500 p-2">
        <div className="absolute inset-0 backdrop-blur-sm bg-white/20" />
        <div className="relative h-full flex items-center justify-between px-3">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-white/70" />
            <div className="h-1.5 w-9 rounded-full bg-white/50" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-5 rounded-full bg-white/40" />
            <div className="h-1.5 w-5 rounded-full bg-white/40" />
            <div className="h-2.5 w-7 rounded-full bg-white/80" />
          </div>
        </div>
      </div>
    );
  }
  if (variant === 'header-floating') {
    return (
      <div className="w-full h-full p-2 flex items-center justify-center">
        <div className="w-[85%] bg-white dark:bg-slate-800 rounded-xl shadow-lg px-2 py-1.5 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 shrink-0">
            <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
            <div className="h-1.5 w-6 rounded-full bg-slate-400 dark:bg-white/40" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-3.5 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1.5 w-3.5 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-2.5 w-6 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    );
  }
  if (variant === 'header-minimal') {
    return (
      <div className="w-full h-full p-2 flex items-center justify-between px-3">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <div className="h-1.5 w-8 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="w-3 h-px bg-slate-300 dark:bg-white/20" />
          <div className="w-3 h-px bg-slate-300 dark:bg-white/20" />
          <div className="w-3 h-px bg-slate-300 dark:bg-white/20" />
        </div>
      </div>
    );
  }
  if (variant === 'header-hero-overlay') {
    return (
      <div className="w-full h-full bg-emerald-900 p-2 flex items-center justify-between px-3">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-white/20" />
          <div className="h-1.5 w-8 rounded-full bg-white/30" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-6 rounded-full bg-white/20" />
          <div className="h-1.5 w-6 rounded-full bg-white/20" />
          <div className="h-2.5 w-8 rounded-full bg-amber-400" />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-2 flex items-center justify-between px-3 bg-white dark:bg-slate-800">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded bg-emerald-500" />
        <div className="h-1.5 w-8 rounded-full bg-slate-300 dark:bg-white/20" />
      </div>
      <div className="flex items-center gap-1">
        <div className="h-1.5 w-6 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="h-1.5 w-6 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="h-2.5 w-8 rounded-full bg-emerald-500" />
      </div>
    </div>
  );
}

function FooterMockup({ variant }: { variant: string }) {
  if (variant === 'footer-minimal') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="h-1.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20" />
      </div>
    );
  }
  if (variant === 'footer-centered') {
    return (
      <div className="w-full h-full p-2 flex flex-col items-center justify-center gap-1">
        <div className="w-5 h-5 rounded bg-emerald-500 text-white text-[8px] flex items-center justify-center font-bold">P</div>
        <div className="h-1.5 w-1/2 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded bg-slate-300 dark:bg-white/20" />
          <div className="w-2 h-2 rounded bg-slate-300 dark:bg-white/20" />
          <div className="w-2 h-2 rounded bg-slate-300 dark:bg-white/20" />
        </div>
      </div>
    );
  }
  if (variant === 'footer-columns') {
    return (
      <div className="w-full h-full p-2 space-y-1">
        <div className="h-1 w-1/3 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400" />
        <div className="grid grid-cols-3 gap-1">
          <div className="space-y-0.5">
            <div className="h-1 w-full rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="space-y-0.5">
            <div className="h-1 w-full rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-1 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="flex gap-0.5">
            <div className="w-2 h-2 rounded bg-emerald-500" />
            <div className="w-2 h-2 rounded bg-emerald-500" />
          </div>
        </div>
      </div>
    );
  }
  if (variant === 'footer-newsletter') {
    return (
      <div className="w-full h-full p-2 space-y-1">
        <div className="h-1.5 w-1/3 rounded-full bg-slate-300 dark:bg-white/20 mx-auto" />
        <div className="flex gap-1">
          <div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="w-6 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <div className="h-1 w-1/2 rounded-full bg-slate-200 dark:bg-white/10 mx-auto" />
      </div>
    );
  }
  if (variant === 'footer-social') {
    return (
      <div className="w-full h-full p-2 flex flex-col items-center justify-center gap-1">
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <div className="w-3 h-3 rounded bg-emerald-500" />
        </div>
        <div className="h-1 w-1/2 rounded-full bg-slate-300 dark:bg-white/20" />
      </div>
    );
  }
  return (
    <div className="w-full h-full p-2 flex items-center justify-between px-3 bg-white dark:bg-slate-800">
      <div className="h-1.5 w-1/4 rounded-full bg-slate-300 dark:bg-white/20" />
      <div className="flex gap-1">
        <div className="h-1.5 w-4 rounded-full bg-slate-300 dark:bg-white/20" />
        <div className="h-1.5 w-4 rounded-full bg-slate-300 dark:bg-white/20" />
      </div>
      <div className="flex gap-0.5">
        <div className="w-2 h-2 rounded bg-emerald-500" />
        <div className="w-2 h-2 rounded bg-emerald-500" />
      </div>
    </div>
  );
}

function DefaultMockup() {
  return (
    <div className="w-full h-full p-3 grid grid-cols-3 gap-1.5 content-center">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl bg-white dark:bg-slate-800 p-2 shadow-sm text-center">
          <div className="w-4 h-4 mx-auto rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 mb-1" />
          <div className="h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>
      ))}
    </div>
  );
}

export function TemplatePreview({ templateId }: { templateId: string }) {
  switch (templateId) {
    case 'pangkas-rapi':
      return <PangkasRapiPreview />;
    case 'warung-makan':
      return <WarungMakanPreview />;
    case 'butik-hijab':
      return <ButikHijabPreview />;
    case 'toko-kelontong':
      return <TokoKelontongPreview />;
    case 'kerajinan-tangan':
      return <KerajinanTanganPreview />;
    default:
      return <DefaultMockup />;
  }
}

function PangkasRapiPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#050B14] to-[#0F172A] p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded bg-[#00A3FF]" />
        <div className="flex gap-2">
          <div className="h-2 w-12 rounded-full bg-[#00A3FF]/30" />
          <div className="h-2 w-12 rounded-full bg-[#00A3FF]/30" />
          <div className="h-6 w-16 rounded-full bg-[#00A3FF]" />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center gap-2">
        <div className="h-3 w-3/4 rounded-full bg-[#00A3FF]/40" />
        <div className="h-2 w-1/2 rounded-full bg-[#00E5FF]/30" />
        <div className="h-2 w-2/3 rounded-full bg-white/20" />
        <div className="h-8 w-24 rounded border-2 border-[#00A3FF] mt-2" />
      </div>
      <div className="flex justify-center gap-2">
        <div className="w-16 h-12 rounded bg-[#0F172A] border border-[#1E293B]" />
        <div className="w-16 h-12 rounded bg-[#0F172A] border border-[#1E293B]" />
        <div className="w-16 h-12 rounded bg-[#0F172A] border border-[#1E293B]" />
      </div>
    </div>
  );
}

function WarungMakanPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#FFF7ED] to-[#FED7AA] p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded-full bg-[#EA580C]" />
        <div className="flex gap-2">
          <div className="h-2 w-12 rounded-full bg-[#EA580C]/30" />
          <div className="h-2 w-12 rounded-full bg-[#EA580C]/30" />
          <div className="h-6 w-16 rounded-full bg-[#EA580C]" />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center gap-2">
        <div className="h-3 w-3/4 rounded-full bg-[#EA580C]/40" />
        <div className="h-2 w-1/2 rounded-full bg-[#9A3412]/30" />
        <div className="h-2 w-2/3 rounded-full bg-[#431407]/20" />
        <div className="h-8 w-24 rounded-full bg-[#EA580C] mt-2" />
      </div>
      <div className="flex justify-center gap-2">
        <div className="w-16 h-12 rounded bg-white border border-[#FED7AA]" />
        <div className="w-16 h-12 rounded bg-white border border-[#FED7AA]" />
        <div className="w-16 h-12 rounded bg-white border border-[#FED7AA]" />
      </div>
    </div>
  );
}

function ButikHijabPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#FFF1F2] to-[#FECDD3] p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded-full bg-[#E11D48]" />
        <div className="flex gap-2">
          <div className="h-2 w-12 rounded-full bg-[#E11D48]/30" />
          <div className="h-2 w-12 rounded-full bg-[#E11D48]/30" />
          <div className="h-6 w-16 rounded-full bg-gradient-to-r from-[#E11D48] to-[#FB7185]" />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center gap-2">
        <div className="h-3 w-3/4 rounded-full bg-[#E11D48]/40" />
        <div className="h-2 w-1/2 rounded-full bg-[#9F1239]/30" />
        <div className="h-2 w-2/3 rounded-full bg-[#4C0519]/20" />
        <div className="h-8 w-24 rounded-full bg-gradient-to-r from-[#E11D48] to-[#FB7185] mt-2" />
      </div>
      <div className="flex justify-center gap-2">
        <div className="w-16 h-12 rounded-2xl bg-white border border-[#FECDD3]" />
        <div className="w-16 h-12 rounded-2xl bg-white border border-[#FECDD3]" />
        <div className="w-16 h-12 rounded-2xl bg-white border border-[#FECDD3]" />
      </div>
    </div>
  );
}

function TokoKelontongPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#F0F9FF] to-[#BAE6FD] p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded bg-[#0369A1]" />
        <div className="flex gap-2">
          <div className="h-2 w-12 rounded-full bg-[#0369A1]/30" />
          <div className="h-2 w-12 rounded-full bg-[#0369A1]/30" />
          <div className="h-6 w-16 rounded bg-[#0369A1]" />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center gap-2">
        <div className="h-3 w-3/4 rounded-full bg-[#0369A1]/40" />
        <div className="h-2 w-1/2 rounded-full bg-[#0C4A6E]/30" />
        <div className="h-2 w-2/3 rounded-full bg-[#0C4A6E]/20" />
        <div className="h-8 w-24 rounded bg-[#0369A1] mt-2" />
      </div>
      <div className="flex justify-center gap-2">
        <div className="w-16 h-12 rounded-lg bg-white border border-[#BAE6FD]" />
        <div className="w-16 h-12 rounded-lg bg-white border border-[#BAE6FD]" />
        <div className="w-16 h-12 rounded-lg bg-white border border-[#BAE6FD]" />
      </div>
    </div>
  );
}

function KerajinanTanganPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#F5F5EC] to-[#D1D5DB] p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded-full bg-[#557153]" />
        <div className="flex gap-2">
          <div className="h-2 w-12 rounded-full bg-[#557153]/30" />
          <div className="h-2 w-12 rounded-full bg-[#557153]/30" />
          <div className="h-6 w-16 rounded-full border-2 border-[#557153]" />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center gap-2">
        <div className="h-3 w-3/4 rounded-full bg-[#557153]/40" />
        <div className="h-2 w-1/2 rounded-full bg-[#3F6212]/30" />
        <div className="h-2 w-2/3 rounded-full bg-[#2F3A2F]/20" />
        <div className="h-8 w-24 rounded-full border-2 border-[#557153] mt-2" />
      </div>
      <div className="flex justify-center gap-2">
        <div className="w-16 h-12 rounded-3xl bg-white border border-[#D1D5DB]" />
        <div className="w-16 h-12 rounded-3xl bg-white border border-[#D1D5DB]" />
        <div className="w-16 h-12 rounded-3xl bg-white border border-[#D1D5DB]" />
      </div>
    </div>
  );
}
