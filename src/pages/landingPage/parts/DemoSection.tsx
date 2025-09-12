import { FC } from "react";

// Embedded product demo video section
export const DemoSection: FC = () => (
  <section id="demo" className="py-12 sm:py-16 bg-background scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32 relative z-10">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="glassmorphism rounded-2xl p-1">
        <div className="aspect-video rounded-xl overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/LM683z0glJM"
            title="QuizzViz Demo"
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  </section>
);
