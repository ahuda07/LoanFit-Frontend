import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import ChatBox from './components/ChatBox'


function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const [authError, setAuthError] = useState("");

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

  const isUnauthorized = isSignedIn && user && user.primaryEmailAddress?.emailAddress && !user.primaryEmailAddress.emailAddress.endsWith('@uci.edu');

  return (
    <div className="main-layout">
      <Sidebar />

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
                onClick={() => {
                  setAuthError("");
                }}
              >
                Login
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            {!isUnauthorized && <UserButton />}
          </SignedIn>
        </header>

        {(!isUnauthorized) && (
          <main className="main-content">
            <h1 className="welcome-message">Welcome Back, {user?.firstName || "User"}!</h1>
            <ChatBox />
          </main>
        )}
      </div>
    </div>
  )
}

export default App
