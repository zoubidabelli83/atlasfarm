export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-border p-8 w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          Authentication Error
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Something went wrong during sign in. Please try again.
        </p>
        <a
          href="/auth/login"
          className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Return to Login
        </a>
      </div>
    </div>
  );
}
