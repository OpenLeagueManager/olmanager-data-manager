import Link from "next/link";

export type Crumb = { label: string; href: string };

export type BreadcrumbsProps = {
  crumbs: Crumb[];
};

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            <Link className="hover:text-foreground" href={crumb.href}>
              {crumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
