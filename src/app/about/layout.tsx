import { ClientDemo3 } from "./client3";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {children}
      <ClientDemo3 />
    </section>
  );
}
