const {rules} = require('.');

jest.unmock('.');

const subjectImperative = rules['subject-imperative'];
const subjectImperativeText = 'subject must be in imperative mood';

describe('plugin', () => {
	describe('subject-imperative', () => {
		it('returns true if the subject is in imperative mood', () => {
			expect(subjectImperative({subject: 'ADD foo'})).toEqual([true, subjectImperativeText]);
			expect(subjectImperative({subject: 'always do foo'})).toEqual([true, subjectImperativeText]);
			expect(subjectImperative({subject: 'Bring foo'})).toEqual([true, subjectImperativeText]);
			expect(subjectImperative({subject: 'embed foo'})).toEqual([true, subjectImperativeText]);
			expect(subjectImperative({subject: 'PASS foo'})).toEqual([true, subjectImperativeText]);
			expect(subjectImperative({subject: 'Process foo'})).toEqual([true, subjectImperativeText]);
			expect(subjectImperative({subject: "DON'T add foo"})).toEqual([true, subjectImperativeText]);
			expect(subjectImperative({subject: 'do not add foo'})).toEqual([true, subjectImperativeText]);
		});

		it('returns false if the subject is not in imperative mood', () => {
			expect(subjectImperative({subject: 'ADDED foo'})).toEqual([false, subjectImperativeText]);
			expect(subjectImperative({subject: 'Bringing foo'})).toEqual([false, subjectImperativeText]);
			expect(subjectImperative({subject: 'embedded foo'})).toEqual([false, subjectImperativeText]);
			expect(subjectImperative({subject: 'PASSES foo'})).toEqual([false, subjectImperativeText]);
			expect(subjectImperative({subject: 'Processes foo'})).toEqual([false, subjectImperativeText]);
			expect(subjectImperative({subject: "DON'T added foo"})).toEqual([false, subjectImperativeText]);
			expect(subjectImperative({subject: 'do not added foo'})).toEqual([false, subjectImperativeText]);
			expect(subjectImperative({subject: '1234'})).toEqual([false, subjectImperativeText]);
		});
	});
});
