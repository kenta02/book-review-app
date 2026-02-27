#!/usr/bin/env node

/**
 * SonarCloud Issue を GitHub Issues に自動作成するスクリプト
 * 
 * 実行環境変数:
 *   - SONAR_TOKEN: SonarCloud API トークン
 *   - GITHUB_TOKEN: GitHub API トークン
 *   - SONAR_HOST_URL: SonarCloud URL (デフォルト: https://sonarcloud.io)
 *   - GH_REPO: GitHubリポジトリ (format: owner/repo)
 */

const https = require('https');
const http = require('http');

// 環境変数
const SONAR_TOKEN = process.env.SONAR_TOKEN || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const SONAR_HOST_URL = process.env.SONAR_HOST_URL || 'https://sonarcloud.io';
const GH_REPO = process.env.GH_REPO || 'kenta02/book-review-app';

// SonarCloud プロジェクトキー
const SONAR_PROJECT_KEY = 'kenta02_book-review-app';

if (!SONAR_TOKEN) {
  console.error('❌ Error: SONAR_TOKEN is not set');
  process.exit(1);
}

if (!GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN is not set');
  process.exit(1);
}

/**
 * HTTPS リクエストをPromiseで実行
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestUrl = new URL(url);
    const isSecure = requestUrl.protocol === 'https:';
    const client = isSecure ? https : http;

    const reqOptions = {
      hostname: requestUrl.hostname,
      port: requestUrl.port,
      path: requestUrl.pathname + requestUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (options.body) {
      const body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: res.statusCode !== 204 ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      const body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(body);
    }

    req.end();
  });
}

/**
 * SonarCloud API から BLOCKER/CRITICAL Issue を取得
 */
async function getSonarCloudIssues() {
  console.log('\n📡 Fetching SonarCloud issues...');

  const url = `${SONAR_HOST_URL}/api/issues/search?componentKeys=${SONAR_PROJECT_KEY}&severities=BLOCKER,CRITICAL&statuses=OPEN&pageSize=100`;

  const headers = {
    Authorization: `Basic ${Buffer.from(`${SONAR_TOKEN}:`).toString('base64')}`,
    'Accept': 'application/json',
  };

  try {
    const response = await makeRequest(url, { headers });

    if (response.statusCode !== 200) {
      console.error(`❌ SonarCloud API Error: ${response.statusCode}`);
      console.error(response.body);
      return [];
    }

    const issues = response.body.issues || [];
    console.log(`✅ Found ${issues.length} issues (BLOCKER/CRITICAL)`);

    return issues;
  } catch (error) {
    console.error('❌ Failed to fetch SonarCloud issues:', error.message);
    return [];
  }
}

/**
 * GitHub Issues から既存の SonarCloud Issue を取得（重複防止）
 */
async function getExistingGitHubIssues() {
  console.log('\n📋 Fetching existing GitHub issues with sonarcloud label...');

  const [owner, repo] = GH_REPO.split('/');
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?labels=sonarcloud&per_page=100&state=open`;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    const response = await makeRequest(url, { headers });

    if (response.statusCode !== 200) {
      console.error(`❌ GitHub API Error: ${response.statusCode}`);
      return [];
    }

    const issues = response.body || [];
    console.log(`✅ Found ${issues.length} existing issues`);

    // SonarCloud Issue キーを抽出して Set に格納
    const existingKeys = new Set();
    issues.forEach((issue) => {
      const match = issue.title.match(/\[SonarCloud\]\s+([A-Z0-9\-]+)/);
      if (match) {
        existingKeys.add(match[1]);
      }
    });

    return existingKeys;
  } catch (error) {
    console.error('❌ Failed to fetch GitHub issues:', error.message);
    return new Set();
  }
}

/**
 * GitHub Issues に新規 Issue を作成
 */
async function createGitHubIssue(sonarIssue, existingKeys) {
  const [owner, repo] = GH_REPO.split('/');
  const url = `https://api.github.com/repos/${owner}/${repo}/issues`;

  // SonarCloud Issue キー（例: "server:src/auth/login.ts:123"）
  const issueKey = `${sonarIssue.component}:${sonarIssue.line || 'N/A'}`;

  // 重複チェック
  if (existingKeys.has(issueKey)) {
    console.log(`⏭️  Skipped (already exists): ${sonarIssue.key}`);
    return null;
  }

  const title = `[SonarCloud] ${issueKey}: ${sonarIssue.message}`;

  // Issue 本文を構成
  const body = `## SonarCloud Security Issue

**Severity**: ${sonarIssue.severity}  
**Type**: ${sonarIssue.type}  
**Status**: ${sonarIssue.status}  
**Key**: ${sonarIssue.key}  

### Message
${sonarIssue.message}

### Location
- **File**: \`${sonarIssue.component}\`
- **Line**: ${sonarIssue.line || 'N/A'}

### Details
${sonarIssue.textRange ? `- **Lines**: ${sonarIssue.textRange.startLine} - ${sonarIssue.textRange.endLine}` : ''}

### Links
- [View on SonarCloud](${SONAR_HOST_URL}/project/issues?id=${SONAR_PROJECT_KEY}&issues=${sonarIssue.key})
- [SonarCloud Rule](${SONAR_HOST_URL}/coding_rules?open=${sonarIssue.rule}&rule_key=${sonarIssue.rule})

### Action Required
1. Review the issue in SonarCloud
2. Apply the fix to the codebase
3. Close this issue once resolved

---
*Auto-created by SonarCloud sync workflow*
`;

  const labels = ['sonarcloud', `severity:${sonarIssue.severity}`];

  const payload = {
    title,
    body,
    labels,
  };

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers,
      body: payload,
    });

    if (response.statusCode === 201) {
      console.log(`✅ Created: #${response.body.number} - ${sonarIssue.key}`);
      return response.body;
    } else {
      console.error(`❌ Failed to create issue (${response.statusCode}):`, response.body);
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to create GitHub issue:', error.message);
    return null;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 SonarCloud Issue Sync Started');
  console.log(`   Repository: ${GH_REPO}`);
  console.log(`   SonarCloud Project: ${SONAR_PROJECT_KEY}`);

  // 1. SonarCloud から Issue 取得
  const sonarIssues = await getSonarCloudIssues();

  if (sonarIssues.length === 0) {
    console.log('\n✨ No SonarCloud issues found. Everything is clean!');
    process.exit(0);
  }

  // 2. 既存の GitHub Issues を取得（重複防止）
  const existingKeys = await getExistingGitHubIssues();

  // 3. GitHub Issues に新規 Issue を作成
  console.log('\n📝 Creating GitHub Issues...');
  let created = 0;
  let skipped = 0;

  for (const sonarIssue of sonarIssues) {
    const result = await createGitHubIssue(sonarIssue, existingKeys);
    if (result) {
      created++;
    } else if (existingKeys.has(`${sonarIssue.component}:${sonarIssue.line || 'N/A'}`)) {
      skipped++;
    }
  }

  // サマリー出力
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log(`✅ Created: ${created} issues`);
  console.log(`⏭️  Skipped: ${skipped} issues (already exist)`);
  console.log(`📌 Total SonarCloud issues: ${sonarIssues.length}`);
  console.log('='.repeat(50));

  process.exit(0);
}

// エラーハンドリング
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
