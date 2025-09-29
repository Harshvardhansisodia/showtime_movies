// app/(site)/series/[id]/page.tsx
import SeriesDetailFromCache from "@/components/detail/SeriesDetailFromCache";

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: "Series Detail • MovieVerse",
};

export default async function SeriesDetail({ params }: Props) {
  const { id } = await params; // await per Next 15 [web:517]
  return (
    <section className="px-6 py-10">
      <SeriesDetailFromCache id={id} />
    </section>
  );
}
