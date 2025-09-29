import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

class ThemeStore {
	private _theme = $state<Theme>('system');
	private _resolvedTheme = $state<'light' | 'dark'>('light');

	constructor() {
		if (browser) {
			// Load saved theme from localStorage
			const saved = localStorage.getItem('theme') as Theme;
			if (saved && ['light', 'dark', 'system'].includes(saved)) {
				this._theme = saved;
			}

			// Set up system theme detection
			this.updateResolvedTheme();
			this.setupSystemThemeListener();
			this.applyTheme();
		}
	}

	get theme() {
		return this._theme;
	}

	get resolvedTheme() {
		return this._resolvedTheme;
	}

	get isDark() {
		return this._resolvedTheme === 'dark';
	}

	setTheme(theme: Theme) {
		this._theme = theme;
		if (browser) {
			localStorage.setItem('theme', theme);
			this.updateResolvedTheme();
			this.applyTheme();
		}
	}

	toggleTheme() {
		if (this._theme === 'light') {
			this.setTheme('dark');
		} else if (this._theme === 'dark') {
			this.setTheme('system');
		} else {
			this.setTheme('light');
		}
	}

	private updateResolvedTheme() {
		if (this._theme === 'system') {
			this._resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
		} else {
			this._resolvedTheme = this._theme;
		}
	}

	private setupSystemThemeListener() {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', () => {
			if (this._theme === 'system') {
				this.updateResolvedTheme();
				this.applyTheme();
			}
		});
	}

	private applyTheme() {
		const root = document.documentElement;
		if (this._resolvedTheme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
	}
}

export const themeStore = new ThemeStore();
