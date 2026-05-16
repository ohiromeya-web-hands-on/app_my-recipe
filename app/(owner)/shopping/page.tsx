import Link from "next/link";
import { ShoppingListClient } from "@/components/shopping/shopping-list-client";
import {
  getShoppingTabCounts,
  listShoppingItems,
  parseShoppingTab,
} from "@/features/shopping/queries";

export const dynamic = "force-dynamic";

type ShoppingPageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function ShoppingPage({ searchParams }: ShoppingPageProps) {
  const { tab: rawTab } = await searchParams;
  const tab = parseShoppingTab(rawTab);
  const [items, counts] = await Promise.all([
    listShoppingItems(tab),
    getShoppingTabCounts(),
  ]);

  return (
    <main className="page-shell">
      <section className="page-header shopping-page-header">
        <div>
          <span className="eyebrow">Shopping</span>
          <h1>買い物リスト</h1>
          <p className="lead">
            必要な材料を買うものと購入済みに分けて管理します。
          </p>
        </div>
        <Link className="button" href="/recipes/new">
          レシピを追加
        </Link>
      </section>

      <section className="section-block">
        <nav className="shopping-tabs" aria-label="買い物リストの表示切替">
          <Link
            className={tab === "active" ? "active" : ""}
            href="/shopping?tab=active"
          >
            買うもの <span>{counts.active}</span>
          </Link>
          <Link
            className={tab === "purchased" ? "active" : ""}
            href="/shopping?tab=purchased"
          >
            購入済み <span>{counts.purchased}</span>
          </Link>
        </nav>

        <ShoppingListClient initialItems={items} tab={tab} />
      </section>
    </main>
  );
}
