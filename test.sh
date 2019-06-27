#!/usr/bin/env bash

set -e
set -u
set -o pipefail

SERVICES="lambda:4569" docker-compose -f test/docker-compose.yml up -d

(cd test/lambda && zip ../lambda.zip *)

aws --endpoint-url=http://localhost:4569 lambda create-function \
    --region us-east-1 \
    --function-name test \
    --runtime nodejs8.10 \
    --handler index.handler \
    --memory-size 128 \
    --zip-file fileb://test/lambda.zip \
    --role arn:aws:iam::123456:role/irrelevant

npm i

node ./node_modules/.bin/tap test --jobs=10 --coverage-report=html --no-browser
