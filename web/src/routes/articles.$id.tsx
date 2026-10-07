import {
  queryOptions,
  useQuery,
  useQueryErrorResetBoundary,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  Link,
  createFileRoute,
  notFound,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { ArrowLeft, ArrowUpRight, RotateCw } from 'lucide-react';
import { useEffect } from 'react';

import { ArticleGallery } from '@/components/news/article-gallery';
import { StoryList } from '@/components/news/story-list';
import { Button, buttonVariants } from '@/components/ui/button';
import { SectionTab } from '@/components/ui/section-tab';
import { ARTICLE_ASIDE_COUNT } from '@/constants/feed';
import { fetchArticle, isMissingArticle } from '@/lib/api';
import { feedQuery, quietFetch } from '@/utils/feed';
import { formatDate, formatTime, markDuplicates, plainText } from '@/utils/format';

const articleQuery = (id: string) =>
  queryOptions({
    queryKey: ['article', id],
    queryFn: () => fetchArticle(id),
    staleTime: 300_000,
  });

export const Route = createFileRoute('/articles/$id')({
  loader: async ({ context, params }) => {
    const article = await context.queryClient
      .query({ ...articleQuery(params.id), staleTime: 'static' })
      .catch((error: unknown) => {
        if (isMissingArticle(error)) throw notFound();
        throw error;
      });
    await quietFetch(() => context.queryClient.query(feedQuery({ source: article.source.slug })));
    return article;
  },
  component: ArticleDetail,
  errorComponent: ArticleError,
  notFoundComponent: ArticleNotFound,
});

function ArticleNotFound() {
  return (
    <main className="container max-w-6xl py-16">
      <div className="max-w-3xl">
        <h1 className="text-title-md font-bold text-foreground sm:text-4xl">ไม่พบข่าวนี้</h1>
        <p className="mt-3 text-pretty text-muted-foreground">ข่าวนี้อาจถูกลบหรือไม่มีอยู่ในระบบแล้ว</p>
        <Link
          to="/"
          search={{ category: undefined, source: undefined, cursor: undefined }}
          className={buttonVariants({ className: 'mt-6' })}
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> กลับหน้าแรก
        </Link>
      </div>
    </main>
  );
}

function ArticleError({ reset }: Readonly<ErrorComponentProps>) {
  const router = useRouter();
  const queryReset = useQueryErrorResetBoundary();

  useEffect(() => {
    queryReset.reset();
  }, [queryReset]);

  return (
    <main className="container max-w-6xl py-16">
      <div className="max-w-3xl">
        <h1 className="text-title-md font-bold text-foreground sm:text-4xl">โหลดข่าวไม่สำเร็จ</h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          เซิร์ฟเวอร์ข่าวอาจกำลังเริ่มทำงานอยู่ ใช้เวลาประมาณหนึ่งนาที รอสักครู่แล้วกดลองใหม่
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/"
            search={{ category: undefined, source: undefined, cursor: undefined }}
            className={buttonVariants()}
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> กลับหน้าแรก
          </Link>
          <Button
            onClick={() => {
              reset();
              void router.invalidate();
            }}
          >
            <RotateCw aria-hidden="true" className="size-4" /> ลองใหม่
          </Button>
        </div>
      </div>
    </main>
  );
}

function ArticleDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { data: article } = useSuspenseQuery(articleQuery(id));
  const body = plainText(article.body_text);
  const summary = article.summary ? plainText(article.summary) : '';
  const images = article.attachments ?? [];
  const paragraphs =
    body && body !== summary
      ? body
          .split(/\n{2,}/)
          .map((text) => text.trim())
          .filter(Boolean)
      : [];
  const { data: related } = useQuery(feedQuery({ source: article.source.slug }));
  const more = markDuplicates(
    (related?.items ?? []).filter((item) => item.id !== article.id),
  ).slice(0, ARTICLE_ASIDE_COUNT);

  return (
    <main className="container max-w-6xl pt-6 pb-4 sm:pt-10">
      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="max-w-3xl lg:col-span-8">
          <Link
            to="/"
            search={{ category: undefined, source: undefined, cursor: undefined }}
            onClick={(event) => {
              if (router.history.canGoBack()) {
                event.preventDefault();
                router.history.back();
              }
            }}
            className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> กลับหน้าแรก
          </Link>

          <article className="mt-5">
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{article.source.name_th}</span>
              {article.category && (
                <>
                  <span aria-hidden="true">·</span>
                  <Link
                    to="/"
                    search={{ category: article.category, source: undefined, cursor: undefined }}
                    className="underline decoration-accent hover:text-foreground"
                  >
                    {article.category}
                  </Link>
                </>
              )}
            </p>

            <h1 className="mt-2 text-title-md font-bold text-foreground sm:text-title-lg">
              {article.title}
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              {article.published_at ? (
                <time dateTime={article.published_at}>
                  เผยแพร่ {formatDate(article.published_at)} เวลา {formatTime(article.published_at)}{' '}
                  น.
                </time>
              ) : (
                <span>ไม่ระบุวันที่เผยแพร่</span>
              )}
              {article.last_seen_at && ` · อัปเดต ${formatTime(article.last_seen_at)} น.`}
            </p>

            {images.length > 0 && <ArticleGallery images={images} />}

            {(summary || paragraphs.length > 0) && (
              <div className="mt-6 border-t-2 border-foreground pt-5">
                {summary && <p className="font-semibold text-foreground">{summary}</p>}
                {paragraphs.map((text) => (
                  <p key={text} className="mt-4 text-pretty whitespace-pre-line">
                    {text}
                  </p>
                ))}
              </div>
            )}

            <a
              href={article.canonical_url}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ className: 'mt-8 w-full sm:w-auto' })}
            >
              <span>อ่านที่ต้นฉบับ</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </article>
        </div>

        {more.length > 0 && (
          <aside
            aria-labelledby="agency-heading"
            className="mt-10 max-w-3xl lg:sticky lg:top-24 lg:col-span-4 lg:mt-0 lg:self-start"
          >
            <SectionTab id="agency-heading">ล่าสุดจาก {article.source.name_th}</SectionTab>
            <StoryList items={more} />
          </aside>
        )}
      </div>
    </main>
  );
}
