import { createFileRoute } from "@tanstack/react-router";
import { ApplicationPage } from "@/components/site/ApplicationPage";
export const Route = createFileRoute("/application")({ component: ApplicationPage });

