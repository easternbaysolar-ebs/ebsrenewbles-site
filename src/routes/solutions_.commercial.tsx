import { createFileRoute } from "@tanstack/react-router";
import { SolutionsPage } from "@/components/site/PublicPages";
export const Route = createFileRoute("/solutions_/commercial")({
  component: () => <SolutionsPage sector="commercial" />,
});
