export type Frequencies = { [key: string]: number };
export type Codebook = { [key: string]: string };

export interface PartitionState {
  chars: string[];
  freqs: number[];
  totalFreq: number;
  depth: number;
  prefix: string;
  parent: number | null;
  children: (number | null)[];
  splitIndex: number | null;
  leftSum: number | null;
  rightSum: number | null;
}

export type PartitionHistory = PartitionState[];

export interface TreeNode {
  id: string;
  name: string;
  value: number;
  code?: string;
  splitIndex?: number | null;
  leftSum?: number | null;
  rightSum?: number | null;
  children: TreeNode[];
}

export interface Statistics {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  averageCodeLength: number;
}

// Define algorithm steps
export const ALGORITHM_STEPS = {
  IDLE: "idle",
  FREQUENCY_ANALYSIS: "frequency_analysis",
  SORTING: "sorting",
  PARTITIONING: "partitioning",
  CODE_ASSIGNMENT: "code_assignment",
  ENCODING: "encoding",
  COMPLETE: "complete",
} as const; // Use 'as const' for stricter type checking

export type AlgorithmStep =
  (typeof ALGORITHM_STEPS)[keyof typeof ALGORITHM_STEPS];

export const calculateFrequencies = (text: string): Frequencies => {
  const freqs: Frequencies = {};
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    freqs[char] = (freqs[char] || 0) + 1;
  }
  return freqs;
};

export const sortByFrequency = (freqs: Frequencies): string[] => {
  return Object.keys(freqs).sort((a, b) => freqs[b] - freqs[a]);
};

export const generatePartitionHistory = (
  chars: string[],
  freqs: Frequencies
): PartitionHistory => {
  const history: PartitionHistory = [];

  const initialState: PartitionState = {
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
  };

  const partition = (state: PartitionState) => {
    history.push({ ...state });

    if (state.chars.length <= 1) {
      return;
    }

    let bestSplitIndex = 0;
    let minDifference = Number.POSITIVE_INFINITY;
    let leftSumCumulative = 0;
    const totalSum = state.chars.reduce(
      (sum: number, char: string) => sum + freqs[char],
      0
    );

    for (let i = 0; i < state.chars.length - 1; i++) {
      leftSumCumulative += freqs[state.chars[i]];
      const rightSumCumulative = totalSum - leftSumCumulative;
      const difference = Math.abs(leftSumCumulative - rightSumCumulative);

      if (difference < minDifference) {
        minDifference = difference;
        bestSplitIndex = i;
      }
    }

    const updatedState = { ...state };
    updatedState.splitIndex = bestSplitIndex;
    updatedState.leftSum = state.chars
      .slice(0, bestSplitIndex + 1)
      .reduce((sum: number, char: string) => sum + freqs[char], 0);
    updatedState.rightSum = state.chars
      .slice(bestSplitIndex + 1)
      .reduce((sum: number, char: string) => sum + freqs[char], 0);

    const leftChars = state.chars.slice(0, bestSplitIndex + 1);
    const rightChars = state.chars.slice(bestSplitIndex + 1);

    const leftState: PartitionState = {
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
    };

    const rightState: PartitionState = {
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
    };

    // A more robust way to calculate child indices, considering if they will be pushed to history
    let currentHistoryIndex = history.length;
    const leftChildHistoryIndex =
      leftChars.length > 0 ? currentHistoryIndex : null;
    if (leftChars.length > 1) currentHistoryIndex++;
    else if (leftChars.length === 1) currentHistoryIndex++;

    const rightChildHistoryIndex =
      rightChars.length > 0 ? currentHistoryIndex : null;

    updatedState.children = [leftChildHistoryIndex, rightChildHistoryIndex];

    history[history.length - 1] = updatedState;

    if (leftChars.length > 1) {
      partition(leftState);
    } else if (leftChars.length === 1) {
      history.push(leftState);
    }

    if (rightChars.length > 1) {
      partition(rightState);
    } else if (rightChars.length === 1) {
      history.push(rightState);
    }
  };

  partition(initialState);
  return history;
};

export const buildCodebook = (history: PartitionHistory): Codebook => {
  const codes: Codebook = {};
  history.forEach((state) => {
    if (state.chars.length === 1 && state.prefix) {
      codes[state.chars[0]] = state.prefix;
    }
  });
  return codes;
};

export const encodeString = (text: string, codes: Codebook): string => {
  let encoded = "";
  for (let i = 0; i < text.length; i++) {
    encoded += codes[text[i]];
  }
  return encoded;
};

export const calculateStatistics = (
  text: string,
  codes: Codebook
): Statistics => {
  const origSize = text.length * 8; // Assuming 8 bits per character
  const compSize = text
    .split("")
    .reduce((sum, char) => sum + (codes[char] ? codes[char].length : 0), 0);
  const ratio = origSize > 0 ? (1 - compSize / origSize) * 100 : 0;
  const totalChars = text.length;
  const avgLength = totalChars > 0 ? compSize / totalChars : 0;

  return {
    originalSize: origSize,
    compressedSize: compSize,
    compressionRatio: ratio,
    averageCodeLength: avgLength,
  };
};

export const buildTreeData = (history: PartitionHistory): TreeNode | null => {
  if (history.length === 0) return null;

  const buildNode = (historyIndex: number): TreeNode => {
    const state = history[historyIndex];

    if (state.chars.length === 1) {
      return {
        id: `node-${historyIndex}`,
        name: state.chars[0],
        value: state.freqs[0],
        code: state.prefix,
        children: [],
      };
    }

    const children: TreeNode[] = [];
    // state.children should contain indices into the history array
    if (
      state.children &&
      state.children[0] !== null &&
      history[state.children[0]]
    ) {
      children.push(buildNode(state.children[0]));
    }
    if (
      state.children &&
      state.children[1] !== null &&
      history[state.children[1]]
    ) {
      children.push(buildNode(state.children[1]));
    }

    return {
      id: `node-${historyIndex}`,
      name: state.chars.join(", "),
      value: state.totalFreq,
      splitIndex: state.splitIndex,
      leftSum: state.leftSum,
      rightSum: state.rightSum,
      children,
    };
  };

  return buildNode(0); // Start building from the initial state in history
};
