import { NetworkMap2D } from "@/components/NetworkMap2D";
import { PageWrapper } from "@/components/PageWrapper";

async function getPNodeList() {
  const res = await fetch("http://localhost:3000/api/pnodes", {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function NetworkMapPage() {
  const pnodesResponse = await getPNodeList();
  const pnodes = pnodesResponse?.data || [];

  return (
    <PageWrapper>
      <div className="min-h-screen bg-space-dark">
        {/* Header */}
        <header className="border-b border-space-border bg-space-card/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Network Map</h1>
            <p className="text-gray-400">
              Global distribution and real-time status of all pNodes
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <NetworkMap2D pnodes={pnodes} />
        </main>
      </div>
    </PageWrapper>
  );
}
