/**
 * The word the list hands to the "New word" tab when Edit is picked. It travels as a
 * navigation param rather than through shared state, so the tab that has to prefill the
 * form is told about it by the same call that brings it into view.
 */
export type EditRequest = {
	id: number;
	word: string;
	transliteration: string;
	translation: string;
};

export type TabParamList = {
	index: undefined;
	explore: { edit?: EditRequest } | undefined;
};
