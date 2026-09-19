import Link from "next/link";
import { ACCOUNT_ROW } from "./account-row";

type Props = {
  href: string;
  children: React.ReactNode;
  testId?: string;
  external?: boolean;
};

export function AccountRow({ href, children, testId, external }: Props) {
  if (external) {
    return (
      <a href={href} className={ACCOUNT_ROW} data-testid={testId}>
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      prefetch={false}
      className={ACCOUNT_ROW}
      data-testid={testId}
    >
      {children}
    </Link>
  );
}
