"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, SkipForward, RotateCcw, Info } from "lucide-react"
import FrequencyTable from "./frequency-table"
import VisualizationTree from "./visualization-tree"
import CodebookTable from "./codebook-table"
import StatisticsPanel from "./statistics-panel"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define example inputs
const EXAMPLES = {
  "shannon-fano": "shannon-fano",
  aabc: "aabc",
  "hello world": "hello world",
  mississippi: "mississippi",
  compression: "compression",
}

// Define algorithm steps
const ALGORITHM_STEPS = {
  IDLE: "idle",
  FREQUENCY_ANALYSIS: "frequency_analysis",
  SORTING: "sorting",
  PARTITIONING: "partitioning",
  CODE_ASSIGNMENT: "code_assignment",
  ENCODING: "encoding",
  COMPLETE: "complete",
}

export default function ShannonFanoVisualizer() {
  // State variables
  const [input, setInput] = useState("")
  const [frequencies, setFrequencies] = useState<{ [key: string]: number }>({})
  const [sortedChars, setSortedChars] = useState<string[]>([])
  const [codebook, setCodebook] = useState<{ [key: string]: string }>({})
  const [encodedString, setEncodedString] = useState("")
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)
  const [compressionRatio, setCompressionRatio] = useState(0)
  const [averageCodeLength, setAverageCodeLength] = useState(0)
  const [currentStep, setCurrentStep] = useState(ALGORITHM_STEPS.IDLE)
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(1000) // milliseconds
  const [treeData, setTreeData] = useState<any>(null)
  const [partitionHistory, setPartitionHistory] = useState<any[]>([])
  const [currentPartitionIndex, setCurrentPartitionIndex] = useState(0)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("visualization")

  // Reset the visualizer
  const resetVisualizer = () => {
    setFrequencies({})
    setSortedChars([])
    setCodebook({})
    setEncodedString("")
    setOriginalSize(0)
    setCompressedSize(0)
    setCompressionRatio(0)
    setAverageCodeLength(0)
    setCurrentStep(ALGORITHM_STEPS.IDLE)
    setIsRunning(false)
    setTreeData(null)
    setPartitionHistory([])
    setCurrentPartitionIndex(0)
    setError("")
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    resetVisualizer()
  }

  // Handle example selection
  const handleExampleSelect = (value: string) => {
    setInput(EXAMPLES[value as keyof typeof EXAMPLES])
    resetVisualizer()
  }

  // Calculate character frequencies
  const calculateFrequencies = (text: string) => {
    const freqs: { [key: string]: number } = {}
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      freqs[char] = (freqs[char] || 0) + 1
    }
    return freqs
  }

  // Sort characters by frequency
  const sortByFrequency = (freqs: { [key: string]: number }) => {
    return Object.keys(freqs).sort((a, b) => freqs[b] - freqs[a])
  }

  // Generate the partition history for visualization
  const generatePartitionHistory = (chars: string[], freqs: { [key: string]: number }) => {
    const history: any[] = []

    // Initial state with all characters
    const initialState = {
      chars: [...chars],
      freqs: chars.map((char) => freqs[char]),
      totalFreq: chars.reduce((sum, char) => sum + freqs[char], 0),
      depth: 0,
      prefix: "",
      parent: null,
      children: [],
      splitIndex: null,
      leftSum: null,
      rightSum: null,
    }

    // Recursive function to partition and build history
    const partition = (state: any) => {
      history.push({ ...state })

      // Base case: single character
      if (state.chars.length <= 1) {
        return
      }

      // Find the best split point
      let bestSplitIndex = 0
      let minDifference = Number.POSITIVE_INFINITY
      let leftSum = 0
      const totalSum = state.chars.reduce((sum: number, char: string) => sum + freqs[char], 0)

      for (let i = 0; i < state.chars.length - 1; i++) {
        leftSum += freqs[state.chars[i]]
        const rightSum = totalSum - leftSum
        const difference = Math.abs(leftSum - rightSum)

        if (difference < minDifference) {
          minDifference = difference
          bestSplitIndex = i
        }
      }

      // Update the state with split information
      const updatedState = { ...state }
      updatedState.splitIndex = bestSplitIndex
      updatedState.leftSum = state.chars
        .slice(0, bestSplitIndex + 1)
        .reduce((sum: number, char: string) => sum + freqs[char], 0)
      updatedState.rightSum = state.chars
        .slice(bestSplitIndex + 1)
        .reduce((sum: number, char: string) => sum + freqs[char], 0)

      // Create left and right partitions
      const leftChars = state.chars.slice(0, bestSplitIndex + 1)
      const rightChars = state.chars.slice(bestSplitIndex + 1)

      const leftState = {
        chars: leftChars,
        freqs: leftChars.map((char) => freqs[char]),
        totalFreq: leftChars.reduce((sum, char) => sum + freqs[char], 0),
        depth: state.depth + 1,
        prefix: state.prefix + "0",
        parent: history.length - 1,
        children: [],
        splitIndex: null,
        leftSum: null,
        rightSum: null,
      }

      const rightState = {
        chars: rightChars,
        freqs: rightChars.map((char) => freqs[char]),
        totalFreq: rightChars.reduce((sum, char) => sum + freqs[char], 0),
        depth: state.depth + 1,
        prefix: state.prefix + "1",
        parent: history.length - 1,
        children: [],
        splitIndex: null,
        leftSum: null,
        rightSum: null,
      }

      // Update parent's children
      updatedState.children = [history.length, history.length + leftChars.length > 1 ? history.length + 1 : null]

      // Replace the current state with the updated one
      history[history.length - 1] = updatedState

      // Recursively partition
      if (leftChars.length > 1) {
        partition(leftState)
      } else if (leftChars.length === 1) {
        history.push(leftState)
      }

      if (rightChars.length > 1) {
        partition(rightState)
      } else if (rightChars.length === 1) {
        history.push(rightState)
      }
    }

    partition(initialState)
    return history
  }

  // Build the codebook from partition history
  const buildCodebook = (history: any[]) => {
    const codes: { [key: string]: string } = {}

    history.forEach((state) => {
      if (state.chars.length === 1 && state.prefix) {
        codes[state.chars[0]] = state.prefix
      }
    })

    return codes
  }

  // Encode the input string using the codebook
  const encodeString = (text: string, codes: { [key: string]: string }) => {
    let encoded = ""
    for (let i = 0; i < text.length; i++) {
      encoded += codes[text[i]]
    }
    return encoded
  }

  // Calculate statistics
  const calculateStatistics = (text: string, codes: { [key: string]: string }, freqs: { [key: string]: number }) => {
    // Original size (assuming 8 bits per character)
    const origSize = text.length * 8

    // Compressed size
    const compSize = text.split("").reduce((sum, char) => sum + codes[char].length, 0)

    // Compression ratio
    const ratio = origSize > 0 ? (1 - compSize / origSize) * 100 : 0

    // Average code length
    const totalChars = text.length
    const avgLength = totalChars > 0 ? compSize / totalChars : 0

    return {
      originalSize: origSize,
      compressedSize: compSize,
      compressionRatio: ratio,
      averageCodeLength: avgLength,
    }
  }

  // Build tree data for visualization
  const buildTreeData = (history: any[]) => {
    if (history.length === 0) return null

    const buildNode = (index: number) => {
      const state = history[index]

      // Leaf node
      if (state.chars.length === 1) {
        return {
          id: `node-${index}`,
          name: state.chars[0],
          value: state.freqs[0],
          code: state.prefix,
          children: [],
        }
      }

      // Internal node
      const children = []

      if (state.children && state.children[0] !== null) {
        children.push(buildNode(state.children[0]))
      }

      if (state.children && state.children[1] !== null) {
        children.push(buildNode(state.children[1]))
      }

      return {
        id: `node-${index}`,
        name: state.chars.join(", "),
        value: state.totalFreq,
        splitIndex: state.splitIndex,
        leftSum: state.leftSum,
        rightSum: state.rightSum,
        children,
      }
    }

    return buildNode(0)
  }

  // Start the algorithm
  const startAlgorithm = () => {
    // Validate input
    if (!input.trim()) {
      setError("Please enter some text to compress.")
      return
    }

    // Reset previous state
    resetVisualizer()

    // Start the algorithm
    setCurrentStep(ALGORITHM_STEPS.FREQUENCY_ANALYSIS)
    setIsRunning(true)
  }

  // Step forward in the algorithm
  const stepForward = () => {
    switch (currentStep) {
      case ALGORITHM_STEPS.IDLE:
        setCurrentStep(ALGORITHM_STEPS.FREQUENCY_ANALYSIS)
        break

      case ALGORITHM_STEPS.FREQUENCY_ANALYSIS:
        // Calculate frequencies
        const freqs = calculateFrequencies(input)
        setFrequencies(freqs)

        // Check if there's only one unique character
        if (Object.keys(freqs).length === 1) {
          const char = Object.keys(freqs)[0]
          setCodebook({ [char]: "0" })
          setEncodedString("0".repeat(input.length))

          const stats = calculateStatistics(input, { [char]: "0" }, freqs)
          setOriginalSize(stats.originalSize)
          setCompressedSize(stats.compressedSize)
          setCompressionRatio(stats.compressionRatio)
          setAverageCodeLength(stats.averageCodeLength)

          setCurrentStep(ALGORITHM_STEPS.COMPLETE)
        } else {
          setCurrentStep(ALGORITHM_STEPS.SORTING)
        }
        break

      case ALGORITHM_STEPS.SORTING:
        // Sort characters by frequency
        const sorted = sortByFrequency(frequencies)
        setSortedChars(sorted)

        // Generate partition history
        const history = generatePartitionHistory(sorted, frequencies)
        setPartitionHistory(history)

        // Build tree data for visualization
        const tree = buildTreeData(history)
        setTreeData(tree)

        setCurrentStep(ALGORITHM_STEPS.PARTITIONING)
        break

      case ALGORITHM_STEPS.PARTITIONING:
        // Move to the next partition in history
        if (currentPartitionIndex < partitionHistory.length - 1) {
          setCurrentPartitionIndex(currentPartitionIndex + 1)
        } else {
          // All partitions are done, move to code assignment
          setCurrentStep(ALGORITHM_STEPS.CODE_ASSIGNMENT)
        }
        break

      case ALGORITHM_STEPS.CODE_ASSIGNMENT:
        // Build the codebook
        const codes = buildCodebook(partitionHistory)
        setCodebook(codes)
        setCurrentStep(ALGORITHM_STEPS.ENCODING)
        break

      case ALGORITHM_STEPS.ENCODING:
        // Encode the input string
        const encoded = encodeString(input, codebook)
        setEncodedString(encoded)

        // Calculate statistics
        const stats = calculateStatistics(input, codebook, frequencies)
        setOriginalSize(stats.originalSize)
        setCompressedSize(stats.compressedSize)
        setCompressionRatio(stats.compressionRatio)
        setAverageCodeLength(stats.averageCodeLength)

        setCurrentStep(ALGORITHM_STEPS.COMPLETE)
        setIsRunning(false)
        break

      default:
        setIsRunning(false)
        break
    }
  }

  // Toggle running state
  const toggleRunning = () => {
    setIsRunning(!isRunning)
  }

  // Effect for automated stepping
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isRunning && currentStep !== ALGORITHM_STEPS.IDLE && currentStep !== ALGORITHM_STEPS.COMPLETE) {
      timer = setTimeout(() => {
        stepForward()
      }, speed)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isRunning, currentStep, currentPartitionIndex])

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
                <Select onValueChange={handleExampleSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an example" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(EXAMPLES).map((key) => (
                      <SelectItem key={key} value={key}>
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
              <Button onClick={startAlgorithm} disabled={isRunning || !input.trim()}>
                Start Algorithm
              </Button>
              <Button
                onClick={toggleRunning}
                disabled={currentStep === ALGORITHM_STEPS.IDLE || currentStep === ALGORITHM_STEPS.COMPLETE}
                variant="outline"
              >
                {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isRunning ? "Pause" : "Run"}
              </Button>
              <Button
                onClick={stepForward}
                disabled={isRunning || currentStep === ALGORITHM_STEPS.COMPLETE}
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
                {currentStep === ALGORITHM_STEPS.FREQUENCY_ANALYSIS && "Calculating Character Frequencies"}
                {currentStep === ALGORITHM_STEPS.SORTING && "Sorting Characters by Frequency"}
                {currentStep === ALGORITHM_STEPS.PARTITIONING && "Partitioning Characters"}
                {currentStep === ALGORITHM_STEPS.CODE_ASSIGNMENT && "Assigning Binary Codes"}
                {currentStep === ALGORITHM_STEPS.ENCODING && "Encoding Input String"}
                {currentStep === ALGORITHM_STEPS.COMPLETE && "Compression Complete"}
              </p>
            </div>

            {currentStep === ALGORITHM_STEPS.PARTITIONING && (
              <div>
                <p className="text-sm text-gray-500">Partition Progress:</p>
                <p className="font-medium">{`${currentPartitionIndex + 1} / ${partitionHistory.length}`}</p>
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
                  {currentStep === ALGORITHM_STEPS.COMPLETE && "The Shannon-Fano compression is complete."}
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
                  currentStep === ALGORITHM_STEPS.PARTITIONING ? partitionHistory[currentPartitionIndex] : null
                }
                currentStep={currentStep}
              />

              {currentStep === ALGORITHM_STEPS.PARTITIONING && partitionHistory.length > 0 && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50">
                  <h3 className="font-medium mb-2">Current Partition Details:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Characters:</p>
                      <p className="font-mono">{partitionHistory[currentPartitionIndex].chars.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Frequency:</p>
                      <p>{partitionHistory[currentPartitionIndex].totalFreq}</p>
                    </div>

                    {partitionHistory[currentPartitionIndex].splitIndex !== null && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Split After:</p>
                          <p className="font-mono">
                            {
                              partitionHistory[currentPartitionIndex].chars[
                                partitionHistory[currentPartitionIndex].splitIndex
                              ]
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Left/Right Sum:</p>
                          <p>
                            {partitionHistory[currentPartitionIndex].leftSum} /{" "}
                            {partitionHistory[currentPartitionIndex].rightSum}
                          </p>
                        </div>
                      </>
                    )}

                    {partitionHistory[currentPartitionIndex].prefix && (
                      <div>
                        <p className="text-sm text-gray-500">Current Prefix:</p>
                        <p className="font-mono">{partitionHistory[currentPartitionIndex].prefix}</p>
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
                    <h3 className="text-sm font-medium text-gray-500">Original Text:</h3>
                    <p className="font-mono p-2 bg-gray-100 rounded-md overflow-x-auto">{input}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Encoded Binary:</h3>
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
          <FrequencyTable frequencies={frequencies} sortedChars={sortedChars} currentStep={currentStep} />
        </TabsContent>

        {/* Codebook Tab */}
        <TabsContent value="codebook">
          <CodebookTable codebook={codebook} frequencies={frequencies} currentStep={currentStep} />
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
  )
}
