import { redirect } from "next/navigation";
import AuthLayout from "../../components/AuthLayout";

export default async function RegisterPage() {

    return (
        <AuthLayout mode="register">
            <></>
        </AuthLayout>
    );
}
