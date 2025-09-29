// app/(site)/request/page.tsx
import TMDBRequest from "@/components/request/TMDBRequest";

export const metadata = {
  title: "Request • MovieVerse",
};

export default async function RequestPage() {
  return <TMDBRequest />;
}
