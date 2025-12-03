/**
 * Loading Skeleton Components
 * Form ve Dashboard için skeleton screens
 */

const FormSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 rounded-lg animate-shimmer"></div>
          <div className="h-8 w-48 bg-slate-700 rounded-lg animate-shimmer"></div>
        </div>
        <div className="h-10 w-32 bg-slate-700 rounded-lg animate-shimmer"></div>
      </div>
      
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((j) => (
              <div key={j} className="space-y-2">
                <div className="h-5 w-32 bg-slate-700 rounded animate-shimmer"></div>
                <div className="h-10 w-full bg-slate-700 rounded-lg animate-shimmer"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Analiz Sonucu Skeleton */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 animate-fade-in">
        <div className="h-7 w-40 bg-slate-700 rounded mb-6 animate-shimmer"></div>
        <div className="flex justify-center mb-6">
          <div className="w-64 h-64 bg-slate-700 rounded-full animate-shimmer"></div>
        </div>
        <div className="h-24 w-full bg-slate-700 rounded-lg animate-shimmer"></div>
      </div>

      {/* Model Güvenilirliği Skeleton */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 animate-fade-in">
        <div className="h-7 w-40 bg-slate-700 rounded mb-6 animate-shimmer"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-700 rounded-lg animate-shimmer"></div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-700 rounded-lg animate-shimmer"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { FormSkeleton, DashboardSkeleton };

