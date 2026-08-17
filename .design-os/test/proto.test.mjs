import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeTokensIntoCss,
  extractTokensFromMarkdown,
} from '../lib/proto-brand.mjs';
import {
  renderRationaleMd,
  appCopyFromBrief,
} from '../lib/proto-prd.mjs';
import { prototypeRelPath } from '../lib/proto-git.mjs';

describe('proto-brand token mapping', () => {
  it('maps type-scale and spacing vars without color prefix', () => {
    const md = `
## Type scale
- --text-lg: 1.25rem
- --text-2xl: 2rem

## Spacing
- --space-4: 1.125rem
- --space-6: 1.75rem
- --space-8: 2.25rem

## Colors
- primary: #0ea5e9
`;
    const tokens = extractTokensFromMarkdown(md);
    assert.equal(tokens.get('--text-lg'), '1.25rem');
    assert.equal(tokens.get('--text-2xl'), '2rem');
    assert.equal(tokens.get('--space-4'), '1.125rem');
    assert.equal(tokens.get('--space-6'), '1.75rem');
    assert.equal(tokens.get('--space-8'), '2.25rem');
    assert.equal(tokens.get('--color-primary'), '#0ea5e9');
  });
});

describe('mergeTokensIntoCss', () => {
  const baseCss = `:root {
  --text-lg: 1.125rem;
  --space-4: 1rem;
  --color-primary: #2563eb;
}`;

  it('overwrites matching custom properties', () => {
    const parsed = new Map([
      ['--text-lg', '1.25rem'],
      ['--space-4', '1.125rem'],
      ['--color-primary', '#0ea5e9'],
    ]);
    const out = mergeTokensIntoCss(baseCss, parsed);
    assert.match(out, /--text-lg:\s*1\.25rem/);
    assert.match(out, /--space-4:\s*1\.125rem/);
    assert.match(out, /--color-primary:\s*#0ea5e9/);
  });
});

describe('proto-prd extraction', () => {
  it('builds rationale and app copy from PRD sections', () => {
    const brief = {
      problem: 'Operations managers lose track of handoffs when approvals span three tools.',
      userGoal: 'Complete an approval without switching tabs or losing context.',
      businessGoal: 'Reduce approval cycle time by 20% in Q3.',
      constraints: '- Offline reviewers must see pending state when they reconnect.',
      users: '',
      source: 'prd',
    };

    const rationale = renderRationaleMd(brief, 'acme-north', 'handoff-hub');
    assert.match(rationale, /Operations managers lose track/);
    assert.match(rationale, /Complete an approval/);
    assert.match(rationale, /Reduce approval cycle time/);

    const copy = appCopyFromBrief(brief, 'handoff-hub');
    assert.match(copy.__PRD_HEADLINE__, /Operations managers/);
    assert.match(copy.__PRD_LEDE__, /Complete an approval/);
    assert.doesNotMatch(copy.__PRD_HEADLINE__, /Replace this screen/);
  });
});

describe('prototypeRelPath', () => {
  it('scopes force-add path to one feature', () => {
    assert.equal(prototypeRelPath('acme-north', 'checkout'), 'projects/acme-north/prototypes/checkout');
  });
});
