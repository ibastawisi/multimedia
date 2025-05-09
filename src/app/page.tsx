import ShannonFanoVisualizer from "@/components/shannon-fano-visualizer";

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Shannon-Fano Compression Algorithm Visualizer
        </h1>
        <p className="text-center mb-8 text-gray-600">
          An interactive tool to visualize and understand the Shannon-Fano
          compression algorithm step by step.
        </p>
        <ShannonFanoVisualizer />
      </div>
    </main>
  );
}
