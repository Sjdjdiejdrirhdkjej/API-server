import { SignIn } from '@clerk/nextjs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';

import { SignInGreeting } from '@/components/SignInGreeting';
import { getI18nPath } from '@/utils/Helpers';

type ISignInPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: ISignInPageProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'SignIn',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignInPage(props: ISignInPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const cookieStore = cookies();
  const firstName = cookieStore.get('firstName')?.value;

  return (
    <>
      <SignInGreeting firstName={firstName} />
      <SignIn path={getI18nPath('/sign-in', locale)} />
    </>
  );
}
