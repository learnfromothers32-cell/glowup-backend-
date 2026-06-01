// components/consumer/WelcomeBanner.tsx
import { useAuth } from "../../context/AuthContext";

export default function WelcomeBanner() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white rounded-2xl p-4 shadow-sm">
        <div className="h-6 w-40 bg-slate-200 rounded" />
        <div className="h-4 w-56 mt-2 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      {user ? (
        <>
          <h2 className="text-xl font-bold text-slate-800">
            👋 Hi, {user.name.split(" ")[0]}!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ready to book your next style?
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold text-slate-800">
            Find your perfect stylist
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Sign in for personalised picks
          </p>
        </>
      )}
    </div>
  );
}