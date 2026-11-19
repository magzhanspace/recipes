#!/bin/sh
# Build the committed HEAD on this machine and roll it out to hermes.
#
#   scripts/deploy.sh            deploy HEAD
#   scripts/deploy.sh rollback   point `current` back at the previous release
#
# Layout on hermes (same as finance-labs):
#   /home/magzhan/apps/recipes/releases/<sha>   standalone Next server
#   /home/magzhan/apps/recipes/current          symlink, used by recipes.service
set -eu

HOST=${DEPLOY_HOST:-hermes}
APP=/home/magzhan/apps/recipes
KEEP=5

if [ "${1:-}" = rollback ]; then
   ssh "$HOST" "set -e; cd $APP/releases; prev=\$(ls -1t | sed -n 2p); test -n \"\$prev\";
      ln -sfn $APP/releases/\$prev $APP/current.new && mv -Tf $APP/current.new $APP/current;
      chown -h magzhan:magzhan $APP/current; systemctl restart recipes.service; echo rolled back to \$prev"
   exit 0
fi

cd "$(dirname "$0")/.."
if [ -n "$(git status --porcelain)" ]; then
   echo "Commit or stash your changes first: only committed code is deployed." >&2
   exit 1
fi
SHA=$(git rev-parse --short HEAD)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

git archive HEAD | tar -x -C "$WORK"
cp -a node_modules "$WORK/"
(cd "$WORK" && NEXT_TELEMETRY_DISABLED=1 npx -y pnpm@9 build)
cp -a "$WORK/.next/static" "$WORK/.next/standalone/.next/static"
[ -d "$WORK/public" ] && cp -a "$WORK/public" "$WORK/.next/standalone/public"
# Built on macOS: drop the darwin image binary (the image optimiser is off anyway).
rm -rf "$WORK"/.next/standalone/node_modules/.pnpm/@img+sharp-darwin*
echo "$SHA" > "$WORK/.next/standalone/RELEASE"
COPYFILE_DISABLE=1 tar -czf "$WORK/release.tgz" -C "$WORK/.next/standalone" .

scp -q "$WORK/release.tgz" "$HOST:/tmp/recipes-$SHA.tgz"
ssh "$HOST" "set -e
   R=$APP/releases/$SHA
   rm -rf \$R; install -d -o magzhan -g magzhan \$R
   tar -xzf /tmp/recipes-$SHA.tgz -C \$R 2>/dev/null; rm /tmp/recipes-$SHA.tgz
   install -d \$R/.next/cache; chown -R magzhan:magzhan \$R
   ln -sfn \$R $APP/current.new && mv -Tf $APP/current.new $APP/current
   chown -h magzhan:magzhan $APP/current
   systemctl restart recipes.service
   for i in 1 2 3 4 5 6 7 8 9 10; do
      code=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3120/login) && [ \"\$code\" = 200 ] && break; sleep 1
   done
   [ \"\$code\" = 200 ] || { echo 'recipes did not come up; run: scripts/deploy.sh rollback' >&2; exit 1; }
   cd $APP/releases && ls -1t | tail -n +$((KEEP + 1)) | xargs -r rm -rf
   echo deployed $SHA"
