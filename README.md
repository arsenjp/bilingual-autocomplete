# Bilingual Autocomplete System

[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-orange.svg)](package.json)

A high-performance, production-ready bilingual (Japanese-English) autocomplete system with semantic search capabilities. Built with modern JavaScript best practices, featuring both Trie and Map data structures for optimal performance comparison.

## 🚀 Features

- **🌐 Bilingual Support**: Full Japanese and English text processing
- **🔍 Semantic Search**: Intelligent term matching using semantic sets
- **⚡ High Performance**: Dual data structure implementation (Trie + Map)
- **📊 Performance Monitoring**: Real-time timing and memory analysis
- **🎯 Interactive CLI**: User-friendly command-line interface
- **🔄 Script Conversion**: Automatic Hiragana ↔ Katakana ↔ Kanji conversion
- **📈 Scalable**: Designed to handle thousands of text entries efficiently
- **🛡️ Error Handling**: Comprehensive error handling and validation
- **📝 Well Documented**: Extensive JSDoc documentation

## 📁 Project Structure

```
bilingual-autocomplete/
├── src/
│   ├── index.js                    # Main application entry point
│   ├── data-structures/
│   │   ├── trie.js                 # BilingualTrie implementation
│   │   └── map.js                  # BilingualMap implementation
│   ├── utils/
│   │   ├── performance.js          # Performance monitoring utilities
│   │   ├── memory-usage.js         # Memory analysis utilities
│   │   └── data-loader.js          # File loading and validation
│   ├── ui/
│   │   └── search-interface.js     # Interactive CLI interface
│   └── generators/
│       └── semantic-generator.js   # Semantic set generation tool
├── input/
│   ├── sample-texts.json           # Japanese activity categories
│   └── translations.json           # Japanese-English translations
├── dist/                           # Generated files (created after build)
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## 🛠️ Installation

### Prerequisites

- **Node.js** (v14.0.0 or higher)
- **npm** or **pnpm**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/arsenjp/bilingual-autocomplete.git
cd bilingual-autocomplete

# Install dependencies
npm install
# or
pnpm install

# Generate semantic sets (first time setup)
npm run generate

# Start the interactive application
npm start
```

## 🎮 Usage

### Interactive Search

```bash
npm start
```

The application provides an interactive command-line interface:

```
🎯 Interactive Autocomplete System
Type a word to search (or "quit" to exit):

🔍 Enter search term: 海
```

**Available Commands:**
- `<search term>` - Search for terms (Japanese or English)
- `help`, `h`, `?` - Show help message
- `stats`, `info` - Show system statistics
- `quit`, `exit`, `q` - Exit the application

### Semantic Set Generation

```bash
npm run generate
```

Generates semantic sets from input data and exports them to `dist/simple-semantic-sets.json`.

### Development Mode

```bash
npm run dev
```

Runs the application with Node.js inspector for debugging.

## 📦 Dependencies

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `kuroshiro` | ^1.2.0 | Japanese text processing and script conversion |
| `kuroshiro-analyzer-kuromoji` | ^1.1.0 | Japanese morphological analyzer |

### Built-in Node.js Modules

- `fs` - File system operations
- `path` - Path manipulation
- `readline` - Interactive command-line interface
- `v8` - Memory usage analysis

## 🏗️ Architecture

### Core Components

#### 1. **AutocompleteApp** (`src/index.js`)
Main application orchestrator that initializes all components and manages the application lifecycle.

```javascript
const { AutocompleteApp } = require('./src/index');
const app = new AutocompleteApp();
await app.initialize();
await app.start();
```

#### 2. **BilingualTrie** (`src/data-structures/trie.js`)
Efficient prefix-based search using Trie data structure with semantic set integration.

**Features:**
- Autocomplete suggestions
- Memory-efficient tree structure
- Semantic set integration
- Comprehensive statistics

```javascript
const { BilingualTrie } = require('./src/data-structures/trie');
const trie = new BilingualTrie(sampleData);
const suggestions = trie.getAutocompleteSuggestions('海');
const results = trie.search('海');
```

#### 3. **BilingualMap** (`src/data-structures/map.js`)
Fast lookup implementation using Map data structure for direct term-to-text mapping.

**Features:**
- Direct term mapping
- Semantic set matching
- Fast lookup performance
- Advanced query methods

```javascript
const { BilingualMap } = require('./src/data-structures/map');
const map = new BilingualMap(sampleData);
const results = map.search('sea');
const terms = map.getTermsByPrefix('海');
```

#### 4. **PerformanceMonitor** (`src/utils/performance.js`)
High-resolution timing utilities with automatic unit conversion and measurement storage.

```javascript
const { PerformanceMonitor } = require('./src/utils/performance');
const monitor = new PerformanceMonitor();
const result = monitor.measureOperation('search', () => performSearch());
console.log(`Duration: ${result.duration}`);
```

#### 5. **MemoryAnalyzer** (`src/utils/memory-usage.js`)
Comprehensive memory usage analysis using V8 serialization.

```javascript
const { MemoryAnalyzer } = require('./src/utils/memory-usage');
const analyzer = new MemoryAnalyzer();
const analysis = analyzer.analyzeMemoryUsage(dataStructure, true);
```

#### 6. **SearchInterface** (`src/ui/search-interface.js`)
Interactive command-line interface with command handling and result display.

```javascript
const { SearchInterface } = require('./src/ui/search-interface');
const interface = new SearchInterface(trie, map, performanceMonitor);
await interface.start();
```

#### 7. **SemanticGenerator** (`src/generators/semantic-generator.js`)
Advanced semantic set generation with Japanese script conversion and translation integration.

```javascript
const { SemanticGenerator } = require('./src/generators/semantic-generator');
const generator = new SemanticGenerator();
await generator.generateFromInput();
```

## 🔍 Search Capabilities

### Supported Queries

- **Japanese**: 海, 山, スポーツ, アクティビティ
- **English**: sea, mountain, sports, activities
- **Partial matches**: "海" → "海のアクティビティ"
- **Semantic matches**: Related terms in the same semantic set
- **Mixed language**: Seamless Japanese-English search

### Data Sources

- **Sample Texts**: 900+ Japanese activity categories
- **Translations**: Comprehensive Japanese-English term mappings
- **Semantic Sets**: Automatically generated from input data

## 📊 Performance Features

### Timing Measurements

- Trie build time
- Map build time
- Search operation timing
- Autocomplete suggestion timing
- Real-time performance monitoring

### Memory Analysis

- Process memory usage (RSS, heap)
- Data structure memory consumption
- Component-wise size breakdown
- Memory trend analysis
- Comparison between data structures



## 🛠️ Development

### Adding New Data

1. **Update input files**:
   ```bash
   # Add new searchable term in input/sample-texts.json
   
   # Add new translations in input/translations.json
   ```

2. **Regenerate semantic sets**:
   ```bash
   npm run generate
   ```

3. **Restart the application**:
   ```bash
   npm start
   ```


### Code Quality

The codebase follows modern JavaScript best practices:

- **ES6+ Features**: Classes, async/await, destructuring
- **Error Handling**: Comprehensive try-catch blocks
- **Input Validation**: Parameter validation and sanitization
- **Documentation**: Extensive JSDoc comments
- **Modular Design**: Separation of concerns
- **Type Safety**: Runtime type checking

## 🔧 Configuration

### Environment Variables

```bash
# Optional: Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Optional: Enable debug logging
export DEBUG="bilingual-autocomplete:*"
```

### File Structure Requirements

```
input/
├── sample-texts.json     # Required: Array of Japanese strings
└── translations.json     # Required: Object with Japanese keys and English arrays

dist/                     # Created automatically
└── simple-semantic-sets.json  # Generated semantic sets
```

## 🐛 Troubleshooting

### Common Issues

#### 1. **Missing Semantic Sets**
```
Error: Semantic sets file not found
```
**Solution**: Run `npm run generate` to create semantic sets.

#### 2. **Memory Errors**
```
Error: JavaScript heap out of memory
```
**Solution**: Increase Node.js memory limit:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

#### 3. **Japanese Text Issues**
```
Error: Invalid UTF-8 encoding
```
**Solution**: Ensure all files are saved with UTF-8 encoding.

#### 4. **Kuroshiro Initialization Failed**
```
Error: Failed to initialize Kuroshiro
```
**Solution**: Check internet connection and try reinstalling dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
DEBUG="bilingual-autocomplete:*" npm start
```

### Performance Debugging

```bash
# Enable Node.js inspector
npm run dev

# Or run with profiling
node --prof src/index.js
```

## 📈 Performance Optimization

### Memory Optimization

- **Trie Structure**: More memory efficient for large datasets
- **Lazy Loading**: Semantic sets loaded on demand
- **Garbage Collection**: Proper cleanup of unused objects

### Speed Optimization

- **Caching**: File loading and semantic set caching
- **Indexing**: Pre-built term-to-text mappings
- **Parallel Processing**: Async operations where possible

### Scalability

- **Modular Design**: Easy to extend and modify
- **Memory Monitoring**: Built-in memory usage tracking
- **Performance Metrics**: Real-time performance analysis

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feat/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feat/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add comprehensive error handling
- Include JSDoc documentation
- Write meaningful commit messages
- Test thoroughly before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kuroshiro**: Japanese text processing library
- **Kuromoji**: Japanese morphological analyzer
- **Node.js Community**: Excellent documentation and tools

---

**Made with ❤️ for the bilingual community** 