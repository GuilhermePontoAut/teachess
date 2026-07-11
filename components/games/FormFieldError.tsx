export function FormFieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-red-700">{message}</p>;
}
