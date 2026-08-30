export default function DashboardLoadingPage() {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      <div className="h-8 w-48 bg-[#241f18] rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-[#241f18] rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-[#241f18] rounded-lg animate-pulse" />
    </div>
  );
}
