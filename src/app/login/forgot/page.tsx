import { ForgotPasswordForm } from "@/components/features/login";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
