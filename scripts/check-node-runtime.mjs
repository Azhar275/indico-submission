const INDEX_URL = 'https://nodejs.org/dist/index.json';
const current = process.version;
const major = current.split('.')[0];

const parse = (version) => version.slice(1).split('.').map(Number);
const isNewer = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i += 1) {
    if (x[i] !== y[i]) return x[i] > y[i];
  }
  return false;
};

const releases = await (await fetch(INDEX_URL)).json();
const sameLine = releases.filter((release) => release.version.startsWith(`${major}.`));
const missed = sameLine.filter((release) => release.security && isNewer(release.version, current));

console.log(`Node.js runtime in image: ${current}`);
console.log(`Latest ${major}.x release: ${sameLine[0].version} (${sameLine[0].date})`);

if (missed.length > 0) {
  const list = missed.map((release) => `${release.version} (${release.date})`).join(', ');
  console.log(`FAIL: newer security release(s) on ${major}.x not applied: ${list}`);
  console.log(`Rebuild on ${missed[0].version} or later.`);
  process.exit(1);
}

console.log(`PASS: no newer security release on ${major}.x`);
