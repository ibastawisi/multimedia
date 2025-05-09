import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownIcon } from "lucide-react";

interface FrequencyTableProps {
  frequencies: { [key: string]: number };
  sortedChars: string[];
}

export default function FrequencyTable({
  frequencies,
  sortedChars,
}: FrequencyTableProps) {
  const totalFrequency = Object.values(frequencies).reduce(
    (sum, freq) => sum + freq,
    0
  );

  // Determine which characters to display based on the current step
  const charsToDisplay =
    sortedChars.length > 0 ? sortedChars : Object.keys(frequencies);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Character Frequency Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(frequencies).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No frequency data available yet. Start the algorithm to see the
            analysis.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Total characters:{" "}
                <span className="font-medium">{totalFrequency}</span>
              </p>
              <p className="text-sm text-gray-500">
                Unique characters:{" "}
                <span className="font-medium">
                  {Object.keys(frequencies).length}
                </span>
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Character</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Probability</TableHead>
                  {sortedChars.length > 0 && <TableHead>Rank</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {charsToDisplay.map((char, index) => (
                  <TableRow key={char}>
                    <TableCell className="font-mono">
                      {char === " " ? (
                        <span className="text-gray-500">(space)</span>
                      ) : (
                        char
                      )}
                    </TableCell>
                    <TableCell>{frequencies[char]}</TableCell>
                    <TableCell>
                      {(frequencies[char] / totalFrequency).toFixed(4)}
                    </TableCell>
                    {sortedChars.length > 0 && (
                      <TableCell>
                        {index + 1}
                        {index === 0 && (
                          <ArrowDownIcon className="inline ml-1 h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {sortedChars.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Note:</span> Characters are
                  sorted by frequency in descending order. This ordering is
                  crucial for the Shannon-Fano algorithm to achieve efficient
                  compression.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
