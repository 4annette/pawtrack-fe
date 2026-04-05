import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import FCMHandler from "./FCMHandler";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/User/Profile";
import MyReports from "./pages/User/MyReports";
import FoundReportDetails from "./pages/User/FoundReportDetails";
import LostReportDetails from "./pages/User/LostReportDetails";
import CreateFoundReport from './pages/CreateFoundReport';
import CreateLostReport from './pages/CreateLostReport';
import AccountSettings from "./pages/User/AccountSettings";

import ReportsManagement from "./pages/Admin/ReportsManagement";
import UserManagement from "./pages/Admin/UserManagement";
import VerificationRequestsManagement from "./pages/Admin/VerificationRequestsManagement";
import Statistics from "./pages/Admin/Statistics";

import UserFoundReports from "./pages/Admin/UserFoundReports";
import AdminViewFoundReport from "./pages/Admin/AdminViewFoundReport";
import UserLostReports from "./pages/Admin/UserLostReports";
import AdminViewLostReport from "./pages/Admin/AdminViewLostReport";
import AdminViewVerification from "./pages/Admin/AdminViewVerification";


import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/admin/AdminRoute";

import "./index.css";
import './i18n';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <FCMHandler />
      <Toaster position="top-center" richColors />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
        <Route path="/found-report-details/:id" element={<ProtectedRoute><FoundReportDetails /></ProtectedRoute>} />
        <Route path="/lost-report-details/:id" element={<ProtectedRoute><LostReportDetails /></ProtectedRoute>} />
        <Route path="/create-found-report" element={<ProtectedRoute><CreateFoundReport /></ProtectedRoute>} />
        <Route path="/create-lost-report" element={<ProtectedRoute><CreateLostReport /></ProtectedRoute>} />
        <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />

        <Route path="/admin/reports" element={<AdminRoute><ReportsManagement /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="/admin/verifications" element={<AdminRoute><VerificationRequestsManagement /></AdminRoute>} />
        <Route path="/admin/statistics" element={<AdminRoute><Statistics /></AdminRoute>} />

        <Route path="/admin/users/:userId/found-reports" element={<AdminRoute><UserFoundReports /></AdminRoute>} />
        <Route path="/admin/reports/found/:id" element={<AdminRoute><AdminViewFoundReport /></AdminRoute>} />
        <Route path="/admin/users/:userId/lost-reports" element={<AdminRoute><UserLostReports /></AdminRoute>} />
        <Route path="/admin/reports/lost/:id" element={<AdminRoute><AdminViewLostReport /></AdminRoute>} />
        <Route path="/admin/verifications/:id" element={<AdminRoute><AdminViewVerification /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);