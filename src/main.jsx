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

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <FCMHandler />
      <Toaster position="top-center" richColors />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/found-report-details/:id" element={<FoundReportDetails />} />
        <Route path="/lost-report-details/:id" element={<LostReportDetails />} />
        <Route path="/create-found-report" element={<CreateFoundReport />} />
        <Route path="/create-lost-report" element={<CreateLostReport />} />
        
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);