// app/(site)/request/[id]/page.tsx
import RequestDetailFromCache from "@/components/detail/RequestDetailFromCache";
import { checkFeaturedOnServer, sendRequestOnServer } from "./actions";

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: "Request Detail • MovieVerse",
};

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params; // Next 15 async dynamic API [web:501]
  // Server-side “featured” check (id known from route)
  const initialIsFeatured = await checkFeaturedOnServer(id); // SSR probe [web:471]

  // Pass Server Action to client; allowed to pass actions as props
  return (
    <section className="px-6 py-10">
      <RequestDetailFromCache
        kind="request"
        id={id}
        initialIsFeatured={initialIsFeatured}
        sendRequestAction={sendRequestOnServer}
      />
    </section>
  );
}
