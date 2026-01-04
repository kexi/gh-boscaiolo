#!/usr/bin/env node

/**
 * パッケージの公開日をチェックし、1日以内に公開されたパッケージを検出する
 * サプライチェーン攻撃対策として使用
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MINIMUM_AGE_DAYS = 1;

async function getPackagePublishDate(packageName, version) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // バージョンが指定されている場合は特定バージョンの公開日を取得
    if (version && data.time && data.time[version]) {
      return new Date(data.time[version]);
    }

    // 最新バージョンの公開日を取得
    const latestVersion = data['dist-tags']?.latest;
    if (latestVersion && data.time && data.time[latestVersion]) {
      return new Date(data.time[latestVersion]);
    }

    return null;
  } catch (error) {
    console.error(`Error fetching data for ${packageName}:`, error.message);
    return null;
  }
}

function parseVersion(versionString) {
  // ^1.0.0, ~1.0.0, >=1.0.0 などのプレフィックスを除去
  const cleanVersion = versionString.replace(/^[\^~>=<]+/, '');
  return cleanVersion;
}

async function checkPackageAges() {
  const packageJsonPath = join(__dirname, '../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const recentPackages = [];
  const now = new Date();

  console.log('パッケージの公開日をチェック中...\n');

  for (const [packageName, versionRange] of Object.entries(allDependencies)) {
    const version = parseVersion(versionRange);
    console.log(`チェック中: ${packageName}@${version}`);

    const publishDate = await getPackagePublishDate(packageName, version);

    if (publishDate) {
      const ageInDays = (now - publishDate) / ONE_DAY_MS;
      console.log(`  公開日: ${publishDate.toISOString()}`);
      console.log(`  経過日数: ${Math.floor(ageInDays)}日`);

      if (ageInDays < MINIMUM_AGE_DAYS) {
        recentPackages.push({
          name: packageName,
          version,
          publishDate,
          ageInDays: Math.floor(ageInDays * 10) / 10, // 小数点1桁まで
        });
      }
    } else {
      console.log('  公開日を取得できませんでした');
    }

    console.log('');

    // レート制限を避けるため少し待機
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n=== チェック結果 ===\n');

  if (recentPackages.length > 0) {
    console.log(`⚠️  警告: ${MINIMUM_AGE_DAYS}日以内に公開されたパッケージが見つかりました:\n`);

    for (const pkg of recentPackages) {
      console.log(`  - ${pkg.name}@${pkg.version}`);
      console.log(`    公開日: ${pkg.publishDate.toISOString()}`);
      console.log(`    経過: ${pkg.ageInDays}日`);
      console.log('');
    }

    console.log('これらのパッケージは新規公開されたばかりです。');
    console.log('サプライチェーン攻撃のリスクを考慮し、インストールを延期することを推奨します。\n');

    process.exit(1);
  } else {
    console.log(`✅ すべてのパッケージは${MINIMUM_AGE_DAYS}日以上経過しています。`);
    process.exit(0);
  }
}

checkPackageAges().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
