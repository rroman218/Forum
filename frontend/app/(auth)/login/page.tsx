import { redirect } from "next/navigation";
import AuthLayout from "../../components/AuthLayout";

export default async function LoginPage() {

  return (
    <AuthLayout mode="login">
      <></>
    </AuthLayout>
  );
}
