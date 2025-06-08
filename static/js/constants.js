// constants.js - アプリケーション全体で使用する定数

const CONSTANTS = {
	// ページング設定
	LINES_PER_PAGE: 20,
	MAX_DISPLAY_LINES: 40,
	CHARS_PER_PAGE: 800, // 1ページあたりの最大文字数制限
	NEWLINE_CHAR_COUNT: 1, // 改行文字のカウント数

	// テキストラップ設定
	TEXT_WRAP: {
		MAX_WIDTH: 80, // 文字数での折り返し設定
		ENABLED: false, // デフォルトは無効
	},

	// 休憩機能設定
	BREAK_SETTINGS: {
		DEFAULT_CHARS: 0, // デフォルトは休憩なし（0文字）
		MIN_CHARS: 0, // 最小値（0以下で無効化）
		MAX_CHARS: 10000, // 最大値
	},

	// タイプウェル設定
	TYPEWELL_SETTINGS: {
		COUNTDOWN_DURATION: 3, // カウントダウン時間（秒）
		MIN_COUNTDOWN: 0, // 最小秒数
		MAX_COUNTDOWN: 3, // 最大秒数
		DEFAULT_COUNTDOWN: 3, // デフォルト値
	},

	// Initial Speed設定
	INITIAL_SPEED_SETTINGS: {
		MODES: {
			LOWERCASE: "lowercase",
			NUMBERS: "numbers",
		},
		CHARACTER_SETS: {
			lowercase: "abcdefghijklmnopqrstuvwxyz,.",
			numbers: "0123456789",
		},
		MIN_TRIALS: 5,
		MAX_TRIALS: 20,
		DEFAULT_TRIALS: 10,
		WAITING_TIME: 1000, // 待機時間（ミリ秒）
		PROGRESS_DELAY: 1000, // 進捗表示時間（ミリ秒）
	},

	// ストレージキー
	STORAGE_KEYS: {
		THEME: "typingPracticeTheme",
		CODES: "typingPracticeCodes",
		RESULTS: "typingPracticeResults",
		MISTAKE_CHARS: "typingPracticeMistakeChars",
		TEXT_WRAP: "typingPracticeTextWrap",
		BREAK_CHARS: "typingPracticeBreakChars", // 休憩設定のキー
		TYPEWELL_COUNTDOWN: "typingPracticeTypewellCountdown", // 追加
		INITIAL_SPEED_MISTAKES: "typingPracticeInitialSpeedMistakes", // Initial Speed専用ミス統計
	},

	// SNIPPETSはsnippets.jsに移動
	get SNIPPETS() {
		return SNIPPETS;
	},
};

// グローバル変数の初期化
const APP_STATE = {
	// ページング関連
	allLines: [],
	pages: [],
	currentPage: 0,

	// タイピング関連
	inputBuffer: "",
	startTime: null,
	timerInterval: null,
	totalKeystrokes: 0,
	errorCount: 0,
	correctCharacters: 0,
	maxCorrectPosition: 0,
	currentMistakes: [], // 現在のセッションのミス文字

	// 休憩機能関連
	currentLineCharCount: 0, // 現在の行の文字数
	isBreakActive: false, // 休憩中かどうか

	// タイプウェルモード専用状態
	typewellState: "waiting", // "waiting", "countdown", "typing"
	countdownTimer: null,
	countdownValue: 0,
	typewellLineTimes: [], // 行ごとのラップタイム記録
	typewellCurrentLine: 0, // 現在の行番号

	// Initial Speed専用状態
	initialSpeedState: "waiting", // "waiting", "starting", "ready", "practicing", "between", "completed"
	initialSpeedTimer: null,
	initialSpeedCurrentTrial: 0,
	initialSpeedTotalTrials: 10,
	initialSpeedMode: "lowercase",
	initialSpeedCurrentChar: "",
	initialSpeedStartTime: null,
	initialSpeedResults: [], // 詳細結果
	initialSpeedCurrentMistakes: [], // Initial Speed専用ミス記録
	initialSpeedConsecutiveMisses: 0, // 連続ミス回数

	// UI状態
	isDarkMode: true,
	isTextWrapEnabled: false, // テキストラップ状態
	currentSort: {},
	deleteConfirmationStep: 1, // 削除確認のステップ
};

// DOM要素のキャッシュ
const DOM = {};

// DOM要素の初期化（main.jsから呼び出される）
function initializeDOMElements() {
	DOM.codeEl = document.getElementById("code");
	DOM.langSel = document.getElementById("language");
	DOM.toggleCustomBtn = document.getElementById("toggle-custom");
	DOM.customContainer = document.getElementById("custom-container");
	DOM.customCodeArea = document.getElementById("custom-code");
	DOM.timerEl = document.getElementById("timer");
	DOM.wpmEl = document.getElementById("wpm");
	DOM.accEl = document.getElementById("acc");
	DOM.progressEl = document.getElementById("progress");
	DOM.progressTextEl = document.getElementById("progress-text");
	DOM.pageSelectEl = document.getElementById("page-select");
	DOM.overlay = document.getElementById("overlay");
	DOM.nextBtn = document.getElementById("next-btn");
	DOM.retryBtn = document.getElementById("retry-btn");
	DOM.restartBtn = document.getElementById("restart-btn");
	DOM.customNameInput = document.getElementById("custom-name");
	DOM.saveCustomBtn = document.getElementById("save-custom");
	DOM.savedCodesSelect = document.getElementById("saved-codes");
	DOM.loadCustomBtn = document.getElementById("load-custom");
	DOM.deleteCustomBtn = document.getElementById("delete-custom");
	DOM.fileInput = document.getElementById("file-input");
	DOM.chooseFileBtn = document.getElementById("choose-file-btn");
	DOM.settingsBtn = document.getElementById("settings-btn");
	DOM.settingsPanel = document.getElementById("settings-panel");
	DOM.closeSettingsBtn = document.getElementById("close-settings");
	DOM.themeToggleBtn = document.getElementById("theme-toggle");
	DOM.darkLabel = document.getElementById("dark-label");
	DOM.lightLabel = document.getElementById("light-label");
	DOM.textWrapToggleBtn = document.getElementById("text-wrap-toggle");
	DOM.wrapEnabledLabel = document.getElementById("wrap-enabled-label");
	DOM.wrapDisabledLabel = document.getElementById("wrap-disabled-label");
	DOM.statsBtn = document.getElementById("stats-btn");
	DOM.statsPanel = document.getElementById("stats-panel");
	DOM.closeStatsBtn = document.getElementById("close-stats");
	DOM.clearStatsBtn = document.getElementById("clear-stats");
	DOM.helpBtn = document.getElementById("help-btn");
	DOM.helpPanel = document.getElementById("help-panel");
	DOM.closeHelpBtn = document.getElementById("close-help");
	DOM.exportDataBtn = document.getElementById("export-data-btn");
	DOM.importDataBtn = document.getElementById("import-data-btn");
	DOM.importFileInput = document.getElementById("import-file-input");
	DOM.deleteAllDataBtn = document.getElementById("delete-all-data-btn");
	DOM.deleteConfirmationDialog = document.getElementById(
		"delete-confirmation-dialog",
	);
	DOM.deleteDialogTitle = document.getElementById("delete-dialog-title");
	DOM.deleteDialogMessage = document.getElementById("delete-dialog-message");
	DOM.deleteWarningDetails = document.getElementById("delete-warning-details");
	DOM.deleteCancelBtn = document.getElementById("delete-cancel-btn");
	DOM.deleteProceedBtn = document.getElementById("delete-proceed-btn");

	// 休憩機能関連のDOM要素
	DOM.breakCharsInput = document.getElementById("break-chars-input");
	DOM.breakDialog = document.getElementById("break-dialog");
	DOM.breakResumeBtn = document.getElementById("break-resume-btn");
	DOM.breakWpmEl = document.getElementById("break-wpm");
	DOM.breakTimeEl = document.getElementById("break-time");
	DOM.breakCharsEl = document.getElementById("break-chars");

	// カスタムコードモード選択関連のDOM要素
	DOM.customNormalRadio = document.getElementById("custom-normal");
	DOM.customTypewellRadio = document.getElementById("custom-typewell");

	// TypeWell関連のDOM要素
	DOM.typewellContainer = document.getElementById("typewell-container");
	DOM.typewellLowercaseRadio = document.getElementById("typewell-lowercase");
	DOM.typewellMixedRadio = document.getElementById("typewell-mixed");
	DOM.typewellSymbolsRadio = document.getElementById("typewell-symbols");
	DOM.typewellNumbersRadio = document.getElementById("typewell-numbers");

	// タイプウェルスタート画面関連のDOM要素
	DOM.typewellStartScreen = document.getElementById("typewell-start-screen");
	DOM.typewellCountdown = document.getElementById("typewell-countdown");
	DOM.typewellStartButton = document.getElementById("typewell-start-button"); // 追加

	// Initial Speed関連のDOM要素
	DOM.initialSpeedContainer = document.getElementById(
		"initial-speed-container",
	);
	DOM.initialSpeedLowercaseRadio = document.getElementById(
		"initial-speed-lowercase",
	);
	DOM.initialSpeedNumbersRadio = document.getElementById(
		"initial-speed-numbers",
	);
	DOM.initialSpeedTrialsSelect = document.getElementById(
		"initial-speed-trials",
	);
	DOM.initialSpeedStartScreen = document.getElementById(
		"initial-speed-start-screen",
	);
	DOM.initialSpeedStartButton = document.getElementById(
		"initial-speed-start-button",
	);
	DOM.initialSpeedPracticeScreen = document.getElementById(
		"initial-speed-practice-screen",
	);
	DOM.initialSpeedStatus = document.getElementById("initial-speed-status");
	DOM.initialSpeedCharacter = document.getElementById(
		"initial-speed-character",
	);
	DOM.initialSpeedProgress = document.getElementById("initial-speed-progress");
	DOM.initialSpeedTrialsDisplay = document.getElementById(
		"initial-speed-trials-display",
	);
	DOM.initialSpeedCurrentMode = document.getElementById(
		"initial-speed-current-mode",
	);
	DOM.initialSpeedResults = document.getElementById("initial-speed-results");
	DOM.initialSpeedModeInfo = document.getElementById("initial-speed-mode-info");
	DOM.initialSpeedTrialsInfo = document.getElementById(
		"initial-speed-trials-info",
	);
	DOM.initialSpeedSummary = document.getElementById("initial-speed-summary");
	DOM.initialSpeedDetailedResults = document.getElementById(
		"initial-speed-detailed-results",
	);

	// 追加: タイプウェルカウントダウン入力フィールド
	DOM.typewellCountdownInput = document.getElementById(
		"typewell-countdown-input",
	);
}
