import NavBar from './NavBar';

/**
 * Screen frame (catalog: PageLayout): NavBar, one <main>, optional bottom action bar.
 * Bottom bar buttons go secondary first, primary last: stacked on mobile, a right-aligned
 * row from md. The bar comes after <main> so tab order matches reading order.
 */
export default function PageLayout({ children, bottomBar }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <NavBar />
      <main
        className={`mx-auto flex w-full max-w-container flex-1 flex-col gap-5 px-5 pt-4 md:pt-8 ${
          bottomBar ? 'pb-5' : 'pb-10'
        }`}
      >
        {children}
      </main>
      {bottomBar && (
        <div className="sticky bottom-0 border-t border-border bg-bg px-5 pb-5 pt-3 md:static md:border-t-0 md:pb-10">
          <div className="mx-auto flex w-full max-w-container flex-col gap-2 md:flex-row md:justify-end">
            {bottomBar}
          </div>
        </div>
      )}
    </div>
  );
}
