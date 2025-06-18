export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Auth Demo</h1>
      <div className="space-x-4">
        <a
          href="/register"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Register
        </a>
        <a
          href="/login"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Login
        </a>
      </div>
    </main>
  );
}
