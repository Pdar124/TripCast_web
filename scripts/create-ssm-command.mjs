import process from 'node:process';

const quote = (value) => `'${value.replaceAll("'", `'"'"'`)}'`;
const required = [
  'AWS_REGION',
  'BACKEND_UPSTREAM',
  'DEPLOY_SCRIPT_BASE64',
  'GHCR_TOKEN_PARAMETER',
  'GHCR_USERNAME',
  'IMAGE_REFERENCE',
  'REMOTE_SCRIPT',
  'WEB_PORT',
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`missing environment variable: ${name}`);
  }
}

const command = [
  'set -eu',
  `remote_script=${quote(process.env.REMOTE_SCRIPT)}`,
  'trap \'rm -f "$remote_script"\' EXIT',
  `printf '%s' ${quote(process.env.DEPLOY_SCRIPT_BASE64)} | base64 --decode > "$remote_script"`,
  'chmod 700 "$remote_script"',
  [
    `AWS_REGION=${quote(process.env.AWS_REGION)}`,
    `AWS_DEFAULT_REGION=${quote(process.env.AWS_REGION)}`,
    `GHCR_TOKEN_PARAMETER=${quote(process.env.GHCR_TOKEN_PARAMETER)}`,
    `GHCR_USERNAME=${quote(process.env.GHCR_USERNAME)}`,
    '"$remote_script"',
    quote(process.env.IMAGE_REFERENCE),
    quote(process.env.WEB_PORT),
    quote(process.env.BACKEND_UPSTREAM),
  ].join(' '),
].join('\n');

process.stdout.write(JSON.stringify({ commands: [command] }));
