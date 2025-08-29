import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CustomAuthProvider } from "@/hooks/useCustomAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Auction from "./pages/Auction";
import Treasure from "./pages/Treasure";
import Wallet from "./pages/Wallet";
import Announcements from "./pages/Announcements";
import PendingItems from "./pages/PendingItems";
import CompletedTransactions from "./pages/CompletedTransactions";
import UnsoldItems from "./pages/UnsoldItems";
import AccountInquiry from "./pages/AccountInquiry";
import AnnouncementSettings from "./pages/AnnouncementSettings";
import AccountSettings from "./pages/AccountSettings";
import Audit from "./pages/Audit";
import PublicFund from "./pages/PublicFund";
import PublicFundManager from "./pages/PublicFundManager";
import Profile from "./pages/Profile";
import SubscriptionManager from "./pages/SubscriptionManager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CustomAuthProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auction" element={<Auction />} />
              <Route path="/treasure" element={<Treasure />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/pending" element={<PendingItems />} />
              <Route path="/completed" element={<CompletedTransactions />} />
              <Route path="/unsold" element={<UnsoldItems />} />
              <Route path="/account-inquiry" element={<AccountInquiry />} />
              <Route path="/announcement-settings" element={<AnnouncementSettings />} />
              <Route path="/account-settings" element={<AccountSettings />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/public-fund" element={<PublicFund />} />
              <Route path="/public-fund-manager" element={<PublicFundManager />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/subscription-manager" element={<SubscriptionManager />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </CustomAuthProvider>
  </QueryClientProvider>
);

export default App;
