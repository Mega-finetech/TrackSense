import { forwardRef } from 'react';

const baseField =
  'w-full rounded-xl border border-line bg-card px-4 text-[15px] text-ink placeholder:text-ink-mute ' +
  'transition-all duration-200 outline-none ' +
  'focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/15 ' +
  'disabled:opacity-50';

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={`${baseField} h-12 ${className}`} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className = '', rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${baseField} py-3 leading-relaxed resize-y ${className}`}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className = '', children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`${baseField} h-12 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238698AB%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat pr-10 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-soft">
          {label}
          {hint && <span className="font-normal text-ink-mute">{hint}</span>}
        </span>
      )}
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-rose-500">{error}</span>}
    </label>
  );
}
