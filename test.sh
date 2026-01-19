#!/bin/bash

curl -X PUT \
  -H "x-ms-blob-type: BlockBlob" \
  -H "Content-Type: text/plain" \
  -d "hello world" \
  https://satechpubsai0avmdz.blob.core.windows.net/documents/test/debug/5fddd588-3050-41e8-acac-41490626b1fd.txt?se=2026-01-16T23%3A16%3A33Z&sp=cw&sv=2026-02-06&sr=b&skoid=ae86b460-7bd5-402e-bf22-bf4b07c7e163&sktid=a290c682-1c0c-4c00-bc9a-dc557a656c88&skt=2026-01-16T22%3A16%3A33Z&ske=2026-01-16T23%3A16%3A33Z&sks=b&skv=2026-02-06&sig=UIQjAMbgYxXDbPKVBbd6bT6oUWPA/UyQc3YsxHzUgEM%3D
