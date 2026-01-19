# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/compare/1.2.1...1.3.0) (2026-01-19)

### ✨ Features

* **account:** add balance check and minimum balance option ([a061a37](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/a061a3721bd6752bc28daeb890c4bbae24b076b9))

### 🐛 Bug Fixes

* **account:** move getBalance outside iteration loop ([17d3589](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/17d358987b69c68619581020265d5ccbdb86263a))
* **errors:** add user-friendly error messages for API failures ([d95dffd](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/d95dffd53d12a4fc0ba9940d4616399ba8361a96))

### ♻️ Refactoring

* migrate to @n8n/node-cli and fix lint errors ([190d605](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/190d605faab9eb1d2677df3dfe82388f11a138b8))

### 👷 CI/CD

* **release:** install semantic-release plugins in workflow ([36999ec](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/36999ecf5907088366a8724b57a4103ae88e16cb))

## [1.2.1](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/compare/1.2.0...1.2.1) (2026-01-18)

### 🐛 Bug Fixes

* **config:** add context7 configuration file ([002379d](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/002379d69524f06e63abf3eeeb86d9f63ea55c47))

### 📚 Documentation

* **readme:** add Generate with Reference and Chat Model documentation ([5da4cde](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/5da4cdef6f642fe2a82555f105d71e1d4914a998))

## [1.2.0](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/compare/1.1.0...1.2.0) (2026-01-18)

### ✨ Features

* **image:** add Generate with Reference operation ([29a8faa](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/29a8faa28dc5f124d8b4a1201f2ff6b12391fa56))

### 📚 Documentation

* **text:** add HTTP 431 issue analysis and fix plan ([249a7fd](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/249a7fdd7c19111363e9c898c90acd1c82537157))

## [1.1.0](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/compare/1.0.0...1.1.0) (2026-01-12)

### ✨ Features

* **chat:** add Pollinations Chat Model sub-node for AI Agent integration ([c7ff63d](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/c7ff63def03bb5e6d45abba2c172ff1ad7730f5a))
* **models:** add pricing info and fix image auth ([de30b17](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/de30b1721be195a67f8e06484e1547c9a14bc978))
* **models:** filter models by API key permissions ([0d33497](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/0d3349724a4edc7cb36d1327942af2e89c711903))
* **text:** add Generate Text operation with dynamic model loading ([22ab5c2](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/22ab5c2ffe899b80dff2555b3f050f77c3c57a19))

### 🐛 Bug Fixes

* **codex:** use valid category for community nodes ([7b7644c](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/7b7644ca7ce73f66a487036dd391538c82d7867c))
* **icon:** expand viewBox to accommodate drop-shadow ([584c892](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/584c89241409b97e9352d4b2f1a09396df6038be))
* **icon:** simplify SVG by removing drop-shadow filter ([f809d7f](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/f809d7fa438e78c2fdda5ff3414e37ea2089608d))
* **image:** use correct gen.pollinations.ai endpoint ([d8fc882](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/d8fc8824524f3dba472081878dccf7e21198e6a2))
* **node:** add Text subcategory and aliases for AI nodes listing ([db2887c](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/db2887c7d8d58a249043eb3034c7e0c39c71df8a))
* **text:** add authentication header and move JSON Response to basic fields ([cb01ee8](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/cb01ee8fe48e33181ccfc35f8fc35c218af419bc))

### ♻️ Refactoring

* **models:** show responses per dollar instead of cost per token ([552531e](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/552531e197722741e4a7bcbbb58bc334a1562607))
* **text:** move JSON Response to advanced options and update docs ([39fa7af](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/39fa7af2e366452677e2971586c4ad86078c622b))

### 👷 CI/CD

* enable npm publish in semantic-release ([e99ed89](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/e99ed8984df0e52f4fcfdaf4fc996c6e60929c38))

## 1.0.0 (2026-01-11)

### ✨ Features

* initial implementation of Pollinations node ([fa9f0bc](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/fa9f0bcfa6ac6658f77e2705d57065aedd8aa99b))
* **node:** add request metadata to output ([1d17760](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/1d1776015448545d4ef73190a84501d87ed0bb70))

### 🐛 Bug Fixes

* **package:** include source files and prepare script for GitHub install ([a3aad95](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/a3aad953d260a39724fbbfa178a579f7ae24eb93))
* **package:** rename package to n8n-nodes-pollinations-ai ([7202588](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/72025889cb69307dd67d79bfce1134a9c0d21c4f))
* **package:** update references to new package name ([5ad48c2](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/5ad48c2f479d6832a47028bba751b975e933b4e3))

### 📚 Documentation

* **README:** update with badges, output section and install instructions ([3c149b7](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/3c149b726352173af8213c964c8cc9a7effc81c8))

### 👷 CI/CD

* add semantic-release with GitHub Actions workflow ([45414c1](https://github.com/new-xmon-df/n8n-nodes-pollinations-ai/commit/45414c1bad27ba1e81ac921198d7129bf59dbff1))
