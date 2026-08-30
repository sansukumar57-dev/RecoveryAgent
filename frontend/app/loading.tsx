export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-[#17130c] flex items-center justify-center">
      <div className="text-center space-y-4 font-mono">
        <div className="w-8 h-8 border-2 border-[#fbc162] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#a79f93]">Loading...</p>
      </div>
    </div>
  );
}
