import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { EventsListPage } from './pages/EventsListPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { EvalsPage } from './pages/EvalsPage';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-[#f5f5f5] text-[#0c0a09] font-sans selection:bg-[#0c0a09] selection:text-white">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/events" element={<EventsListPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              
              {/* Phase 20: Evals page is strictly developer-only and hidden in production */}
              {import.meta.env.DEV && (
                <Route path="/evals" element={<EvalsPage />} />
              )}
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
