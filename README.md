# Typing Practice App

<div align="center">

🎯 **A modern typing practice application for programmers**

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation)

</div>

## 🌟 Overview

A specialized typing practice application designed for programming languages, featuring real-time statistics, custom code support, and advanced practice modes. Built as a static web application and hosted on GitHub Pages.

## ✨ Features

### 🎯 Core Features

- **9 Programming Languages**: Python, JavaScript, Java, C, C++, Rust, Lua, TypeWell Original, Custom
- **Real-time Statistics**: WPM, accuracy, and detailed performance tracking
- **Custom Code Practice**: Import your own code files or paste custom content
- **Page-based Learning**: Long code automatically split into manageable 20-line pages
- **Multiple Practice Modes**: Normal (with corrections) and TypeWell (strict, no backspace)

### 📊 Advanced Analytics

- **Mistake Character Analysis**: Track and analyze your most frequently mistyped characters
- **TOP3 Rankings**: Personal best records with rank-in detection
- **Detailed Statistics**: Comprehensive practice history by language and page
- **Session Tracking**: Monitor progress across multiple practice sessions

### 🎨 Customization & Comfort

- **Dark/Light Themes**: Eye-friendly themes for any environment
- **Auto Break System**: Configurable break reminders to prevent fatigue
- **Text Wrap Support**: Handle long lines with automatic wrapping
- **Multibyte Character Skip**: Automatically skip non-ASCII characters for pure coding practice

### ⌨️ TypeWell Original Mode

- **Random Character Practice**: 360 characters across 10 lines
- **3 Difficulty Levels**: Lowercase only / Mixed case / With symbols
- **Dynamic Generation**: New random content every session
- **Configurable Countdown**: Customizable start delay (0-3 seconds)

### 💾 Data Management

- **Local Storage**: All data saved locally in your browser
- **Export/Import**: Backup and restore your progress and settings
- **Cross-Session Persistence**: Settings and statistics preserved between visits

## 🚀 Quick Start

### Option 1: Fork & Deploy

1. **Fork this repository**
2. **Enable GitHub Pages** in repository Settings
3. **Access your deployment** at your GitHub Pages URL

### Option 2: Local Development

```bash
# Clone the repository
git clone [REPOSITORY_URL]
cd typing-practice

# Serve locally (Python 3)
python -m http.server 8080

# Access at http://localhost:8080
```

### Option 3: Download & Run

1. **Download** the repository as ZIP
2. **Extract** files to your desired location
3. **Open** `index.html` in your web browser

## 📋 System Requirements

- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge
- **JavaScript Enabled**: Required for all functionality
- **Local Storage**: For saving settings and statistics

## 🎯 How to Use

### Getting Started

1. **Select a Language**: Choose from 9 programming languages or create custom content
2. **Start Typing**: Begin typing to match the displayed code - timer starts automatically
3. **Track Progress**: Monitor your WPM, accuracy, and mistakes in real-time
4. **Review Results**: View detailed statistics and TOP3 rankings after completion

### Advanced Features

- **Custom Code**: Click "Custom" to practice with your own code files
- **Settings**: Access theme, break settings, and other preferences via ⚙️ Settings
- **Statistics**: Review detailed practice history via 📊 Stats
- **Help**: Comprehensive guide available via 📖 Help

### Practice Modes

- **Normal Mode**: Standard typing with backspace corrections allowed
- **TypeWell Mode**: Strict practice - stop on mistakes, no backspace allowed
- **TypeWell Original**: Random character generation with 3 difficulty levels

## 📚 Documentation

### Core Statistics

- **WPM (Words Per Minute)**: Calculated from correctly typed characters (1 word = 5 characters)
- **Accuracy**: Percentage of correct keystrokes out of total attempts
- **Character Progress**: Real-time tracking of completion status
- **Mistake Analysis**: Detailed breakdown of frequently mistyped characters

### Keyboard Shortcuts

- **Esc**: Reset and restart from beginning
- **Enter** (during results): Continue to next page or finish
- **r** (during results): Retry current page
- **R** (during results): Restart all from beginning
- **Enter** (during break): Resume from auto-break

### Custom Code Guidelines

- **File Support**: .txt, .js, .py, .c, .cpp, .java, .rs, .lua, .md, .json, .html, .css
- **Size Limit**: 1MB maximum file size
- **Character Support**: ASCII characters recommended for optimal experience
- **Mode Selection**: Choose Normal or TypeWell mode when saving custom code

## 🔧 Technical Details

### Architecture

- **Frontend Only**: Pure HTML, CSS, and JavaScript - no backend required
- **Modular Design**: Clean separation of concerns across multiple JS modules
- **Local Storage**: Browser-native storage for data persistence
- **Responsive Design**: Works on desktop and tablet devices

### Browser Storage

- **Settings**: Theme preferences, break configurations, countdown timers
- **Statistics**: Practice history, TOP3 records, mistake character data
- **Custom Code**: Saved code snippets with mode information
- **Data Retention**: 365 days in browser localStorage

### File Structure

```
typing-practice/
├── index.html           # Main application entry point
├── static/
│   ├── style.css       # Application styles and themes
│   └── js/             # JavaScript modules
│       ├── snippets.js # Programming language definitions
│       ├── constants.js# App constants and configuration
│       ├── storage.js  # Data persistence layer
│       ├── utils.js    # Utility functions
│       ├── theme.js    # Theme management
│       ├── stats.js    # Statistics tracking
│       ├── customCode.js# Custom code management
│       ├── typing.js   # Core typing functionality
│       ├── ui.js       # User interface management
│       └── main.js     # Application initialization
└── README.md           # This documentation
```

## 🎨 Customization

### Adding New Languages

1. Edit `static/js/snippets.js`
2. Add new language entry to `SNIPPETS` object
3. Update language dropdown in `index.html`

### Theme Modification

- Modify CSS custom properties in `static/style.css`
- Colors, fonts, and spacing all configurable via CSS variables

### Feature Extension

- All JavaScript modules designed for easy extension
- Add new practice modes, statistics, or UI features by extending existing modules

## 🤝 Contributing

Contributions are welcome! Please feel free to:

- Report bugs via GitHub Issues
- Suggest new features or improvements
- Submit pull requests for enhancements
- Share feedback and usage experiences

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by traditional typing practice applications
- Built with modern web technologies for optimal performance
- Designed with programmer productivity and learning in mind

---

<div align="center">

Made with ❤️ for developers who want to improve their coding speed and accuracy

</div>
