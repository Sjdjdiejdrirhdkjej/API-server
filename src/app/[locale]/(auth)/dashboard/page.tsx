import { getTranslations } from 'next-intl/server';

import { DashboardClient } from '@/components/DashboardClient';
import { Hello } from '@/components/Hello';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
  };
}

export default function Dashboard() {
  return (
    <DashboardClient>
      <Hello />
    </DashboardClient>
  );
}
