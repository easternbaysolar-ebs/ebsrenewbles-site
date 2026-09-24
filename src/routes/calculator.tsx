import { createFileRoute } from "@tanstack/react-router";
import { CalculatorPage } from "@/components/site/PublicPages";
export const Route = createFileRoute("/calculator")({ component: CalculatorPage });
