interface DocumentDetailPageProps {
  params: Promise<{
    guid: string;
  }>;
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { guid } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Document Viewer
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Document ID: {guid}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-lg font-medium text-zinc-900 dark:text-white">
          PDF Viewer Coming Soon
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This page will display the document content and metadata.
        </p>
      </div>
    </div>
  );
}
