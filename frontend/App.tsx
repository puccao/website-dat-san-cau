import React, { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext.js";
import { Navbar } from "./components/common/Navbar.js";
import { Footer } from "./components/common/Footer.js";
import { AdminLayout } from "./components/admin/AdminLayout.js";

// User Subpages
import { HomePage } from "./pages/user/HomePage.js";
import { BookingPage } from "./pages/user/BookingPage.js";
import { MyBookingsPage } from "./pages/user/MyBookingsPage.js";

// Admin Subpages
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage.js";
import { AdminBookingsPage } from "./pages/admin/AdminBookingsPage.js";
import { AdminCourtsPage } from "./pages/admin/AdminCourtsPage.js";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage.js";

// Auth Subpages
import { LoginPage } from "./pages/auth/LoginPage.js";
import { RegisterPage } from "./pages/auth/RegisterPage.js";

function getInitialPath(): string {
  const hash = window.location.hash.slice(1);
  if (hash) {
    return hash.startsWith("/") ? hash : `/${hash}`;
  }
  return window.location.pathname || "/";
}

export function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);

  // Sync state with browser hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const target = hash ? (hash.startsWith("/") ? hash : `/${hash}`) : "/";
      setCurrentPath(target);
      window.scrollTo(0, 0);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const isAdminRoute = currentPath.startsWith("/admin");

  // If in Admin Area, render with dedicated AdminLayout
  if (isAdminRoute) {
    return (
      <AdminLayout currentPath={currentPath} navigate={navigate}>
        {currentPath === "/admin" && <AdminDashboardPage navigate={navigate} />}
        {currentPath === "/admin/bookings" && <AdminBookingsPage />}
        {currentPath === "/admin/courts" && <AdminCourtsPage />}
        {currentPath === "/admin/users" && <AdminUsersPage />}
      </AdminLayout>
    );
  }

  // Normal User and Auth Pages with Navbar and Footer
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar currentPath={currentPath} navigate={navigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentPath === "/" && <HomePage navigate={navigate} />}
        {currentPath === "/booking" && <BookingPage navigate={navigate} />}
        {currentPath === "/my-bookings" && <MyBookingsPage navigate={navigate} />}
        {currentPath === "/login" && <LoginPage navigate={navigate} />}
        {currentPath === "/register" && <RegisterPage navigate={navigate} />}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
