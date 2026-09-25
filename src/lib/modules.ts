export type Field = {
  key: string;
  label: string;
  type?:
    undefined | "text" | "number" | "date" | "textarea" | "boolean" | "select" | "json" | "lines";
  options?: string[];
  relation?: string;
  required?: boolean;
};
export type Module = {
  title: string;
  table: string;
  label: string;
  fields: Field[];
  columns: string[];
};
const f = (
  key: string,
  label: string,
  type: Field["type"] = "text" as Field["type"],
  extra: Partial<Field> = {},
): Field => ({ key, label, type, ...extra });
const assigned = f("assigned_to", "Assigned employee", "select", { relation: "profiles" });
const category = f("category", "Category", "select", {
  options: ["residential", "commercial", "industrial"],
});
export const pipeline = [
  "new",
  "contacted",
  "site_visit",
  "quote_sent",
  "negotiation",
  "confirmed",
  "installation",
  "completed",
  "lost",
];
export const modules: Record<string, Module> = {
  leads: {
    title: "Leads",
    table: "leads",
    label: "name",
    columns: ["name", "mobile", "location", "status", "assigned_to", "next_follow_up"],
    fields: [
      f("name", "Full name", undefined, { required: true }),
      f("mobile", "Mobile", undefined, { required: true }),
      f("email", "Email"),
      f("location", "Location"),
      f("customer_type", "Customer type", "select", {
        options: ["residential", "commercial", "industrial", "agriculture"],
      }),
      f("desired_kw", "Capacity (kW)", "number"),
      f("status", "Pipeline stage", "select", { options: pipeline }),
      assigned,
      f("next_follow_up", "Next follow-up", "date"),
      f("notes", "Notes", "textarea"),
    ],
  },
  customers: {
    title: "Customers",
    table: "customers",
    label: "name",
    columns: ["name", "mobile", "city", "account_manager"],
    fields: [
      f("name", "Customer name", undefined, { required: true }),
      f("mobile", "Mobile", undefined, { required: true }),
      f("email", "Email"),
      f("address", "Address", "textarea"),
      f("city", "City"),
      f("state", "State"),
      f("pincode", "Postal code"),
      f("lead_id", "Related lead", "select", { relation: "leads" }),
      f("account_manager", "Account manager", "select", { relation: "profiles" }),
    ],
  },
  employees: {
    title: "Employees",
    table: "profiles",
    label: "full_name",
    columns: ["full_name", "employee_code", "email", "designation", "is_active"],
    fields: [
      f("full_name", "Full name", undefined, { required: true }),
      f("phone", "Phone"),
      f("designation", "Designation"),
      f("employee_code", "Employee code"),
      f("is_active", "Active", "boolean"),
    ],
  },
  projects: {
    title: "Projects",
    table: "projects",
    label: "title",
    columns: ["title", "category", "capacity_kw", "status", "site_engineer", "is_published"],
    fields: [
      f("title", "Project name", undefined, { required: true }),
      category,
      f("capacity_kw", "Capacity (kW)", "number"),
      f("location", "Location"),
      f("description", "Description", "textarea"),
      f("status", "Installation status", "select", {
        options: ["planning", "survey", "installation", "commissioning", "completed", "on_hold"],
      }),
      f("commissioned_on", "Commissioning date", "date"),
      f("customer_id", "Customer", "select", { relation: "customers" }),
      f("site_engineer", "Assigned employee", "select", { relation: "profiles" }),
      f("cover_image_url", "Public cover image URL"),
      f("is_published", "Publish to website", "boolean"),
      f("is_placeholder", "Illustrative / unverified record", "boolean"),
    ],
  },
  tasks: {
    title: "Tasks & site visits",
    table: "tasks",
    label: "title",
    columns: ["title", "task_type", "status", "assigned_to", "due_date"],
    fields: [
      f("title", "Task title", undefined, { required: true }),
      f("description", "Instructions", "textarea"),
      f("task_type", "Type", "select", { options: ["task", "site_visit"] }),
      f("status", "Status", "select", {
        options: ["pending", "in_progress", "completed", "cancelled"],
      }),
      f("priority", "Priority", "select", { options: ["normal", "high", "urgent"] }),
      assigned,
      f("lead_id", "Lead", "select", { relation: "leads" }),
      f("project_id", "Project", "select", { relation: "projects" }),
      f("due_date", "Due date", "date"),
    ],
  },
  products: {
    title: "Products",
    table: "products",
    label: "name",
    columns: ["name", "category", "brand", "is_active"],
    fields: [
      f("name", "Product name", undefined, { required: true }),
      f("category", "Category", "select", {
        options: ["modules", "inverters", "batteries", "mounting", "bos"],
      }),
      f("brand", "Brand"),
      f("description", "Description", "textarea"),
      f("specs", "Specifications", "json"),
      f("unit", "Unit"),
      f("indicative_price", "Indicative price (₹)", "number"),
      f("image_url", "Image URL"),
      f("is_active", "Visible on website", "boolean"),
      f("sort_order", "Display order", "number"),
    ],
  },
  prices: {
    title: "Material prices",
    table: "material_prices",
    label: "item_name",
    columns: ["item_name", "unit", "price", "gst_percent", "effective_from"],
    fields: [
      f("item_name", "Material name", undefined, { required: true }),
      f("category", "Category"),
      f("unit", "Pricing unit", "select", {
        options: ["per_watt", "per_kw", "per_unit", "per_metre", "per_system", "per_kwh"],
      }),
      f("price", "Price (₹)", "number"),
      f("gst_percent", "Applicable GST (%)", "number"),
      f("effective_from", "Effective from", "date"),
      f("notes", "Pricing notes", "textarea"),
      f("is_active", "Active", "boolean"),
    ],
  },
  quotations: {
    title: "Quotations",
    table: "quotations",
    label: "quote_number",
    columns: ["quote_number", "status", "capacity_kw", "total_amount", "valid_until"],
    fields: [
      f("quote_number", "Quotation reference", undefined, { required: true }),
      f("lead_id", "Lead", "select", { relation: "leads" }),
      f("customer_id", "Customer", "select", { relation: "customers" }),
      f("capacity_kw", "System capacity (kW)", "number"),
      f("line_items", "Line items", "lines"),
      f("subsidy_amount", "Confirmed subsidy (₹)", "number"),
      f("status", "Status", "select", {
        options: ["draft", "sent", "accepted", "rejected", "expired"],
      }),
      f("valid_until", "Valid until", "date"),
      f("notes", "Terms and notes", "textarea"),
    ],
  },
  gallery: {
    title: "Gallery",
    table: "project_media",
    label: "caption",
    columns: ["caption", "project_id", "url"],
    fields: [
      f("project_id", "Project", "select", { relation: "projects", required: true }),
      f("url", "Public photo URL", undefined, { required: true }),
      f("caption", "Photo caption", undefined, { required: true }),
      f("sort_order", "Display order", "number"),
      f("is_placeholder", "Illustrative image", "boolean"),
    ],
  },
  schemes: {
    title: "Government schemes",
    table: "schemes",
    label: "name",
    columns: ["name", "authority", "is_published"],
    fields: [
      f("name", "Scheme name", undefined, { required: true }),
      f("slug", "URL name", undefined, { required: true }),
      f("authority", "Authority"),
      f("short_description", "Summary", "textarea"),
      f("details", "Details", "textarea"),
      f("official_url", "Official portal URL"),
      f("benefits", "Benefits (one per line)", "textarea"),
      f("eligibility", "Eligibility (one per line)", "textarea"),
      f("applies_to", "Applies to (one per line)", "textarea"),
      f("is_published", "Published", "boolean"),
      f("sort_order", "Order", "number"),
    ],
  },
  content: {
    title: "Website content",
    table: "site_content",
    label: "label",
    columns: ["label", "section", "key"],
    fields: [
      f("key", "Content key", undefined, { required: true }),
      f("section", "Section"),
      f("label", "Label"),
      f("value", "Content values", "json"),
    ],
  },
  history: {
    title: "Work history",
    table: "work_history",
    label: "summary",
    columns: ["created_at", "entity_type", "summary", "actor_id"],
    fields: [],
  },
};
