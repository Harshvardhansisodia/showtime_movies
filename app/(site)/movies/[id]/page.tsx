// app/(site)/movies/[id]/page.tsx
import DetailFromCache from "@/components/detail/DetailFromCache";

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: "Movie Detail • MovieVerse",
};

export default async function MovieDetail({ params }: Props) {
  const { id } = await params; // Next 15: await params [web:517]
  return (
    <section className="px-6 py-10">
      <DetailFromCache kind="movies" id={id} />
    </section>
  );
}
