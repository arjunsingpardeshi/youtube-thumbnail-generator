import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Star, Sparkles, Download } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-black/60 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-red-400">YTThumbs</span>
        </div>
        <nav className="hidden md:flex gap-6 text-gray-300 text-sm font-medium">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#templates" className="hover:text-white">Templates</a>
          <a href="#testimonials" className="hover:text-white">Testimonials</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
        </nav>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="outline" className="border-white text-white">Login</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-red-400 hover:bg-red-700">Sign Up</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Create Stunning YouTube Thumbnails in Minutes
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-6">
          No design skills needed. Pick a template, customize, and download instantly.
        </p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button className="bg-red-400 hover:bg-red-700 text-lg px-6 py-3">
              Start Creating
            </Button>
          </Link>
          <Button variant="outline" className="border-white text-white text-lg px-6 py-3">
            Try Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-6 grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {[
          { icon: Sparkles, title: "Ready Templates", desc: "Choose from 100+ pre-designed thumbnails." },
          { icon: Play, title: "Drag & Drop", desc: "Customize easily with our simple editor." },
          { icon: Star, title: "Custom Fonts", desc: "Use your own fonts, colors, and branding." },
          { icon: Download, title: "Instant Download", desc: "Export high-quality thumbnails instantly." },
        ].map((feature, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <feature.icon className="w-10 h-10 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Templates Showcase */}
      <section id="templates" className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">Popular Templates</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden bg-gray-800 border-gray-700">
              <img
                src={`https://placehold.co/600x340?text=Thumbnail+${i + 1}`}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-40 object-cover"
              />
              <CardContent className="p-4 flex justify-center">
                <Button className="bg-red-400 hover:bg-red-700 w-full">Customize</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 px-6 bg-gray-900">
        <h2 className="text-3xl font-bold text-center mb-10">What Creators Say</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {["Boosted my CTR by 50%!", "Super easy to use.", "Best thumbnail maker ever!"].map(
            (quote, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 text-center text-gray-300">
                  <p>“{quote}”</p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center px-6">
        <h2 className="text-4xl font-bold mb-4">
          Your next viral video starts with the perfect thumbnail.
        </h2>
        <Link href="/login">
          <Button className="bg-red-400 hover:bg-red-700 text-lg px-6 py-3 mt-4">
            Start Creating Free
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-800 text-center text-gray-400 text-sm">
        © 2025 Thumbnail Creator. All rights reserved.
      </footer>
    </div>
  );
}
