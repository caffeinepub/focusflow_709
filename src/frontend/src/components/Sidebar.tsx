import { cn } from "@/lib/utils";
import {
  BarChart2,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Repeat,
  Target,
  X,
  Zap,
} from "lucide-react";
import type { AppView } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const NAV_ITEMS = [
  {
    id: "dashboard" as AppView,
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    id: "goals" as AppView,
    label: "Goals",
    icon: Target,
    ocid: "nav.goals.link",
  },
  {
    id: "recurring" as AppView,
    label: "Recurring Tasks",
    icon: Repeat,
    ocid: "nav.recurring.link",
  },
  {
    id: "retrospective" as AppView,
    label: "Retrospective",
    icon: BookOpen,
    ocid: "nav.retrospective.link",
  },
  {
    id: "insights" as AppView,
    label: "Insights",
    icon: BarChart2,
    ocid: "nav.insights.link",
  },
];

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  isOpen,
  onClose,
}: SidebarProps) {
  const { clear, identity } = useInternetIdentity();

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}…${principal.slice(-3)}`
    : "";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50",
        "transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-display font-black text-lg text-gradient-amber">
            FocusFlow
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div className="mb-3 px-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Navigation
          </span>
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentView === item.id ||
            (currentView === "goal-detail" && item.id === "goals");
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={item.ocid}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-primary/15 text-primary border border-primary/20 shadow-glow-sm",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive && "text-primary",
                )}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
          <div className="text-xs text-muted-foreground">Principal ID</div>
          <div className="text-xs font-mono text-sidebar-foreground/70 truncate">
            {shortPrincipal}
          </div>
        </div>
        <button
          type="button"
          onClick={clear}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
        <p className="px-2 text-[10px] text-muted-foreground/50 leading-relaxed">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </div>
    </aside>
  );
}
