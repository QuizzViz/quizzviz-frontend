import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Brain } from "lucide-react";
// import { Button } from "react-day-picker";
import { Button } from "@/components/ui/button";




export default function DashboardSideBar() {
  const sidebarItems = [
    { label: "Dashboard", icon: Brain, active: true },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-border flex items-center space-x-2">
        <div className=" p-2 rounded-lg">
          {/* <Brain className="h-6 w-6 text-background" /> */}
          <img className="h-12 w-12 text-background" src="/QuizzViz-logo.png" alt="Logo" width={32} height={32}/>
        </div>
        <h1 className="text-xl font-bold text-foreground mr-2">QuizzViz</h1>
      </div>

      {/* Sidebar Navigation */}
      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {sidebarItems.map((item, index) => (
            <Button
              key={index}
              variant={item.active ? "default" : "ghost"}
              className={`w-full justify-start transition-all duration-200 ${
                item.active
                  ? "bg-foreground text-background shadow-lg"
                  : "hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
