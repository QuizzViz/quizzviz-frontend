import { FC } from "react";

// Three-step "How it works" walkthrough
const HowItWorksSection: FC = () => (
  <section id="how-it-works" className="py-24 bg-background relative scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
    <div className="absolute inset-0 opacity-5">
      <div
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')", backgroundSize: "cover", backgroundPosition: "center" }}
        className="w-full h-full"
      />
    </div>
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 scroll-fade visible">
        <h2 className="text-4xl lg:text-5xl font-light text-foreground mb-6">How It <span className="gradient-text font-medium">Works</span></h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Three simple steps to revolutionize your hiring process.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="text-center scroll-fade visible">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8"><span className="text-3xl font-bold text-white">1</span></div>
          <h3 className="text-2xl font-semibold text-foreground mb-4">Create Quiz</h3>
          <p className="text-muted-foreground leading-relaxed">Input job requirements and generate tailored assessments.</p>
        </div>
        <div className="text-center scroll-fade visible">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8"><span className="text-3xl font-bold text-white">2</span></div>
          <h3 className="text-2xl font-semibold text-foreground mb-4">Assess Candidates</h3>
          <p className="text-muted-foreground leading-relaxed">Send quizzes and get real-time analytics and insights.</p>
        </div>
        <div className="text-center scroll-fade visible">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-8"><span className="text-3xl font-bold text-white">3</span></div>
          <h3 className="text-2xl font-semibold text-foreground mb-4">Make Decisions</h3>
          <p className="text-muted-foreground leading-relaxed">Rank candidates and hire with confidence, faster.</p>
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection