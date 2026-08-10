import { ensureFleetAssets } from './ensureFleetAssets.js';

async function main() {
  const result = await ensureFleetAssets();
  console.log(result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
