import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/site/PublicPages";
export const Route = createFileRoute("/contact")({ component: ContactPage });
