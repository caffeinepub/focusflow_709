import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import type { Goal } from "./backend.d";
import DashboardView from "./components/DashboardView";
import GoalDetailView from "./components/GoalDetailView";
import GoalsView from "./components/GoalsView";
import InsightsView from "./components/InsightsView";
import LoginPage from "./components/LoginPage";
import MorningPrompt from "./components/MorningPrompt";
import RecurringTasksView from "./components/RecurringTasksView";
import RetrospectiveView from "./components/RetrospectiveView";
import Sidebar from "./components/Sidebar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

export type AppView =
  | "dashboard"
  | "goals"
  | "recurring"
  | "retrospective"
  | "insights"
  | "goal-detail";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [currentView, setCurrentView] = useState<AppView>("dashboard");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoggedIn = !!identity;

  // Close sidebar on view change (mobile)
  // biome-ignore lint/correctness/useExhaustiveDependencies: setSidebarOpen is stable
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentView]);

  const navigateTo = (view: AppView, goal?: Goal) => {
    if (view === "goal-detail" && goal) {
      setSelectedGoal(goal);
    }
    setCurrentView(view);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-body">
            Loading FocusFlow…
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView onNavigate={navigateTo} />;
      case "goals":
        return <GoalsView onNavigate={navigateTo} />;
      case "goal-detail":
        return selectedGoal ? (
          <GoalDetailView
            goal={selectedGoal}
            onBack={() => setCurrentView("goals")}
          />
        ) : (
          <GoalsView onNavigate={navigateTo} />
        );
      case "recurring":
        return <RecurringTasksView />;
      case "retrospective":
        return <RetrospectiveView />;
      case "insights":
        return <InsightsView />;
      default:
        return <DashboardView onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={navigateTo}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-accent transition-colors mr-3"
            aria-label="Open menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              role="presentation"
            >
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span className="font-display font-bold text-lg text-gradient-amber">
            FocusFlow
          </span>
        </header>

        {/* View content */}
        <main className="flex-1 overflow-y-auto">{renderView()}</main>
      </div>

      {/* Morning prompt */}
      {isLoggedIn && <MorningPrompt />}

      <Toaster richColors position="top-right" />
    </div>
  );
}
