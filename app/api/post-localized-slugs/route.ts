import type { SiteLocale } from '@/graphql/types/graphql';
import queryDatoCMS from '@/utils/queryDatoCMS';
import { gql } from 'graphql-tag';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Define proper types for the query result
interface LocalizedSlug {
  locale: string;
  value: string;
}

interface PostWithSlugs {
  id: string;
  _allSlugLocales?: LocalizedSlug[];
}

interface QueryResult {
  post?: PostWithSlugs;
}

type PostBySlugVariables = {
  slug: string;
  locale: SiteLocale;
};

// GraphQL query using gql tag
const GetPostBySlugDocument = gql`
  query GetPostBySlug($slug: String, $locale: SiteLocale) {
    post(filter: { slug: { eq: $slug } }, locale: $locale) {
      id
      _allSlugLocales {
        locale
        value
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const locale = url.searchParams.get('locale') as SiteLocale;

    if (!slug || !locale) {
      return NextResponse.json(
        { error: 'Missing required parameters: slug and locale' },
        { status: 400 },
      );
    }

    const data = await queryDatoCMS<QueryResult, PostBySlugVariables>(
      GetPostBySlugDocument,
      {
        slug,
        locale,
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching localized slugs:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 },
    );
  }
}
