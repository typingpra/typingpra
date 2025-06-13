# Typing Practice App

<div align="center">

🎯 **A comprehensive typing practice application for programmers and language learners**

[Features](#features) • [Quick Start](#quick-start) • [Practice Modes](#practice-modes) • [Documentation](#documentation)

</div>

## 🌟 Overview

A specialized typing practice application combining programming code practice, English vocabulary training, basic character practice, and reaction time measurement. Built as a static web application with advanced analytics and hosted on GitHub Pages.

## ✨ Features

### 🎯 Core Features

- **12 Practice Modes**: Programming languages, TypeWell modes, English words, reaction training, and custom content
- **Real-time Statistics**: WPM, accuracy, and detailed performance tracking with live feedback
- **Advanced Analytics**: Interactive graphs, keyboard heatmaps, and comprehensive mistake analysis
- **Custom Code Practice**: Import your own code files or paste custom content with dual mode support
- **Page-based Learning**: Long code automatically split into manageable 20-line pages
- **Multiple Practice Modes**: Normal (with corrections) and TypeWell (strict, no backspace)

### 🎯 Practice Modes

#### 💻 Programming Languages (7 languages)

- **Languages**: Python, JavaScript, Java, C, C++, Rust, Lua
- **Real Code Practice**: Actual programming syntax and patterns
- **Page Division**: Automatic 20-line page splitting for long files
- **Mode Selection**: Normal (backspace allowed) or TypeWell (strict) per language

#### ⌨️ TypeWell Original

- **Random Character Practice**: 360 characters × 10 lines (36 chars/line)
- **4 Difficulty Modes**:
  - Lowercase (a-z + space, comma, period)
  - Mixed Case (a-z, A-Z + space, comma, period)
  - With Symbols (a-z, A-Z + all symbols + space)
  - Numbers Only (0-9 focused practice)
- **Advanced Features**:
  - Backspace completely disabled - stop on mistakes
  - High-quality Xorshift128 random generation
  - Configurable countdown (0-3 seconds)
  - Dedicated 28px large font for optimal visibility
  - Line-by-line lap time recording

#### 🔤 TypeWell English Words

- **NGSL-compliant Vocabulary**: New General Service List English words
- **3 Word Sets**:
  - Top 500 Words (most frequent)
  - Top 1500 Words (extended vocabulary)
  - All Words (complete 2809 words)
- **Fixed Format**: 400 characters × 8 lines consistently
- **TypeWell Style**: Strict mode with backspace disabled
- **Educational Value**: Learn common English vocabulary while practicing

#### ⚡ Initial Speed

- **Reaction Time Measurement**: Single character response speed training
- **2 Character Sets**:
  - Lowercase + Punctuation (a-z + ,.)
  - Numbers Only (0-9)
- **Configurable Trials**: 5-20 attempts per session
- **Precision Timing**: Millisecond-accurate measurement
- **Anti-cheat System**: Detection and penalty for premature key presses
- **Detailed Analysis**: Trial-by-trial breakdown with fastest/slowest times

#### 📚 Word Practice

- **Individual Word Training**: English word-by-word typing practice
- **NGSL Word Database**: Scientifically validated vocabulary (CC BY-SA 4.0 licensed)
- **Flexible Length**: 5-20 words per session
- **Real-time WPM**: Immediate speed calculation per word completed
- **Comprehensive Results**: Word-by-word performance with best/worst tracking
- **First Key Analysis**: Reaction time measurement for word recognition

#### 🔧 Custom Code

- **File Support**: .txt, .js, .py, .c, .cpp, .java, .rs, .lua, .md, .json, .html, .css
- **Large File Support**: Up to 1MB file size limit
- **Mode Selection**: Choose Normal or TypeWell mode when saving
- **Save & Load System**: Named storage for multiple custom codes
- **Paste Support**: Direct text pasting alternative to file upload

### 📊 Advanced Analytics

#### 📈 Interactive Graphs (Chart.js powered)

- **Progress Chart**: Performance trends over time (Line chart)
- **Language Comparison**: Side-by-side language performance (Bar chart)
- **Initial Speed Analysis**: Reaction time scatter plot with trend analysis
- **Keyboard Analysis**: Heatmap + mistake frequency visualization

#### 🎯 Mistake Analysis System

- **Character-level Tracking**: Comprehensive recording of all typing errors
- **Dual Statistics**: General mistakes + Initial Speed specific mistakes
- **Keyboard Heatmap**: 15×4 QWERTY layout with 5-level intensity visualization
- **Top 8 Problem Characters**: Doughnut chart with gradient colors
- **Special Character Support**: Proper display of space (␣), Enter (⏎), Tab (→)

#### 🏆 TOP3 Ranking System

- **Language-specific Records**: Separate rankings for each practice mode
- **Part-based Tracking**: Individual page/section record management
- **Rank-in Detection**: Highlight display when achieving new personal bests
- **Automatic Updates**: Real-time record comparison and updating

### 🎨 Customization & Comfort

#### 🌙 Advanced Theme System

- **Dark/Light Themes**: Eye-friendly themes for any environment with smooth transitions
- **CSS Custom Properties**: Dynamic color management with theme-aware graphs
- **Responsive Design**: Automatic mobile layout adjustments
- **Color Coding System**: Distinct colors for correct, incorrect, pending, and current position

#### 🧘 Auto Break System

- **Configurable Thresholds**: Set character count for automatic break reminders
- **Smart Detection**: Monitors cumulative typing across sessions
- **Break Statistics**: Display current WPM, time, and character count during breaks
- **Resume Controls**: Continue button or Enter key to resume practice

#### 🌏 Multilingual Support

- **Multibyte Character Skip**: Automatic skip of Japanese, Chinese, Korean characters
- **ASCII Optimization**: Programming-focused character practice
- **Visual Distinction**: Dim display of non-target multibyte characters
- **International File Support**: Safe handling of multilingual code files

### 💾 Data Management

- **Local Storage**: All data saved securely in browser localStorage
- **Export/Import**: Complete backup and restore functionality with JSON format
- **Cross-Session Persistence**: Settings and statistics preserved between visits
- **365-Day Retention**: Standard browser storage retention period
- **Privacy First**: No external data transmission, completely offline-capable

## 🚀 Quick Start

### Option 1: Fork & Deploy (Recommended)

1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages** in repository Settings → Pages
3. **Access your deployment** at `https://yourusername.github.io/typingpra.github.io`

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/typingpra/typingpra.github.io.git
cd typingpra.github.io

# Serve locally using Python
python -m http.server 8080

# Or using Node.js
npx http-server -p 8080

# Access at http://localhost:8080
```

### Option 3: Download & Run

1. **Download** the repository as ZIP from GitHub
2. **Extract** files to your desired location
3. **Open** `index.html` in your web browser

## 📋 System Requirements

- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **JavaScript Enabled**: Required for all functionality
- **Local Storage**: For saving settings and statistics (no external dependencies)
- **File API Support**: For custom code file uploads
- **Canvas Support**: For interactive charts and graphs

## 🎯 How to Use

### Getting Started

1. **Select a Practice Mode**: Choose from 12 different practice types
2. **Configure Settings**: Adjust mode-specific parameters (word sets, trials, etc.)
3. **Start Typing**: Begin typing to match the displayed content - timer starts automatically
4. **Track Progress**: Monitor your WPM, accuracy, and mistakes in real-time
5. **Review Results**: View detailed statistics, rankings, and improvement suggestions

### Advanced Features

- **📊 Statistics**: Comprehensive analytics with interactive graphs and heatmaps
- **⚙️ Settings**: Theme switching, break configuration, countdown timers, and data management
- **📖 Help**: Complete feature guide with usage tips and keyboard shortcuts
- **🔧 Custom**: Practice with your own code files in Normal or TypeWell modes

### Keyboard Shortcuts

- **Esc**: Reset and restart from beginning
- **Enter** (during results): Continue to next page or finish session
- **r** (during results): Retry current page
- **R** (during results): Restart entire practice from beginning
- **Enter** (during break): Resume from auto-break

## 📚 Documentation

### Core Statistics Explained

- **WPM (Words Per Minute)**: Calculated from correctly typed characters (1 word = 5 characters)
- **Accuracy**: Percentage of correct keystrokes out of total attempts
- **Character Progress**: Real-time tracking of completion status with visual indicators
- **Reaction Time**: Millisecond-precise measurement for Initial Speed and Word Practice modes
- **Lap Times**: Line-by-line completion tracking for TypeWell modes

### Custom Code Guidelines

- **File Support**: Comprehensive format support for programming languages
- **Size Limit**: Maximum 1MB file size for optimal performance
- **Character Recommendations**: ASCII characters for optimal experience
- **Mode Selection**: Choose between Normal (flexible) and TypeWell (strict) modes
- **Encoding**: UTF-8 support with automatic multibyte character handling

## 🔧 Technical Details

### Architecture

- **Frontend Only**: Pure HTML5, CSS3, and JavaScript ES6+ - no backend required
- **Modular Design**: Clean separation of concerns across 11 JavaScript modules
- **Local Storage**: Browser-native storage for complete data persistence
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Responsive Design**: Mobile-first approach with desktop optimization

### Browser Storage

- **Settings**: Theme preferences, break configurations, countdown timers
- **Statistics**: Comprehensive practice history, TOP3 records, mistake character data
- **Custom Code**: Saved code snippets with mode information and metadata
- **Analytics Data**: Graph data, trend analysis, and performance metrics
- **Data Retention**: 365 days in browser localStorage with export capability

### JavaScript Module Structure

```
static/js/
├── chart.min.js      # Chart.js v3.9.1 (MIT License) - Interactive graphs
├── snippets.js       # Programming language code definitions (7 languages)
├── words.js          # NGSL English word database (2809 words, CC BY-SA 4.0)
├── constants.js      # Application constants and global state management
├── storage.js        # localStorage operations and data persistence
├── utils.js          # Utility functions, timing, and random generation
├── theme.js          # Theme management and CSS custom property handling
├── stats.js          # Statistics tracking, graph generation, and analytics
├── customCode.js     # Custom code management and file handling
├── typing.js         # Core typing functionality and mode logic
├── ui.js             # User interface management and event handling
└── main.js           # Application initialization and module coordination
```

### External Dependencies

- **Chart.js v3.9.1** (MIT License): Interactive chart rendering with canvas support
- **NGSL Word Database** (CC BY-SA 4.0): Scientific English vocabulary dataset

## 🎨 Customization

### Adding New Languages

1. Edit `static/js/snippets.js`
2. Add new language entry to `SNIPPETS` object with code samples
3. Update language dropdown in `index.html`
4. Test with both Normal and TypeWell modes

### Theme Modification

- Modify CSS custom properties in `static/style.css`
- Colors, fonts, and spacing all configurable via CSS variables
- Dynamic theme switching supported through JavaScript
- Graph colors automatically adapt to theme changes

### Feature Extension

- All JavaScript modules designed for easy extension and modification
- Add new practice modes by extending existing module patterns
- Statistics system supports new data types with minimal changes
- UI components follow consistent design patterns for easy customization

## 🤝 Contributing

Contributions are welcome! Please feel free to:

- **Report bugs** via GitHub Issues with detailed reproduction steps
- **Suggest new features** or improvements with use case descriptions
- **Submit pull requests** for enhancements following coding standards
- **Share feedback** and usage experiences to improve user experience
- **Translate** documentation or interface elements for broader accessibility

### Development Guidelines

- Follow existing code structure and naming conventions
- Test thoroughly across different browsers and devices
- Maintain backward compatibility with existing data formats
- Document new features and API changes comprehensively
- Consider performance impact, especially for mobile devices

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

### Third-party Licenses

- **Chart.js v3.9.1**: MIT License
- **NGSL Word Database**: CC BY-SA 4.0 License

## 🙏 Acknowledgments

- **TypeWell Software**: Inspiration for strict typing practice methodology
- **New General Service List (NGSL)**: High-quality English vocabulary database
- **Chart.js Team**: Excellent charting library with extensive customization options
- **GitHub Pages**: Free hosting platform enabling easy deployment and sharing
- **Open Source Community**: Continuous inspiration and best practices

---

<div align="center">

**Made with ❤️ for developers and language learners who want to master their typing skills**

🚀 [**Start Practicing Now**](https://typingpra.github.io) 🚀

</div>
