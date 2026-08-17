/**
 * design proto — prototype branch lifecycle.
 * Vendor prototype templates are not included in this starter.
 */

function usage() {
  console.log(`
design proto — prototype branches (not included in this starter)

Usage:
  design proto --help

This community starter does not ship vendor prototype scaffolds.
Use the daily machine instead:

  design vibe <slug>          Generic HTML + Tailwind vibe brief
  design vibe-check <slug>    Analyze a stakeholder prototype

If you add your own proto_branches later, keep templates under
.design-os/templates/ and document them in the project README.
`);
}

export async function run(args) {
  console.log('\n🔀 design proto\n');

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    usage();
    return;
  }

  console.log('Prototype scaffolding is not included in this starter.');
  console.log('');
  console.log('This repo ships the daily machine (init, ingest, review, evaluate,');
  console.log('vibe, comment, doctor, knowledge) without vendor prototype templates.');
  console.log('Generate a generic brief with: design vibe <slug>');
  console.log('');
}
