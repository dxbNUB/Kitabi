import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './components/Landing';
import Chat from './components/Chat';
import ChapterDisplay from './components/ChapterDisplay';
import ComparisonPage from './components/ComparisonPage';
import Toaster from './components/Toaster';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AcceptableUse from './pages/AcceptableUse';
import ReportAbuse from './pages/ReportAbuse';
import Onboarding from './pages/Onboarding';
import Welcome from './pages/Welcome';
import FontTest from './pages/FontTest';
import Settings from './pages/Settings';
import Editor from './pages/Editor';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import MyChapters from './pages/MyChapters';
import MyBooks from './pages/MyBooks';
import RequireAuth from './components/RequireAuth';
import AuthCallback from './components/AuthCallback';
import { useSession } from './store/session';

function ChapterRoute() {
  const { chapterGenerated, setChapterGenerated, setPhase, reset } = useSession();
  const navigate = useNavigate();

  if (!chapterGenerated) return <Navigate to="/" replace />;

  const handleRegenerate = (tone) => {
    setChapterGenerated(null);
    setPhase('chat');
    navigate('/chat', { state: { regenerateTone: tone } });
  };

  const handleNewStory = () => {
    const ok = window.confirm('Start a new book? Your current chapter and conversation will be cleared.');
    if (!ok) return;
    reset();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 bg-white overflow-visible">
        <button
          onClick={() => navigate('/')}
          className="font-display text-[#C8964D] text-xl tracking-[0.09em] font-medium flex-shrink-0 whitespace-nowrap"
          aria-label="Kitabi — go to home"
        >
          kitabi
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="flex-shrink-0 whitespace-nowrap text-sm text-gray-600 hover:text-[#C8964D] transition
                     flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          <span aria-hidden="true">←</span> Back to chat
        </button>
      </div>
      <ChapterDisplay
        onRegenerate={handleRegenerate}
        onContinue={() => navigate('/chat')}
        onNewStory={handleNewStory}
      />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"                element={<Landing />} />
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/how-it-works"    element={<HowItWorks />} />
        <Route path="/pricing"         element={<Pricing />} />
        <Route path="/about"           element={<About />} />
        <Route path="/faq"             element={<FAQ />} />
        {/* Gated routes — RequireAuth redirects to / when no session.
            Public routes (Landing, marketing, legal, onboarding/welcome
            pre-flow) stay open so non-signed-in visitors can still read
            them and decide to sign up. */}
        <Route path="/chat"            element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/chapter"         element={<RequireAuth><ChapterRoute /></RequireAuth>} />
        <Route path="/compare"         element={<ComparisonPage />} />
        <Route path="/terms"           element={<Terms />} />
        <Route path="/privacy"         element={<Privacy />} />
        <Route path="/acceptable-use"  element={<AcceptableUse />} />
        <Route path="/report-abuse"    element={<ReportAbuse />} />
        <Route path="/onboarding"      element={<Onboarding />} />
        <Route path="/welcome"         element={<Welcome />} />
        <Route path="/font-test"       element={<FontTest />} />
        <Route path="/settings"        element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/editor"          element={<RequireAuth><Editor /></RequireAuth>} />
        <Route path="/dashboard"       element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/my-chapters"     element={<RequireAuth><MyChapters /></RequireAuth>} />
        <Route path="/my-books"        element={<RequireAuth><MyBooks /></RequireAuth>} />
        <Route path="*"                element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      {/* Skip link — visible only when keyboard-focused. Appears in tab order
          before everything else so screen-reader / keyboard users can jump
          straight to page content without traversing nav. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200]
                   focus:px-4 focus:py-2 focus:bg-[#C8964D] focus:text-white focus:rounded-lg focus:shadow-lg
                   focus:outline-none focus:font-semibold"
      >
        Skip to main content
      </a>
      <AnimatedRoutes />
      <Toaster />
    </ErrorBoundary>
  );
}
