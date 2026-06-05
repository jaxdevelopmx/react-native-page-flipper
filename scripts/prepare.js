const { execSync } = require('child_process');

// Git/tarball installs should not compile the package in the consumer project.
// Metro uses the `react-native` field (`src/index`) at runtime.
const isConsumerInstall =
    process.env.INIT_CWD && process.env.INIT_CWD !== process.cwd();

if (isConsumerInstall) {
    process.exit(0);
}

try {
    const bobBin = require.resolve('react-native-builder-bob/bin/bob');
    execSync(`node "${bobBin}" build`, { stdio: 'inherit' });
} catch {
    process.exit(0);
}
