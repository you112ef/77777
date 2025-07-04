import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home as HomeIcon, 
  Camera, 
  BarChart3, 
  FileText, 
  Settings,
  Microscope,
  Activity,
  Zap,
  Upload,
  Play
} from "lucide-react";
import HomePage from "./pages/HomePage";
import AnalyzePage from "./pages/AnalyzePage";
import ResultsPage from "./pages/ResultsPage";
import GraphsPage from "./pages/GraphsPage";
import SettingsPage from "./pages/SettingsPage";

type Page = 'home' | 'analyze' | 'results' | 'graphs' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [darkMode, setDarkMode] = useState(false);

  const pages = [
    { id: 'home', name: 'Home', nameAr: 'الرئيسية', icon: HomeIcon },
    { id: 'analyze', name: 'Analyze', nameAr: 'تحليل', icon: Camera },
    { id: 'results', name: 'Results', nameAr: 'النتائج', icon: FileText },
    { id: 'graphs', name: 'Graphs', nameAr: 'الرسوم البيانية', icon: BarChart3 },
    { id: 'settings', name: 'Settings', nameAr: 'الإعدادات', icon: Settings },
  ];

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'analyze':
        return <AnalyzePage onNavigate={handleNavigate} />;
      case 'results':
        return <ResultsPage onNavigate={handleNavigate} />;
      case 'graphs':
        return <GraphsPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} darkMode={darkMode} setDarkMode={setDarkMode} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`min-h-screen bg-background ${darkMode ? 'dark' : ''}`}>
      {/* Main Content */}
      <div className="pb-20">
        {renderPage()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          {pages.map((page) => {
            const Icon = page.icon;
            const isActive = currentPage === page.id;
            
            return (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.id as Page)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{page.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
