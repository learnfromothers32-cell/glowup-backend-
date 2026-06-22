import { useState } from "react";

interface FollowButtonProps {
  stylistId: string;
  isFollowing: boolean;
  onFollowChange: (stylistId: string, following: boolean) => void;
  className?: string;
  size?: "sm" | "md";
}

export function FollowButton({
  stylistId,
  isFollowing,
  onFollowChange,
  className = "",
  size = "sm",
}: FollowButtonProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    onFollowChange(stylistId, !isFollowing);
    setAnimating(false);
  };

  const sizeStyles =
    size === "sm"
      ? "text-[11px] px-3 py-1 rounded-full"
      : "text-xs px-4 py-1.5 rounded-full";

  return (
    <button
      onClick={handleClick}
      disabled={animating}
      className={`font-bold transition-all duration-200 active:scale-95 shrink-0 ${sizeStyles} ${
        isFollowing
          ? "bg-brand-500 text-white hover:bg-brand-600"
          : "bg-brand-50 text-brand-600 hover:bg-brand-100"
      } ${className}`}
    >
      {animating ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
