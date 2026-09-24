import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/components/site/PublicPages";
export const Route = createFileRoute("/products")({ component: ProductsPage });
