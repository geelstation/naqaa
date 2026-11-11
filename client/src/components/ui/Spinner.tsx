export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-3 border-naqaa-200 border-t-naqaa-600 rounded-full animate-spin" />
    </div>
  );
}
