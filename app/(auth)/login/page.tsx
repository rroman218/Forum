import { redirect } from "next/navigation";
import AuthLayout from "../../../components/AuthLayout";
import LoginForm from "../../../components/LoginForm";

export default async function LoginPage() {

  return (
    <AuthLayout mode="login">
      <LoginForm />
    </AuthLayout>
  );
}
