'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import type { ContentPage } from '@/components/WithRealTimeUpdates/types';
import { usePathname } from 'next/navigation';
import type { PageProps, Query } from './meta';

const Content: ContentPage<PageProps, Query> = ({
  data,
  children,
  ...globalPageProps
}) => {
  // Get the current pathname to detect if we're on a post page
  const pathname = usePathname();

  // Check if the current path is a post page
  const isPostPattern = new RegExp(
    `^\/${globalPageProps.params.locale}\/posts\/([^\/]+)$`,
  );
  const isPostPage = isPostPattern.test(pathname);

  // Extract the slug if we're on a post page
  let currentSlug = '';
  if (isPostPage) {
    const match = pathname.match(isPostPattern);
    if (match?.[1]) {
      currentSlug = match[1];
    }
  }

  return (
    <>
      <Header
        globalPageProps={globalPageProps}
        data={data}
        isPostPage={isPostPage}
        currentSlug={currentSlug}
      />
      {children}
      <Footer globalPageProps={globalPageProps} data={data} />
    </>
  );
};

export default Content;
