import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-[#0A2E1F] text-white hover:bg-[#051810] shadow-lg shadow-emerald-900/10",
      secondary: "bg-[#F0F7F4] text-[#0A2E1F] hover:bg-[#D1E7DD]",
      outline: "border border-[#E2E8F0] bg-transparent hover:bg-[#F8FAFC] text-[#0A0D14]",
      ghost: "hover:bg-[#F0F7F4] text-[#0A0D14]",
      destructive: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
    };

    const sizes = {
      sm: "h-9 px-4 text-[10px] font-black uppercase tracking-widest",
      md: "h-12 px-6 text-[11px] font-black uppercase tracking-widest",
      lg: "h-14 px-10 text-[12px] font-black uppercase tracking-widest",
      icon: "h-12 w-12",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-[2rem] border border-slate-50 bg-white text-[#0A0D14] shadow-2xl shadow-slate-200/40", className)} {...props} />
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 p-8", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-xl font-black tracking-tight text-[#0A2E1F]", className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-8 pt-0", className)} {...props} />
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-slate-100 bg-white px-5 py-3 text-sm font-medium transition-all placeholder:text-slate-300 focus:outline-none focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Badge = ({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "destructive" | "outline" | "success" }) => {
  const variants = {
    default: "bg-[#0A2E1F] text-white",
    secondary: "bg-[#F0F7F4] text-[#0A2E1F]",
    destructive: "bg-[#EF4444] text-white",
    outline: "text-[#0A0D14] border border-[#E2E8F0]",
    success: "bg-[#10B981] text-white",
  };
  return (
    <div className={cn("inline-flex items-center rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors", variants[variant], className)} {...props} />
  );
};
