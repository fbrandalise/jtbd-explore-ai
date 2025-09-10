import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Analysis from "./pages/Analysis";
import Analytics from "./pages/Analytics";
import Journey from "./pages/Journey";
import Admin from "./pages/Admin";
import Users from "./pages/admin/Users";
import NewUser from "./pages/admin/NewUser";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleGuard } from "./components/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes - public */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/journey" element={<ProtectedRoute><Journey /></ProtectedRoute>} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <RoleGuard requiredRole="admin">
                <Admin />
              </RoleGuard>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <RoleGuard requiredRole="admin">
                <Users />
              </RoleGuard>
            </ProtectedRoute>
          } />
          <Route path="/admin/users/new" element={
            <ProtectedRoute>
              <RoleGuard requiredRole="admin">
                <NewUser />
              </RoleGuard>
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
