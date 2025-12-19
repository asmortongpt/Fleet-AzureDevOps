markdown
## Memory Leak Detection

The `MemoryLeakDetector` class provides automatic memory leak detection using a configurable linear regression algorithm. It samples memory usage and triggers a callback when a potential leak is detected.

### Configuration Options

- `sampleRate` (default: 5000ms): Interval between memory samples.
- `windowSize` (default: 10): Number of samples to maintain in the rolling window.
- `memoryLeakThreshold` (default: 50MB): Memory increase threshold for leak detection.

### Usage Example