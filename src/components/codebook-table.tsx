import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CodebookTableProps {
  codebook: { [key: string]: string };
  frequencies: { [key: string]: number };
}

export default function CodebookTable({
  codebook,
  frequencies,
}: CodebookTableProps) {
  const totalChars = Object.values(frequencies).reduce(
    (sum, freq) => sum + freq,
    0
  );

  // Calculate the average code length
  const calculateAverageCodeLength = () => {
    if (Object.keys(codebook).length === 0 || totalChars === 0) return 0;

    let totalBits = 0;
    for (const char in codebook) {
      totalBits += codebook[char].length * frequencies[char];
    }

    return totalBits / totalChars;
  };

  const avgCodeLength = calculateAverageCodeLength();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shannon-Fano Codebook</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(codebook).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No codebook available yet. Complete the algorithm to see the codes.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Character</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Binary Code</TableHead>
                  <TableHead>Code Length</TableHead>
                  <TableHead>Bits Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(codebook)
                  .sort((a, b) => frequencies[b] - frequencies[a])
                  .map((char) => (
                    <TableRow key={char}>
                      <TableCell className="font-mono">
                        {char === " " ? (
                          <span className="text-gray-500">(space)</span>
                        ) : (
                          char
                        )}
                      </TableCell>
                      <TableCell>{frequencies[char]}</TableCell>
                      <TableCell className="font-mono">
                        {codebook[char]}
                      </TableCell>
                      <TableCell>{codebook[char].length}</TableCell>
                      <TableCell>
                        {codebook[char].length * frequencies[char]}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Average Code Length:</span>{" "}
                {avgCodeLength.toFixed(2)} bits per character
              </p>
              <p className="text-sm mt-2">
                <span className="font-medium">Note:</span> The Shannon-Fano
                algorithm assigns shorter codes to more frequent characters,
                which results in efficient compression.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
