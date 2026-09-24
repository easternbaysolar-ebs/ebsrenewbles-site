import { createFileRoute } from "@tanstack/react-router";
import { SchemesPage } from "@/components/site/PublicPages";
export const Route = createFileRoute("/schemes")({ component: SchemesPage });
