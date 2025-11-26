const tabs = ["All", "Unread", "Tasks", "Projects", "Team"] as const;

type Tab = typeof tabs[number];

interface NotificationTabsProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

export function NotificationTabs({ activeTab, onChange }: NotificationTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-full border bg-muted/30 p-1">
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={[
              "rounded-full px-4 py-2 text-sm transition-colors",
              isActive ? "bg-white text-foreground shadow-sm font-medium" : "text-muted-foreground hover:bg-muted/30",
            ].join(" ")}
            type="button"
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

export type NotificationTab = Tab;
