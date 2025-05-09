import { useState, useEffect, useCallback } from "react";
import {
  calculateFrequencies,
  sortByFrequency,
  generatePartitionHistory,
  buildCodebook,
  encodeString,
  calculateStatistics,
  buildTreeData,
  ALGORITHM_STEPS,
  Frequencies,
  Codebook,
  PartitionHistory,
  TreeNode,
  AlgorithmStep,
} from "@/lib/algorithm";

export const EXAMPLES = {
  "shannon-fano": "shannon-fano",
  aabc: "aabc",
  "hello world": "hello world",
  mississippi: "mississippi",
  compression: "compression",
};

export interface ShannonFanoHook {
  input: string;
  frequencies: Frequencies;
  sortedChars: string[];
  codebook: Codebook;
  encodedString: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  averageCodeLength: number;
  currentStep: AlgorithmStep;
  isRunning: boolean;
  speed: number;
  treeData: TreeNode | null;
  partitionHistory: PartitionHistory;
  currentPartitionIndex: number;
  error: string;
  activeTab: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleExampleSelect: (value: string) => void;
  startAlgorithm: () => void;
  stepForward: () => void;
  toggleRunning: () => void;
  resetVisualizer: () => void;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

export const useShannonFano = (): ShannonFanoHook => {
  const [input, setInput] = useState("");
  const [frequencies, setFrequencies] = useState<Frequencies>({});
  const [sortedChars, setSortedChars] = useState<string[]>([]);
  const [codebook, setCodebook] = useState<Codebook>({});
  const [encodedString, setEncodedString] = useState("");
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressionRatio, setCompressionRatio] = useState(0);
  const [averageCodeLength, setAverageCodeLength] = useState(0);
  const [currentStep, setCurrentStep] = useState<AlgorithmStep>(
    ALGORITHM_STEPS.IDLE
  );
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1000); // milliseconds
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [partitionHistory, setPartitionHistory] = useState<PartitionHistory>(
    []
  );
  const [currentPartitionIndex, setCurrentPartitionIndex] = useState(0);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("visualization");

  const resetVisualizer = useCallback(() => {
    setFrequencies({});
    setSortedChars([]);
    setCodebook({});
    setEncodedString("");
    setOriginalSize(0);
    setCompressedSize(0);
    setCompressionRatio(0);
    setAverageCodeLength(0);
    setCurrentStep(ALGORITHM_STEPS.IDLE);
    setIsRunning(false);
    setTreeData(null);
    setPartitionHistory([]);
    setCurrentPartitionIndex(0);
    setError("");
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    resetVisualizer();
  };

  const handleExampleSelect = (value: string) => {
    setInput(EXAMPLES[value as keyof typeof EXAMPLES]);
    resetVisualizer();
  };

  const startAlgorithm = useCallback(() => {
    if (!input.trim()) {
      setError("Please enter some text to compress.");
      return;
    }
    resetVisualizer();
    setCurrentStep(ALGORITHM_STEPS.FREQUENCY_ANALYSIS);
    setIsRunning(true);
  }, [input, resetVisualizer]);

  const stepForward = useCallback(() => {
    switch (currentStep) {
      case ALGORITHM_STEPS.IDLE:
        setCurrentStep(ALGORITHM_STEPS.FREQUENCY_ANALYSIS);
        break;

      case ALGORITHM_STEPS.FREQUENCY_ANALYSIS:
        const freqs = calculateFrequencies(input);
        setFrequencies(freqs);
        if (Object.keys(freqs).length === 0) {
          setError("Input is empty or contains no processable characters.");
          setCurrentStep(ALGORITHM_STEPS.IDLE);
          setIsRunning(false);
          return;
        }
        if (Object.keys(freqs).length === 1) {
          const char = Object.keys(freqs)[0];
          const singleCharCodebook = { [char]: "0" };
          setCodebook(singleCharCodebook);
          setEncodedString("0".repeat(input.length));
          const stats = calculateStatistics(input, singleCharCodebook);
          setOriginalSize(stats.originalSize);
          setCompressedSize(stats.compressedSize);
          setCompressionRatio(stats.compressionRatio);
          setAverageCodeLength(stats.averageCodeLength);
          setCurrentStep(ALGORITHM_STEPS.COMPLETE);
        } else {
          setCurrentStep(ALGORITHM_STEPS.SORTING);
        }
        break;

      case ALGORITHM_STEPS.SORTING:
        const sorted = sortByFrequency(frequencies);
        setSortedChars(sorted);
        const history = generatePartitionHistory(sorted, frequencies);
        setPartitionHistory(history);
        const tree = buildTreeData(history);
        setTreeData(tree);
        setCurrentStep(ALGORITHM_STEPS.PARTITIONING);
        break;

      case ALGORITHM_STEPS.PARTITIONING:
        if (currentPartitionIndex < partitionHistory.length - 1) {
          setCurrentPartitionIndex(currentPartitionIndex + 1);
        } else {
          setCurrentStep(ALGORITHM_STEPS.CODE_ASSIGNMENT);
        }
        break;

      case ALGORITHM_STEPS.CODE_ASSIGNMENT:
        const codes = buildCodebook(partitionHistory);
        setCodebook(codes);
        setCurrentStep(ALGORITHM_STEPS.ENCODING);
        break;

      case ALGORITHM_STEPS.ENCODING:
        const encoded = encodeString(input, codebook);
        setEncodedString(encoded);
        const stats = calculateStatistics(input, codebook);
        setOriginalSize(stats.originalSize);
        setCompressedSize(stats.compressedSize);
        setCompressionRatio(stats.compressionRatio);
        setAverageCodeLength(stats.averageCodeLength);
        setCurrentStep(ALGORITHM_STEPS.COMPLETE);
        setIsRunning(false);
        break;

      default:
        setIsRunning(false);
        break;
    }
  }, [
    currentStep,
    input,
    frequencies,
    partitionHistory,
    currentPartitionIndex,
    codebook,
  ]);

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      isRunning &&
      currentStep !== ALGORITHM_STEPS.IDLE &&
      currentStep !== ALGORITHM_STEPS.COMPLETE
    ) {
      timer = setTimeout(() => {
        stepForward();
      }, speed);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isRunning, currentStep, speed, stepForward, currentPartitionIndex]); // Added currentPartitionIndex to dependencies

  return {
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
    speed,
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
    setSpeed,
    setActiveTab,
  };
};
