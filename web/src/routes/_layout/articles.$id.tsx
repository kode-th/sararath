import { queryOptions, useQueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query';
import {
  Link,
  createFileRoute,
  notFound,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { ArrowLeft, ArrowUpRight, RotateCw } from 'lucide-react';
import { useEffect } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import { fetchArticle, isMissingArticle } from '@/lib/api';
import { formatDate, formatTime, hideBrokenImage, plainText } from '@/utils/format';

const articleQuery = (id: string) =>
  queryOptions({
    queryKey: ['article', id],
    queryFn: () => fetchArticle(id),
    staleTime: 300_000,
  });

export const Route = createFileRoute('/_layout/articles/$id')({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.query({
        ...articleQuery(params.id),
        staleTime: 'static',
      });
    } catch (error) {
      if (isMissingArticle(error)) throw notFound();
      throw error;
    }
  },
  component: ArticleDetail,
  errorComponent: ArticleError,
  notFoundComponent: ArticleNotFound,
});

function ArticleNotFound() {
  return (
    <main className="container max-w-3xl py-16">
      <h1 className="text-title-md font-bold text-foreground sm:text-4xl">ไม่พบข่าวนี้</h1>
      <p className="mt-3 text-pretty text-muted-foreground">ข่าวนี้อาจถูกลบหรือไม่มีอยู่ในระบบแล้ว</p>
      <Link
        to="/"
        search={{ q: undefined, category: undefined, source: undefined, cursor: undefined }}
        className={buttonVariants({ className: 'mt-6' })}
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> กลับหน้าแรก
      </Link>
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
    <main className="container max-w-3xl py-16">
      <h1 className="text-title-md font-bold text-foreground sm:text-4xl">โหลดข่าวไม่สำเร็จ</h1>
      <p className="mt-3 text-pretty text-muted-foreground">
        เซิร์ฟเวอร์ข่าวอาจกำลังเริ่มทำงานอยู่ ใช้เวลาประมาณหนึ่งนาที รอสักครู่แล้วกดลองใหม่
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/"
          search={{ q: undefined, category: undefined, source: undefined, cursor: undefined }}
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
    </main>
  );
}

function ArticleDetail() {
  const { id } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(id));
  const body = plainText(article.body_text);
  const summary = article.summary ? plainText(article.summary) : '';
  const image = (article.attachments ?? [])[0];

  return (
    <main className="container max-w-3xl pt-6 pb-4 sm:pt-10">
      <Link
        to="/"
        search={{ q: undefined, category: undefined, source: undefined, cursor: undefined }}
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
              <span>{article.category}</span>
            </>
          )}
        </p>

        <h1 className="mt-2 text-title-md font-bold text-foreground sm:text-title-lg">
          {article.title}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          {article.published_at ? (
            <time dateTime={article.published_at}>
              เผยแพร่ {formatDate(article.published_at)} เวลา {formatTime(article.published_at)} น.
            </time>
          ) : (
            <span>ไม่ระบุวันที่เผยแพร่</span>
          )}
          {article.last_seen_at && ` · อัปเดต ${formatTime(article.last_seen_at)} น.`}
        </p>

        {image && (
          <img
            src={image}
            alt=""
            onError={hideBrokenImage}
            className="mt-6 w-full border border-foreground/15 object-cover"
          />
        )}

        {(summary || body) && (
          <div className="mt-6 border-t-2 border-foreground pt-5">
            {summary && <p className="font-semibold text-foreground">{summary}</p>}
            {body && body !== summary && (
              <p className="mt-4 text-pretty whitespace-pre-line">{body}</p>
            )}
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
    </main>
  );
}
