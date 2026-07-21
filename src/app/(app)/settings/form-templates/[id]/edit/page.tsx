import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getFormTemplate } from "@/lib/data/templates";
import { FormBuilder } from "./form-builder";

export default async function EditFormTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await getFormTemplate(id);
  if (!template) notFound();
  const questions = template.sections.flatMap((s) => s.questions);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/settings/form-templates"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={14} /> Patient form templates
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">{template.name}</h1>
        {template.description && (
          <p className="mt-1 text-sm text-muted">{template.description}</p>
        )}
      </div>
      <FormBuilder id={template.id} initial={questions} />
    </div>
  );
}
