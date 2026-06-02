import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/40">
      <div className="container mx-auto max-w-screen-2xl px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg tracking-tight">EduPulse AI</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Transforming static study materials into dynamic, interactive learning experiences. Master concepts faster with AI-powered interrogation and adaptive quizzes.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link></li>
              <li><Link href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} EduPulse AI. All rights reserved.</p>
          <p>Built for students everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
