import React from "react";
import { AnimatedLogo } from "@/components/ui/AnimatedLogo";
import { Navigation } from "@/components/Navigation";

export default function AnimatedLogoShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Animated Logo Showcase
            </h1>
            <p className="text-lg text-muted-foreground">
              Experience the elegant flag-waving animation of the Dzikwa logo
            </p>
          </div>

          {/* Main showcase area */}
          <div className="bg-white rounded-2xl shadow-xl p-12 mb-12">
            <div className="flex flex-col items-center space-y-8">
              {/* Large animated logo */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
                <AnimatedLogo size={200} className="relative" />
              </div>
              
              {/* Description */}
              <div className="text-center max-w-2xl">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Gentle Flag-Waving Motion
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Watch as the Dzikwa logo comes to life with a realistic fabric-like animation. 
                  The gentle undulating movement mimics a flag waving in a soft breeze, 
                  creating a serene and professional appearance that embodies the dynamic 
                  nature of your check-in system.
                </p>
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex justify-center mb-4">
                <AnimatedLogo size={60} />
              </div>
              <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                Fluid Animation
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Smooth, non-repetitive motion with realistic fabric ripples
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex justify-center mb-4">
                <AnimatedLogo size={60} />
              </div>
              <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                Subtle Lighting
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Soft shadows and gradients enhance the 3D wave effect
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex justify-center mb-4">
                <AnimatedLogo size={60} />
              </div>
              <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                Brand Consistency
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Maintains Dzikwa's blue-teal color scheme throughout
              </p>
            </div>
          </div>

          {/* Technical details */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
              Animation Characteristics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-foreground">Duration</h4>
                    <p className="text-sm text-muted-foreground">8-second wave cycles with 1-second fade-in</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-foreground">Motion Type</h4>
                    <p className="text-sm text-muted-foreground">Combined skewY and scale transforms</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-foreground">Visual Effects</h4>
                    <p className="text-sm text-muted-foreground">Drop shadows, gradients, and shimmer</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-foreground">Atmosphere</h4>
                    <p className="text-sm text-muted-foreground">Clean, neutral background with soft lighting</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
