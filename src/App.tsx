import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { CompanySetup } from "@/components/onboarding/CompanySetup";
import { Loader2 } from "lucide-react";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import CashFlow from "./pages/CashFlow";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Insights from "./pages/Insights";
import FinancialScore from "./pages/FinancialScore";
import AIAssistant from "./pages/AIAssistant";
import ExpenseAnalysis from "./pages/ExpenseAnalysis";
import RevenueAnalysis from "./pages/RevenueAnalysis";
import Automation from "./pages/Automation";
import AutomationPage from "./pages/AutomationPage";
import Team from "./pages/Team";
import SettingsPage from "./pages/Settings";
import Ledger from "./pages/Ledger";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import JournalEntries from "./pages/JournalEntries";
import AccountingClosing from "./pages/AccountingClosing";
import DreReport from "./pages/DreReport";
import BalanceSheet from "./pages/BalanceSheet";
import TaxesApurations from "./pages/Taxes";
import Expenses from "./pages/Expenses";
import CardsPage from "./pages/Cards";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import SavingsIntelligence from "./pages/SavingsIntelligence";
import RiskDashboard from "./pages/RiskDashboard";
import Treasury from "./pages/Treasury";
import Reconciliation from "./pages/Reconciliation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { company, isLoading: companyLoading } = useCompany();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (companyLoading) return <LoadingScreen />;
  if (!company) return <CompanySetup />;

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/cash-flow" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
      <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/expense-analysis" element={<ProtectedRoute><ExpenseAnalysis /></ProtectedRoute>} />
      <Route path="/revenue-analysis" element={<ProtectedRoute><RevenueAnalysis /></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
      <Route path="/financial-score" element={<ProtectedRoute><FinancialScore /></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/automation" element={<ProtectedRoute><AutomationPage /></ProtectedRoute>} />
      <Route path="/automation-legacy" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
      <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
      <Route path="/chart-of-accounts" element={<ProtectedRoute><ChartOfAccounts /></ProtectedRoute>} />
      <Route path="/journal-entries" element={<ProtectedRoute><JournalEntries /></ProtectedRoute>} />
      <Route path="/accounting-closing" element={<ProtectedRoute><AccountingClosing /></ProtectedRoute>} />
      <Route path="/dre-report" element={<ProtectedRoute><DreReport /></ProtectedRoute>} />
      <Route path="/balance-sheet" element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
      <Route path="/taxes" element={<ProtectedRoute><TaxesApurations /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/cards" element={<ProtectedRoute><CardsPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/reconciliation" element={<ProtectedRoute><Reconciliation /></ProtectedRoute>} />
      <Route path="/savings" element={<ProtectedRoute><SavingsIntelligence /></ProtectedRoute>} />
      <Route path="/risk" element={<ProtectedRoute><RiskDashboard /></ProtectedRoute>} />
      <Route path="/treasury" element={<ProtectedRoute><Treasury /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <div id="belvo"></div>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
