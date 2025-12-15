import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard/Dashboard";
import CreateFoundReport from './pages/CreateFoundReport';
import CreateLostReport from './pages/CreateLostReport';

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-found-report" element={<CreateFoundReport />} />
        {/* ADD THIS ROUTE */}
        <Route path="/create-lost-report" element={<CreateLostReport />} />
        
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);