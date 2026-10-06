import { Outlet, createFileRoute } from '@tanstack/react-router';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';

export const Route = createFileRoute('/_layout')({
  component: Layout,
});

function Layout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
