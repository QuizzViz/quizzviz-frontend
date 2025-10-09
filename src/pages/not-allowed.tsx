export default function NotAllowedPage() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">🚫 Access Restricted</h1>
        <p className="text-lg text-gray-600">
          Users can only attempt the quiz from a laptop or desktop.
        </p>
      </div>
    );
  }
  