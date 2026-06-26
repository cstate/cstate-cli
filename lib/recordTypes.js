const recordTypes = [
	{
		templateName: 'Experiment',
		label: 'Experiment',
		section: 'experiments',
		recordType: 'experiment',
		defaultState: 'active',
		template: 'experiment.md',
	},
	{
		templateName: 'Release Note',
		label: 'Release Note',
		section: 'release-notes',
		recordType: 'release-note',
		template: 'release-note.md',
	},
	{
		templateName: 'Changelog Entry',
		label: 'Changelog Entry',
		section: 'changelog',
		recordType: 'changelog',
		template: 'changelog.md',
	},
	{
		templateName: 'Roadmap Update',
		label: 'Roadmap Update',
		section: 'roadmap',
		recordType: 'roadmap',
		defaultState: 'active',
		template: 'roadmap.md',
	},
	{
		templateName: 'Eval Report',
		label: 'Eval Report',
		section: 'evals',
		recordType: 'eval-report',
		defaultState: 'completed',
		template: 'eval-report.md',
	},
	{
		templateName: 'Agent Run',
		label: 'Agent Run',
		section: 'agent-runs',
		recordType: 'agent-run',
		defaultState: 'completed',
		template: 'agent-run.md',
	},
	{
		templateName: 'Decision Record',
		label: 'Decision Record',
		section: 'decisions',
		recordType: 'decision',
		defaultState: 'completed',
		template: 'decision.md',
	},
	{
		templateName: 'Research Note',
		label: 'Research Note',
		section: 'research',
		recordType: 'research-note',
		defaultState: 'completed',
		template: 'research-note.md',
	},
];

function findRecordType(value) {
	return recordTypes.find((recordType) => {
		return [
			recordType.templateName,
			recordType.label,
			recordType.section,
			recordType.recordType,
		].includes(value);
	});
}

export { recordTypes, findRecordType };
