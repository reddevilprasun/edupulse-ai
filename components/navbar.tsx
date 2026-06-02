import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { BookOpen } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 md:px-8 mx-auto">
        <div className="flex items-center gap-2 mr-4">
          <BookOpen className="h-6 w-6 text-primary" />
          <Link href="/" className="font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
            EduPulse AI
          </Link>
        </div>
        
        <nav className="flex items-center gap-6 text-sm font-medium ml-6 hidden md:flex">
          <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Features
          </Link>
          <Link href="#how-it-works" className="transition-colors hover:text-foreground/80 text-foreground/60">
            How it Works
          </Link>
          <Link href="#testimonials" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Testimonials
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            <div className="h-4 w-px bg-border mx-2 hidden sm:block"></div>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/sign-in">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Register</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
