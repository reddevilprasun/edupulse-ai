import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { 
  ArrowRight, 
  BrainCircuit, 
  MessageSquareText, 
  Zap,
  CheckCircle2,
  UploadCloud,
  FileText
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
          {/* Subtle Background Gradients */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 blur-3xl opacity-30 pointer-events-none">
            <div className="aspect-square h-[400px] rounded-full bg-primary/40"></div>
          </div>
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 blur-3xl opacity-20 pointer-events-none">
            <div className="aspect-square h-[300px] rounded-full bg-blue-500/40"></div>
          </div>

          <div className="container mx-auto max-w-screen-xl px-4 md:px-8 text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8">
              <SparklesIcon className="mr-2 h-4 w-4" />
              <span>Smarter studying is here</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-[1.1]">
              Transform Static PDFs into <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                Interactive Learning Hubs
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your syllabus or study materials. Instantly interrogate documents, generate custom practice quizzes, and master concepts faster with our AI-powered study workspace.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-lg shadow-primary/25" asChild>
                <Link href="/sign-up">
                  Start Learning for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base bg-background/50 backdrop-blur" asChild>
                <Link href="/dashboard">
                  View Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section id="features" className="py-24 bg-muted/30 border-y border-border/40">
          <div className="container mx-auto max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Supercharge Your Study Sessions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Built with modern AI and engineered for speed, EduPulse gives you the tools to actively engage with your materials.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-background rounded-2xl p-8 border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <MessageSquareText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Context-Aware AI Chat</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ask questions directly about your uploaded documents. The AI references only your text, acting as a highly targeted, hallucination-free tutor.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-background rounded-2xl p-8 border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-500">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Dynamic Practice Quizzes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate multiple-choice quizzes ranging from 3 to 20 questions based on any document. Practice step-by-step with instant visual feedback and explanations.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-background rounded-2xl p-8 border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Lightning Fast Workflow</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Switch between documents instantly with our optimized in-memory cache. Zero loading spinners, zero lag, just pure uninterrupted focus.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works Section ── */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto max-w-screen-xl px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">How EduPulse Works</h2>
                  <p className="text-muted-foreground text-lg">
                    Go from static reading to active mastery in three simple steps.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold">1</div>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-1">Upload your materials</h4>
                      <p className="text-muted-foreground">Upload any PDF textbook, syllabus, or reading assignment securely to your workspace.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold">2</div>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-1">Interrogate the text</h4>
                      <p className="text-muted-foreground">Start chatting immediately. Ask for summaries, clarifications, or key concept breakdowns.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold">3</div>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-1">Test your knowledge</h4>
                      <p className="text-muted-foreground">Generate interactive quizzes to test your recall and solidify your understanding before exams.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Mockup Placeholder */}
              <div className="flex-1 w-full">
                <div className="relative rounded-2xl border border-border/50 bg-muted/20 p-2 shadow-2xl overflow-hidden aspect-[4/3] flex flex-col">
                  {/* Fake window header */}
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/40 bg-background/50">
                    <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
                    <div className="h-3 w-3 rounded-full bg-amber-400/80"></div>
                    <div className="h-3 w-3 rounded-full bg-emerald-400/80"></div>
                  </div>
                  {/* Fake UI */}
                  <div className="flex-1 p-4 md:p-6 flex gap-4">
                    <div className="w-1/3 bg-background rounded-lg border border-border/40 flex flex-col gap-2 p-3 opacity-80">
                      <div className="h-4 w-3/4 bg-muted rounded"></div>
                      <div className="h-8 w-full bg-accent rounded mt-4"></div>
                      <div className="h-8 w-full bg-muted/50 rounded"></div>
                    </div>
                    <div className="flex-1 bg-background rounded-lg border border-border/40 flex flex-col p-4 opacity-90">
                      <div className="flex-1 space-y-4">
                        <div className="flex gap-2 justify-end">
                          <div className="h-10 w-2/3 bg-primary/20 rounded-2xl rounded-tr-sm"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-16 w-3/4 bg-muted rounded-2xl rounded-tl-sm"></div>
                        </div>
                      </div>
                      <div className="h-10 w-full bg-muted/50 rounded-md mt-4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials Section ── */}
        <section id="testimonials" className="py-24 bg-muted/30 border-y border-border/40">
          <div className="container mx-auto max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Students</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                See how EduPulse AI is helping students master their coursework faster.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-background rounded-2xl p-6 border border-border/60 shadow-sm">
                <div className="flex gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">
                  &quot;The ability to instantly generate quizzes from my 400-page biology syllabus is a game changer. I feel way more prepared for my midterms now.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>SJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">Sarah Jenkins</p>
                    <p className="text-xs text-muted-foreground">Pre-Med Student</p>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-2xl p-6 border border-border/60 shadow-sm">
                <div className="flex gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">
                  &quot;I used to spend hours re-reading chapters. Now I just ask the AI to summarize complex topics and immediately test myself. My grades have noticeably improved.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>MC</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">Michael Chen</p>
                    <p className="text-xs text-muted-foreground">Computer Science Major</p>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-2xl p-6 border border-border/60 shadow-sm">
                <div className="flex gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">
                  &quot;The chat interface is so fast, and the explanations in the practice quizzes really help me understand *why* I got a question wrong.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>AL</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">Amanda Lopez</p>
                    <p className="text-xs text-muted-foreground">Law Student</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA Section ── */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10"></div>
          <div className="container mx-auto max-w-screen-xl px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to upgrade your study routine?</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join EduPulse AI today and start turning your passive reading into active, effective learning.
            </p>
            <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20" asChild>
              <Link href="/sign-up">
                Create Your Free Account
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ── Icons Helper ──
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
