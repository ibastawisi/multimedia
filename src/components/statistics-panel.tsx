import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface StatisticsPanelProps {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  averageCodeLength: number
  currentStep: string
}

export default function StatisticsPanel({
  originalSize,
  compressedSize,
  compressionRatio,
  averageCodeLength,
  currentStep,
}: StatisticsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compression Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {currentStep !== "complete" ? (
          <div className="text-center py-8 text-gray-500">
            No statistics available yet. Complete the algorithm to see the results.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Original Size:</span>
                <span className="text-sm">{originalSize} bits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Compressed Size:</span>
                <span className="text-sm">{compressedSize} bits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Space Saved:</span>
                <span className="text-sm">{originalSize - compressedSize} bits</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Compression Ratio:</span>
                <span className="text-sm">{compressionRatio.toFixed(2)}%</span>
              </div>
              <Progress value={compressionRatio} className="h-2" />
              <p className="text-xs text-gray-500">
                Higher is better. This shows how much space was saved compared to the original.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Average Code Length:</span>
                <span className="text-sm">{averageCodeLength.toFixed(2)} bits/character</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Fixed-Length Code:</span>
                <span className="text-sm">8 bits/character</span>
              </div>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(averageCodeLength / 8) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Lower is better. This shows the average number of bits needed per character.
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium mb-2">Shannon-Fano Efficiency</h3>
              <p className="text-sm text-gray-600">
                The Shannon-Fano algorithm creates variable-length codes based on character frequencies. More frequent
                characters get shorter codes, which results in overall compression.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                While not optimal in all cases (Huffman coding often produces better results), Shannon-Fano is an
                important historical algorithm that demonstrates the principles of entropy coding.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
