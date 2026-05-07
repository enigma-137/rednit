import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldProps = {
  label: string;
};

export function Input({
  label,
  className = "",
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.1em]">
        {label}
      </span>
      <input
        className={`w-full border-0 border-b border-black bg-white px-0 py-3 font-mono text-sm outline-none placeholder:text-gray-400 disabled:text-gray-600 ${className}`}
        {...props}
      />
    </label>
  );
}

export function Textarea({
  label,
  className = "",
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.1em]">
        {label}
      </span>
      <textarea
        className={`min-h-28 w-full resize-none border-0 border-b border-black bg-white px-0 py-3 font-mono text-sm outline-none placeholder:text-gray-400 ${className}`}
        {...props}
      />
    </label>
  );
}
