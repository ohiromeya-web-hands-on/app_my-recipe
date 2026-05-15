type EditRecipePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EditRecipePageProps) {
  const { id } = await params;

  return {
    title: `レシピ編集 ${id} | MyKitchen`
  };
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;

  return (
    <main className="page-shell">
      <section className="page-header">
        <span className="eyebrow">Owner</span>
        <h1>レシピ編集</h1>
        <p className="lead">レシピID: {id}</p>
      </section>
    </main>
  );
}
