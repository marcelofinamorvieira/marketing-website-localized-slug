'use client';

import type { SiteLocale } from '@/graphql/types/graphql';
import { buildUrl } from '@/utils/globalPageProps';
import type { GlobalPageProps } from '@/utils/globalPageProps';
import Link from 'next/link';
import { type KeyboardEvent, useEffect, useState } from 'react';
import { localeToLanguageName } from './LanguageSelector';

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

type Props = {
  globalPageProps: GlobalPageProps;
  languages: SiteLocale[];
  currentSlug: string;
};

const PostLanguageSelector = ({
  globalPageProps,
  languages,
  currentSlug,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localizedSlugs, setLocalizedSlugs] = useState<Record<string, string>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const currentLocale = globalPageProps.params.locale;

  useEffect(() => {
    const fetchLocalizedSlugs = async () => {
      try {
        setIsLoading(true);

        // Use our new API route instead of directly calling queryDatoCMS
        const response = await fetch(
          `/api/post-localized-slugs?slug=${encodeURIComponent(
            currentSlug,
          )}&locale=${encodeURIComponent(currentLocale as string)}`,
        );

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data = (await response.json()) as QueryResult;

        // Create a mapping of locale to slug
        const slugMap: Record<string, string> = {};

        if (data.post?._allSlugLocales) {
          for (const localizedSlug of data.post._allSlugLocales) {
            if (localizedSlug.locale && localizedSlug.value) {
              slugMap[localizedSlug.locale] = localizedSlug.value;
              console.log(
                `Added localized slug for ${localizedSlug.locale}: ${localizedSlug.value}`,
              );
            }
          }
          setDebugInfo(`Found ${Object.keys(slugMap).length} localized slugs`);
        } else {
          console.error('No localized slugs found in the post data');
          setDebugInfo('No localized slugs found');
        }

        setLocalizedSlugs(slugMap);
      } catch (error) {
        console.error('Error fetching localized slugs:', error);
        setDebugInfo(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (currentSlug) {
      fetchLocalizedSlugs();
    } else {
      console.error('No current slug provided, cannot fetch localized slugs');
      setDebugInfo('No current slug provided');
      setIsLoading(false);
    }
  }, [currentLocale, currentSlug]);

  const buildPostUrl = (locale: SiteLocale) => {
    const slug = localizedSlugs[locale];

    console.log(`Building URL for locale ${locale}:`);
    console.log(' - Localized slugs available:', Object.keys(localizedSlugs));
    console.log(' - Using slug:', slug || currentSlug);

    if (slug) {
      return buildUrl({ params: { locale } }, `/posts/${slug}`);
    }

    return buildUrl({ params: { locale } }, `/posts/${currentSlug}`);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div
        onClick={() => {
          isOpen ? setIsOpen(false) : setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        onBlur={() =>
          setTimeout(() => {
            setIsOpen(false);
          }, 100)
        }
        className="ml-4 w-40 inline-flex items-center overflow-hidden rounded-md bg-white transition duration-100 hover:bg-gray-200 active:scale-95 active:bg-gray-300 text-center"
      >
        <button
          type="button"
          className="inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-gray-800 w-full"
          disabled={isLoading}
        >
          {localeToLanguageName(currentLocale)}
          {isLoading && <span className="ml-2">...</span>}
        </button>
      </div>

      <div
        className={`absolute w-40 end-0 z-10 ml-4 mt-1 rounded-md border border-gray-100 bg-white shadow-lg${
          isOpen ? '' : ' hidden'
        }`}
        role="menu"
      >
        {isLoading ? (
          <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
        ) : (
          languages.map((locale) => {
            const url = buildPostUrl(locale);
            return (
              <div
                key={locale}
                className="inline-flex w-full cursor-pointer items-end justify-start rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                <Link
                  href={url}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white w-full text-center"
                  role="menuitem"
                  onClick={() => {
                    console.log(
                      `Clicked on locale ${locale}, navigating to ${url}`,
                    );
                    setIsOpen(false);
                  }}
                  onKeyDown={handleKeyDown}
                >
                  <div className="inline-flex">
                    {localeToLanguageName(locale)}
                  </div>
                </Link>
              </div>
            );
          })
        )}
        {!isLoading && debugInfo && process.env.NODE_ENV === 'development' && (
          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
            {debugInfo}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostLanguageSelector;
