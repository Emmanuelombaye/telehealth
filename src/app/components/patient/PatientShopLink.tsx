import { Link, type LinkProps } from "react-router";
import { usePatientNav } from "../../../lib/brands/patientNav";
import { cn } from "../ui/utils";

type Props = Omit<LinkProps, "to"> & {
  className?: string;
  children: React.ReactNode;
};

/** Shop / browse link — external partner catalog or internal Peak enroll shop. */
export function PatientShopLink({ className, children, ...rest }: Props) {
  const { shop } = usePatientNav();

  if (shop.external) {
    return (
      <a href={shop.href} className={cn(className)} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <Link to={shop.href} className={cn(className)} {...rest}>
      {children}
    </Link>
  );
}
