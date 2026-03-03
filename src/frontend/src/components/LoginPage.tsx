import { Button } from "@/components/ui/button";
import { Flame, Loader2, Target, TrendingUp, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left column - hero */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-chart-2/5 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-xl text-gradient-amber">
              FocusFlow
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-display text-5xl font-black leading-tight mb-4">
              Stop Procrastinating.
              <br />
              <span className="text-gradient-amber">Start Executing.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              Break down overwhelming goals into daily actions. Build habits
              that stick. Track the "why" behind every task and never miss a
              deadline again.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: Target,
                label: "Smart Goal Breakdown",
                desc: "19 days? Auto-distributed daily tasks",
              },
              {
                icon: Flame,
                label: "Streak Tracking",
                desc: "Build momentum with daily consistency",
              },
              {
                icon: TrendingUp,
                label: "Insights & Patterns",
                desc: "Understand your procrastination triggers",
              },
              {
                icon: Zap,
                label: "Daily Retrospective",
                desc: "Hour-by-hour productivity logging",
              },
            ].map(({ icon: Icon, label, desc }, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static list
                key={i}
                className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm fade-up"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <Icon className="w-5 h-5 text-primary mb-2" />
                <div className="font-display text-sm font-semibold text-foreground">
                  {label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>

      {/* Right column - login */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-xl text-gradient-amber">
              FocusFlow
            </span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-black">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to access your focus dashboard
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-elevated space-y-4">
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg">Secure Login</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your tasks and goals are securely stored on the Internet
                Computer blockchain.
              </p>
            </div>

            {isLoginError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {loginError?.message || "Login failed. Please try again."}
              </div>
            )}

            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-11 font-display font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 glow-amber transition-all"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              No account needed — your identity is created instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
