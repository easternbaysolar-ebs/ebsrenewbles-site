import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/components/site/PublicPages";
export const Route = createFileRoute("/projects")({ component: ProjectsPage });
