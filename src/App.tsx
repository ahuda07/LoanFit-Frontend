import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="login-button">Login</button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <main className="main-content">
        <h1 className="welcome-message">Welcome to LoanFit Copilot</h1>
      </main>
    </div>
  )
}

export default App
