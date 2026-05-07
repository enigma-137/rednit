import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
};

const variants = {
  solid:
    "border-black bg-black text-white hover:bg-white hover:text-black disabled:hover:bg-black disabled:hover:text-white",
  outline: "border-black bg-white text-black hover:bg-black hover:text-white",
  ghost: "border-transparent bg-white text-black hover:border-black"
};

export function Button({ className = "", variant = "solid", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center border px-5 font-sans text-xs font-bold uppercase tracking-[0.1em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
