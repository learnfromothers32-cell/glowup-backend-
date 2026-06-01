import { cn } from "../../utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export default function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const base =
    "px-4 py-2 text-sm font-medium transition-all duration-200";

  const variants = {
    primary:
      "bg-black text-white hover:opacity-90 rounded-full",
    secondary:
      "border border-black text-black hover:bg-black hover:text-white rounded-full",
    ghost:
      "text-black hover:opacity-70",
  };

  return (
    <button
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}