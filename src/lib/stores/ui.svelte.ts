interface UiState {
	searchQuery: string;
	activeGroup: string | null;
	showChangedOnly: boolean;
	showRawKeys: boolean;
	isLoading: boolean;
	error: string | null;
	sidebarOpen: boolean;
}

interface FilteredResults {
	matchingPaths: Set<string>;
	hasResults: boolean;
}

class UiStore {
	// Core UI state using Svelte 5 runes
	private state = $state<UiState>({
		searchQuery: '',
		activeGroup: null,
		showChangedOnly: false,
		showRawKeys: false,
		isLoading: false,
		error: null,
		sidebarOpen: true
	});

	// Derived filtered results based on search
	private filtered = $derived<FilteredResults>(() => {
		const query = this.state.searchQuery.toLowerCase().trim();

		if (!query) {
			return {
				matchingPaths: new Set(),
				hasResults: true
			};
		}

		// This will be populated by the search logic
		// For now, return empty results
		const matchingPaths = new Set<string>();

		return {
			matchingPaths,
			hasResults: matchingPaths.size > 0 || !query
		};
	});

	// Getters for reactive access
	get searchQuery() {
		return this.state.searchQuery;
	}
	get activeGroup() {
		return this.state.activeGroup;
	}
	get showChangedOnly() {
		return this.state.showChangedOnly;
	}
	get showRawKeys() {
		return this.state.showRawKeys;
	}
	get isLoading() {
		return this.state.isLoading;
	}
	get error() {
		return this.state.error;
	}
	get sidebarOpen() {
		return this.state.sidebarOpen;
	}
	get matchingPaths() {
		return this.filtered.matchingPaths;
	}
	get hasSearchResults() {
		return this.filtered.hasResults;
	}

	// Actions
	setSearchQuery(query: string): void {
		this.state.searchQuery = query;
	}

	clearSearch(): void {
		this.state.searchQuery = '';
	}

	setActiveGroup(group: string | null): void {
		this.state.activeGroup = group;
	}

	toggleChangedOnly(): void {
		this.state.showChangedOnly = !this.state.showChangedOnly;
	}

	setShowChangedOnly(show: boolean): void {
		this.state.showChangedOnly = show;
	}

	toggleRawKeys(): void {
		this.state.showRawKeys = !this.state.showRawKeys;
	}

	setShowRawKeys(show: boolean): void {
		this.state.showRawKeys = show;
	}

	setLoading(loading: boolean): void {
		this.state.isLoading = loading;
	}

	setError(error: string | null): void {
		this.state.error = error;
	}

	clearError(): void {
		this.state.error = null;
	}

	toggleSidebar(): void {
		this.state.sidebarOpen = !this.state.sidebarOpen;
	}

	setSidebarOpen(open: boolean): void {
		this.state.sidebarOpen = open;
	}

	// Search functionality that will be used with settings store
	searchFields(paths: string[], docsMap: Record<string, string>, query: string): Set<string> {
		const normalizedQuery = query.toLowerCase().trim();
		// Require at least 2 characters for search
		if (!normalizedQuery || normalizedQuery.length < 2) return new Set();

		const matchingPaths = new Set<string>();

		for (const path of paths) {
			// Search in path
			if (path.toLowerCase().includes(normalizedQuery)) {
				matchingPaths.add(path);
				continue;
			}

			// Search in documentation
			const docs = docsMap[path];
			if (docs && docs.toLowerCase().includes(normalizedQuery)) {
				matchingPaths.add(path);
				continue;
			}

			// Search in field labels (derived from path)
			const label = this._pathToLabel(path);
			if (label.toLowerCase().includes(normalizedQuery)) {
				matchingPaths.add(path);
			}
		}

		return matchingPaths;
	}

	// Convert JSON path to human-readable label
	private _pathToLabel(path: string): string {
		return path
			.split('.')
			.map((part) => part.replace(/[_-]/g, ' '))
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' › ');
	}
}

// Export singleton instance
export const uiStore = new UiStore();
