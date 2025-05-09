"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, SkipForward, RotateCcw, Info } from "lucide-react";
import FrequencyTable from "./frequency-table";
import VisualizationTree from "./visualization-tree";
import CodebookTable from "./codebook-table";
import StatisticsPanel from "./statistics-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useShannonFano, EXAMPLES } from "@/hooks/useShannonFano";
import { ALGORITHM_STEPS } from "@/lib/algorithm";

export default function ShannonFanoVisualizer() {
  const {
    input,
    frequencies,
    sortedChars,
    codebook,
    encodedString,
    originalSize,
    compressedSize,
    compressionRatio,
    averageCodeLength,
    currentStep,
    isRunning,
    treeData,
    partitionHistory,
    currentPartitionIndex,
    error,
    activeTab,
    handleInputChange,
    handleExampleSelect,
    startAlgorithm,
    stepForward,
    toggleRunning,
    resetVisualizer,
    setActiveTab,
  } = useShannonFano();

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Textarea
                  placeholder="Enter text to compress..."
                  value={input}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                />
              </div>
              <div className="w-full md:w-64">
                <Select
                  onValueChange={handleExampleSelect}
                  value={
                    input && EXAMPLES[input as keyof typeof EXAMPLES]
                      ? input
                      : ""
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an example" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(EXAMPLES).map((key) => (
                      <SelectItem
                        key={key}
                        value={EXAMPLES[key as keyof typeof EXAMPLES]}
                      >
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={startAlgorithm}
                disabled={isRunning || !input.trim()}
              >
                Start Algorithm
              </Button>
              <Button
                onClick={toggleRunning}
                disabled={
                  currentStep === ALGORITHM_STEPS.IDLE ||
                  currentStep === ALGORITHM_STEPS.COMPLETE
                }
                variant="outline"
              >
                {isRunning ? (
                  <Pause className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isRunning ? "Pause" : "Run"}
              </Button>
              <Button
                onClick={stepForward}
                disabled={
                  isRunning ||
                  currentStep === ALGORITHM_STEPS.COMPLETE ||
                  currentStep === ALGORITHM_STEPS.IDLE
                }
                variant="outline"
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Step Forward
              </Button>
              <Button onClick={resetVisualizer} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Status */}
      <Card>
        <CardHeader>
          <CardTitle>Algorithm Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">Current Step:</p>
              <p className="font-medium">
                {currentStep === ALGORITHM_STEPS.IDLE && "Ready to Start"}
                {currentStep === ALGORITHM_STEPS.FREQUENCY_ANALYSIS &&
                  "Calculating Character Frequencies"}
                {currentStep === ALGORITHM_STEPS.SORTING &&
                  "Sorting Characters by Frequency"}
                {currentStep === ALGORITHM_STEPS.PARTITIONING &&
                  "Partitioning Characters"}
                {currentStep === ALGORITHM_STEPS.CODE_ASSIGNMENT &&
                  "Assigning Binary Codes"}
                {currentStep === ALGORITHM_STEPS.ENCODING &&
                  "Encoding Input String"}
                {currentStep === ALGORITHM_STEPS.COMPLETE &&
                  "Compression Complete"}
              </p>
            </div>

            {currentStep === ALGORITHM_STEPS.PARTITIONING &&
              partitionHistory.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Partition Progress:</p>
                  <p className="font-medium">{`${currentPartitionIndex + 1} / ${
                    partitionHistory.length
                  }`}</p>
                </div>
              )}

            {currentStep !== ALGORITHM_STEPS.IDLE && (
              <div className="flex items-center">
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                <p className="text-sm text-gray-600">
                  {currentStep === ALGORITHM_STEPS.FREQUENCY_ANALYSIS &&
                    "Counting how often each character appears in the input."}
                  {currentStep === ALGORITHM_STEPS.SORTING &&
                    "Arranging characters from most frequent to least frequent."}
                  {currentStep === ALGORITHM_STEPS.PARTITIONING &&
                    "Dividing characters into groups with similar total frequencies."}
                  {currentStep === ALGORITHM_STEPS.CODE_ASSIGNMENT &&
                    "Creating binary codes based on the partitioning."}
                  {currentStep === ALGORITHM_STEPS.ENCODING &&
                    "Converting the input string to binary using the codebook."}
                  {currentStep === ALGORITHM_STEPS.COMPLETE &&
                    "The Shannon-Fano compression is complete."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="frequency">Frequency Analysis</TabsTrigger>
          <TabsTrigger value="codebook">Codebook</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Visualization Tab */}
        <TabsContent value="visualization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shannon-Fano Tree Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <VisualizationTree
                treeData={treeData}
                currentPartition={
                  currentStep === ALGORITHM_STEPS.PARTITIONING &&
                  partitionHistory.length > 0 &&
                  partitionHistory[currentPartitionIndex]
                    ? partitionHistory[currentPartitionIndex]
                    : null
                }
                currentStep={currentStep}
              />

              {currentStep === ALGORITHM_STEPS.PARTITIONING &&
                partitionHistory.length > 0 &&
                partitionHistory[currentPartitionIndex] && (
                  <div className="mt-4 p-4 border rounded-md bg-gray-50">
                    <h3 className="font-medium mb-2">
                      Current Partition Details:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Characters:</p>
                        <p className="font-mono">
                          {partitionHistory[currentPartitionIndex].chars.join(
                            ", "
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Total Frequency:
                        </p>
                        <p>
                          {partitionHistory[currentPartitionIndex].totalFreq}
                        </p>
                      </div>

                      {partitionHistory[currentPartitionIndex].splitIndex !==
                        null && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500">
                              Split After:
                            </p>
                            <p className="font-mono">
                              {
                                partitionHistory[currentPartitionIndex].chars[
                                  partitionHistory[currentPartitionIndex]
                                    .splitIndex!
                                ]
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Left/Right Sum:
                            </p>
                            <p>
                              {partitionHistory[currentPartitionIndex].leftSum}{" "}
                              /{" "}
                              {partitionHistory[currentPartitionIndex].rightSum}
                            </p>
                          </div>
                        </>
                      )}

                      {partitionHistory[currentPartitionIndex].prefix && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Current Prefix:
                          </p>
                          <p className="font-mono">
                            {partitionHistory[currentPartitionIndex].prefix}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {currentStep === ALGORITHM_STEPS.COMPLETE && (
            <Card>
              <CardHeader>
                <CardTitle>Encoding Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Original Text:
                    </h3>
                    <p className="font-mono p-2 bg-gray-100 rounded-md overflow-x-auto">
                      {input}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Encoded Binary:
                    </h3>
                    <p className="font-mono p-2 bg-gray-100 rounded-md overflow-x-auto whitespace-normal break-all">
                      {encodedString}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Frequency Analysis Tab */}
        <TabsContent value="frequency">
          <FrequencyTable frequencies={frequencies} sortedChars={sortedChars} />
        </TabsContent>

        {/* Codebook Tab */}
        <TabsContent value="codebook">
          <CodebookTable codebook={codebook} frequencies={frequencies} />
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <StatisticsPanel
            originalSize={originalSize}
            compressedSize={compressedSize}
            compressionRatio={compressionRatio}
            averageCodeLength={averageCodeLength}
            currentStep={currentStep}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
