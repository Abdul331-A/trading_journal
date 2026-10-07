import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-5xl font-bold">404</p>
      <p className="mt-2 text-ink-500">That page does not exist.</p>
      <Link to="/" className="mt-4 inline-block font-medium text-brand-600">Back to dashboard</Link>
    </div>
  );
}
