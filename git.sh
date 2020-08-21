#/bin/sh

# Fetch the newest code
git fetch master

# Hard reset
git reset --hard master

# Force pull
git pull master --force

npm run build
