import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/site/LoginPage";
export const Route = createFileRoute("/auth")({ component: LoginPage });
