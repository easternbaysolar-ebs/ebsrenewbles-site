import { createFileRoute } from "@tanstack/react-router";
import { QuotePage } from "@/components/site/PublicPages";
export const Route = createFileRoute("/quote")({ component: QuotePage });
