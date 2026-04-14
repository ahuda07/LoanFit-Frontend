import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser, useAuth } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { useEffect, useState } from 'react'
import './App.css'
import './clerk-theme.css'
import Sidebar from './components/Sidebar'
import ChatBox from './components/ChatBox'
import logo from './components/Logo.png'

type FontSize = 'small' | 'medium' | 'large'

function InnerApp({
  theme,
  setTheme,
  fontSize,
  setFontSize
}: {
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  fontSize: FontSize;
  setFontSize: React.Dispatch<React.SetStateAction<FontSize>>;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const [authError, setAuthError] = useState("");
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const [activeSession, setActiveSession] = useState<{ sessionId: string, messages: any[] } | null>(null);
  const [refreshChatsTrigger, setRefreshChatsTrigger] = useState(0);

  const handleNewChat = () => {
    setActiveSession(null);
    setNewChatTrigger(prev => prev + 1);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize)
    localStorage.setItem('fontSize', fontSize)
  }, [fontSize])

  useEffect(() => {
    const storedError = sessionStorage.getItem('clerkAuthError');
    if (storedError) {
      setAuthError(storedError);
      sessionStorage.removeItem('clerkAuthError');
      setTimeout(() => setAuthError(""), 5000);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      // Replace with @gmail.com to test multiple accounts
      if (email && !email.endsWith('@uci.edu')) {
        const errorMsg = "Error: You are not authorized to sign in. Only @uci.edu emails are currently allowed.";
        sessionStorage.setItem('clerkAuthError', errorMsg);
        setAuthError(errorMsg);
        signOut();
        setTimeout(() => setAuthError(""), 5000);
      } else {
        setAuthError("");
      }
    }
  }, [isLoaded, isSignedIn, user, signOut]);

  const isUnauthorized =
    isSignedIn &&
    user &&
    user.primaryEmailAddress?.emailAddress &&
    // Replace with @gmail.com to test with multiple accounts
    !user.primaryEmailAddress.emailAddress.endsWith('@uci.edu');

  return (
    <div className="main-layout">

      {isSignedIn && (
        <Sidebar
          refreshTrigger={refreshChatsTrigger}
          onNewChat={handleNewChat}
          activeSessionId={activeSession?.sessionId ?? null}
          onSelectChat={(sessionId, messages) => setActiveSession({ sessionId, messages })}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
        />
      )}

      {!isSignedIn && (
        <div
          style={{
            position: "fixed",
            top: 10,
            left: 10,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ width: "40px", height: "auto" }}
          />
        </div>
      )}

      <div className="app-container" style={{ flex: 1 }}>
        {authError && (
          <div className="auth-error-banner">
            {authError}
          </div>
        )}

        <header className="app-header">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="login-button"
                onClick={() => setAuthError("")}
              >
                Login
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {!isUnauthorized && <UserButton />}
          </SignedIn>
        </header>

        <SignedOut>
          <main className="main-content" style={{ justifyContent: 'center' }}>
            <h1 className="welcome-message" style={{ textAlign: 'center' }}>
              Welcome to LoanFit Copilot!
            </h1>
            <p className="welcome-message" style={{ textAlign: 'center' }}>
              Please login to continue...
            </p>
          </main>
        </SignedOut>

        <SignedIn>
          {!isUnauthorized && (
            <main className="main-content">
              <ChatBox
                newChatTrigger={newChatTrigger}
                activeSessionId={activeSession?.sessionId}
                initialMessages={activeSession?.messages}
                userName={user?.firstName || "User"}
                onChatCreated={(sessionId) => {
                  setActiveSession({ sessionId, messages: [] });
                  setRefreshChatsTrigger(prev => prev + 1);
                }}
                onChatUpdated={() => setRefreshChatsTrigger(prev => prev + 1)}
              />
            </main>
          )}
        </SignedIn>
      </div>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('fontSize') as FontSize) || 'medium';
  });

  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key");
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: 'var(--accent)',
          colorBackground: 'var(--surface)',
          colorInputBackground: 'var(--surface-2)',
          colorText: 'var(--text)',
          colorTextSecondary: 'var(--text-muted)',
          colorDanger: 'var(--error-text)',
          colorSuccess: '#22c55e',
          fontFamily: 'inherit'
        },
        elements: {
          card: 'clerk-custom-card',
          primaryButton: 'clerk-custom-primary-button'
        }
      }}
    >
      <InnerApp
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />
    </ClerkProvider>
  )
}

export default App
