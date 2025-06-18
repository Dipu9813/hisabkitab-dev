// Make sure the file exists at the correct path and the filename matches (case-sensitive on some systems)
import RegisterForm from "../../components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <RegisterForm />
    </main>
  );
}
