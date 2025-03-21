import getAvailableLocales from '@/app/i18n/settings';
import { generateMetadataFn } from '@/components/WithRealTimeUpdates/generateMetadataFn';
import { generateWrapper } from '@/components/WithRealTimeUpdates/generateWrapper';
import type { BuildVariablesFn } from '@/components/WithRealTimeUpdates/types';
import { PostStaticParamsDocument } from '@/graphql/types/graphql';
import type { SiteLocale } from '@/graphql/types/graphql';
import queryDatoCMS from '@/utils/queryDatoCMS';
import type { DocumentNode } from 'graphql';
import Content from './Content';
import RealTime from './RealTime';
import { query } from './meta';
import type { PageProps, Query, Variables } from './meta';

// Extend the expected response structure with _allSlugLocales
interface PostWithLocales {
  id: string;
  _allSlugLocales?: Array<{
    locale: string;
    value: string;
  }>;
}

// Extend the query variables to support localization
interface QueryVariables {
  locale?: SiteLocale;
  fallbackLocale?: SiteLocale[];
}

// Type to safely cast the document
type ExtendedDocumentNode = DocumentNode & {
  __generated?: {
    variables: QueryVariables;
    result: { allPosts: PostWithLocales[] };
  };
};

export async function generateStaticParams() {
  const locales = await getAvailableLocales();
  const allParams: Array<PageProps['params']> = [];

  for (const locale of locales) {
    // Use the extended document type for better type safety
    const data = await queryDatoCMS<
      { allPosts: PostWithLocales[] },
      QueryVariables
    >(PostStaticParamsDocument as ExtendedDocumentNode, {
      locale: locale as SiteLocale,
      fallbackLocale: locales.filter((l) => l !== locale) as SiteLocale[],
    });

    // Process each post to extract locale-specific slugs
    for (const post of data.allPosts) {
      const slugLocale = post._allSlugLocales?.find(
        (sl) => sl.locale === locale,
      );

      if (slugLocale?.value) {
        allParams.push({
          slug: slugLocale.value,
          locale,
        });
      }
    }
  }

  return allParams;
}

const buildVariables: BuildVariablesFn<PageProps, Variables> = ({
  params,
  fallbackLocale,
}) => ({
  locale: params.locale as SiteLocale,
  fallbackLocale: [fallbackLocale as SiteLocale],
  slug: params.slug,
});

export const generateMetadata = generateMetadataFn<PageProps, Query, Variables>(
  {
    query,
    buildVariables,
    generate: (data: Query) => data.post?.seo,
  },
);

const Page = generateWrapper<PageProps, Query, Variables>({
  query,
  buildVariables,
  contentComponent: Content,
  realtimeComponent: RealTime,
});

export default Page;
