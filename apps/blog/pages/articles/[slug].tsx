import { SWRConfig } from 'swr'
import { useRouter } from 'next/router'
import { NotFound, Box } from '@pancakeswap/uikit'
import ArticleInfo from 'components/Article/SingleArticle/ArticleInfo'
import HowItWork from 'components/Article/SingleArticle/HowItWork'
import SimilarArticles from 'components/Article/SingleArticle/SimilarArticles'
import { InferGetStaticPropsType, GetStaticProps } from 'next'
import { getArticle, getSingleArticle } from 'hooks/getArticle'
import PageMeta from 'components/PageMeta'
import { filterTagArray } from 'utils/filterTagArray'
import { NextSeo } from 'next-seo'

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps = (async ({ params, previewData }) => {
  if (!params)
    return {
      redirect: {
        permanent: false,
        statusCode: 404,
        destination: '/404',
      },
    }

  const { slug } = params
  const isPreviewMode = (previewData as any)?.slug

  let name: any = { $notIn: filterTagArray }
  if (isPreviewMode) {
    name = { $eq: 'Preview' }
  }

  const article = await getSingleArticle({
    url: `/slugify/slugs/article/${slug}`,
    urlParamsObject: {
      populate: 'categories,image',
      locale: 'all',
      filters: {
        categories: {
          name,
        },
      },
    },
  })

  const similarArticles = await getArticle({
    url: '/articles',
    urlParamsObject: {
      locale: article.locale,
      sort: 'createAt:desc',
      populate: 'categories,image',
      pagination: { limit: 6 },
      filters: {
        id: {
          $not: article.id,
        },
        categories: {
          $or: article.categories.map((category) => ({
            name: {
              $eq: category,
            },
          })),
        },
      },
    },
  })

  return {
    props: {
      fallback: {
        '/article': article,
        '/similarArticles': similarArticles.data,
        isPreviewMode: !!isPreviewMode,
      },
    },
    revalidate: 60,
  }
}) satisfies GetStaticProps

const ArticlePage: React.FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ fallback }) => {
  const router = useRouter()
  if (!router.isFallback && !fallback?.['/article']?.title) {
    return (
      <NotFound>
        <NextSeo title="404" />
      </NotFound>
    )
  }

  const { title, description, imgUrl } = fallback['/article']

  return (
    <>
      <PageMeta title={title} description={description} imgUrl={imgUrl} />
      <SWRConfig value={{ fallback }}>
        <Box>
          <ArticleInfo />
          {!fallback.isPreviewMode && (
            <>
              <HowItWork />
              <SimilarArticles />
            </>
          )}
        </Box>
      </SWRConfig>
    </>
  )
}

export default ArticlePage
